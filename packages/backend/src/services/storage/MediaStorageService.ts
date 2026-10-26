import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { AppError, type MediaAttachment } from '@socialgraph/shared';

export interface UploadedFilePayload {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface IMediaStorageProvider {
  save(file: UploadedFilePayload): Promise<MediaAttachment>;
  delete(urlOrFilename: string): Promise<void>;
  getUrl(filename: string): string;
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

const ALLOWED_MIME_TYPES = new Set(Object.keys(MIME_TO_EXT));
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per file

/**
 * Parses basic image dimensions from binary header without external C++ bindings.
 */
function extractImageDimensions(buf: Buffer, mimeType: string): { width: number; height: number; aspect_ratio: number } | null {
  try {
    if (buf.length < 24) return null;

    // PNG
    if (mimeType === 'image/png' && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      if (width > 0 && height > 0) {
        return { width, height, aspect_ratio: Number((width / height).toFixed(3)) };
      }
    }

    // GIF
    if (mimeType === 'image/gif' && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
      const width = buf.readUInt16LE(6);
      const height = buf.readUInt16LE(8);
      if (width > 0 && height > 0) {
        return { width, height, aspect_ratio: Number((width / height).toFixed(3)) };
      }
    }

    // JPEG
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      let i = 2;
      while (i < buf.length - 8) {
        if (buf[i] !== 0xff) break;
        const marker = buf[i + 1];
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          const height = buf.readUInt16BE(i + 5);
          const width = buf.readUInt16BE(i + 7);
          if (width > 0 && height > 0) {
            return { width, height, aspect_ratio: Number((width / height).toFixed(3)) };
          }
        }
        const len = buf.readUInt16BE(i + 2);
        i += 2 + len;
      }
    }

    // WebP
    if (mimeType === 'image/webp' && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
      const format = buf.toString('ascii', 12, 16);
      if (format === 'VP8 ') {
        const width = buf.readUInt16LE(26) & 0x3fff;
        const height = buf.readUInt16LE(28) & 0x3fff;
        if (width > 0 && height > 0) return { width, height, aspect_ratio: Number((width / height).toFixed(3)) };
      } else if (format === 'VP8L') {
        const b1 = buf[21];
        const b2 = buf[22];
        const b3 = buf[23];
        const b4 = buf[24];
        const width = 1 + (((b2 & 0x3f) << 8) | b1);
        const height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
        if (width > 0 && height > 0) return { width, height, aspect_ratio: Number((width / height).toFixed(3)) };
      }
    }
  } catch {
    // Graceful fallback to default aspect ratio
  }
  return null;
}

/**
 * Local disk media storage provider.
 * Stores validated media assets locally and generates durable root-relative URLs.
 * NOTE: Local disk storage is scoped to the host machine. An S3/R2 implementation can
 * be swapped here when shared cloud media storage is provisioned for team Atlas deployment.
 */
export class LocalMediaStorageProvider implements IMediaStorageProvider {
  private uploadDir: string;

  constructor(customUploadDir?: string) {
    if (customUploadDir) {
      this.uploadDir = path.resolve(customUploadDir);
    } else {
      // Default to packages/backend/public/uploads
      this.uploadDir = path.resolve(process.cwd(), 'public/uploads');
    }
    // Ensure directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  public getUploadDir(): string {
    return this.uploadDir;
  }

  public getUrl(filename: string): string {
    return `/uploads/${encodeURIComponent(filename)}`;
  }

  public async save(file: UploadedFilePayload): Promise<MediaAttachment> {
    // 1. Validate MIME type
    const normalizedMime = file.mimeType.toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
      throw AppError.badRequest(
        `Unsupported media type '${file.mimeType}'. Allowed types: JPEG, PNG, WebP, GIF, AVIF, SVG.`
      );
    }

    // 2. Validate file size
    if (file.sizeBytes > MAX_FILE_SIZE_BYTES || file.buffer.length > MAX_FILE_SIZE_BYTES) {
      throw AppError.badRequest(
        `File size exceeds the 10MB limit (received ${Math.round(file.sizeBytes / 1024 / 1024)}MB).`
      );
    }

    if (file.buffer.length === 0) {
      throw AppError.badRequest('Uploaded file is empty.');
    }

    // 3. Generate collision-resistant sanitized filename
    const ext = MIME_TO_EXT[normalizedMime] || 'bin';
    const mediaId = `med_${Date.now()}_${randomBytes(6).toString('hex')}`;
    const filename = `${mediaId}.${ext}`;
    const targetPath = path.join(this.uploadDir, filename);

    // Guard against path traversal
    if (!targetPath.startsWith(this.uploadDir)) {
      throw AppError.badRequest('Invalid destination file path.');
    }

    // 4. Write to disk
    await fs.promises.writeFile(targetPath, file.buffer);

    // 5. Compute dimensions and aspect ratio
    const dims = extractImageDimensions(file.buffer, normalizedMime);
    const width = dims?.width;
    const height = dims?.height;
    const aspectRatio = dims?.aspect_ratio || 1.33;

    // Sanitize original filename for alt text
    const cleanAlt = file.originalFilename
      ? path.basename(file.originalFilename).replace(/\.[^/.]+$/, '').slice(0, 100)
      : 'Attached media';

    return {
      id: mediaId,
      url: this.getUrl(filename),
      aspect_ratio: aspectRatio,
      width,
      height,
      alt_text: cleanAlt,
    };
  }

  public async delete(urlOrFilename: string): Promise<void> {
    const filename = path.basename(urlOrFilename);
    const targetPath = path.join(this.uploadDir, filename);
    if (targetPath.startsWith(this.uploadDir) && fs.existsSync(targetPath)) {
      try {
        await fs.promises.unlink(targetPath);
      } catch {
        // Suppress unlink error
      }
    }
  }
}

// Global default singleton provider
export const mediaStorage = new LocalMediaStorageProvider();

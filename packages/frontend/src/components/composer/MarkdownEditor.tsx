import React, { useState, useRef, useId } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Code,
  SquareCode,
  Quote,
  List,
  Link as LinkIcon,
  Eye,
  Edit3,
} from 'lucide-react';

export interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  placeholder?: string;
  id?: string;
  maxLength?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  error,
  placeholder = 'Share architectural decisions, RFC benchmarks, trade-offs, or questions... (Markdown supported)',
  id,
  maxLength = 40000,
}: MarkdownEditorProps) {
  const generatedId = useId();
  const editorId = id || `md-editor-${generatedId}`;
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to insert markdown syntax around selected text or at cursor
  const insertSyntax = (before: string, after = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = value.substring(start, end) || defaultText;

    const replacement = `${before}${selection}${after}`;
    const nextVal = value.substring(0, start) + replacement + value.substring(end);

    onChange(nextVal);

    // Reposition cursor after inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selection.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Dependency-free markdown renderer for rich preview
  const renderMarkdown = (text: string) => {
    if (!text.trim()) {
      return (
        <div className="py-12 text-center text-text-muted italic text-sm">
          Nothing to preview yet. Switch back to &ldquo;Write&rdquo; to author your discussion.
        </div>
      );
    }

    // Split text into blocks
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start / end
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = line.trim().slice(3).trim();
          codeBlockContent = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <div
              key={`code-${i}`}
              className="my-3 rounded-xl bg-surface-subtle text-text-primary p-4 font-mono text-xs overflow-x-auto border border-border"
            >
              {codeBlockLang && (
                <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2 border-b border-border pb-1">
                  {codeBlockLang}
                </div>
              )}
              <pre className="leading-relaxed">
                <code>{codeBlockContent.join('\n')}</code>
              </pre>
            </div>
          );
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Headings
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={i} className="text-sm font-bold text-text-primary mt-3 mb-1">
            {formatInline(line.slice(4))}
          </h4>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h3 key={i} className="text-base font-bold text-text-primary mt-4 mb-1.5">
            {formatInline(line.slice(3))}
          </h3>
        );
        continue;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h2 key={i} className="text-lg font-bold text-text-primary mt-4 mb-2">
            {formatInline(line.slice(2))}
          </h2>
        );
        continue;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={i}
            className="my-2 pl-3.5 border-l-2 border-primary/60 italic text-sm text-text-muted"
          >
            {formatInline(line.slice(2))}
          </blockquote>
        );
        continue;
      }

      // Bullet lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={i} className="ml-4 list-disc text-sm text-text-secondary my-0.5">
            {formatInline(line.slice(2))}
          </li>
        );
        continue;
      }

      // Empty lines
      if (!line.trim()) {
        elements.push(<div key={i} className="h-2" />);
        continue;
      }

      // Standard paragraphs
      elements.push(
        <p key={i} className="text-sm text-text-secondary leading-relaxed my-1">
          {formatInline(line)}
        </p>
      );
    }

    return elements;
  };

  // Formats bold, italics, inline code, and links
  const formatInline = (text: string): React.ReactNode => {
    // Split on inline markdown tokens
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining) {
      // Inline code `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded bg-surface-subtle text-primary text-xs font-mono font-medium border border-border/40"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold **bold**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={keyIdx++} className="font-bold text-text-primary">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic *italic*
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        parts.push(
          <em key={keyIdx++} className="italic">
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Link [label](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={keyIdx++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Plain char
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    }

    return parts;
  };

  return (
    <div className="w-full text-left">
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={editorId}
          className="block text-xs font-semibold text-text-primary uppercase tracking-wider"
        >
          Discussion Body <span className="text-red-500">*</span>
        </label>

        {/* Write vs Preview Mode Tabs */}
        <div
          role="tablist"
          aria-label="Discussion Editor Modes"
          className="inline-flex rounded-lg bg-surface-subtle p-0.5 border border-border"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'write'}
            aria-controls={`${editorId}-write-panel`}
            id={`${editorId}-write-tab`}
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'write'
                ? 'bg-surface-card text-primary shadow-xs border border-border/40'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Edit3 size={13} />
            <span>Write</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'preview'}
            aria-controls={`${editorId}-preview-panel`}
            id={`${editorId}-preview-tab`}
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-surface-card text-primary shadow-xs border border-border/40'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Eye size={13} />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Box */}
      <div
        className={`rounded-2xl border transition-all overflow-hidden ${
          error
            ? 'border-red-500 ring-1 ring-red-500'
            : 'border-border focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent'
        } bg-surface-card`}
      >
        {/* Markdown Toolbar (Only visible in Write mode) */}
        {activeTab === 'write' && (
          <div
            role="toolbar"
            aria-label="Markdown formatting tools"
            className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-surface-subtle text-text-secondary"
          >
            <button
              type="button"
              title="Bold (**text**)"
              aria-label="Bold"
              onClick={() => insertSyntax('**', '**', 'bold text')}
              className="p-1.5 rounded-md hover:bg-surface-card hover:text-text-primary transition-colors"
            >
              <Bold size={15} />
            </button>
            <button
              type="button"
              title="Italic (*text*)"
              aria-label="Italic"
              onClick={() => insertSyntax('*', '*', 'italic text')}
              className="p-1.5 rounded-md hover:bg-surface-card hover:text-text-primary transition-colors"
            >
              <Italic size={15} />
            </button>
            <button
              type="button"
              title="Heading (## Heading)"
              aria-label="Heading"
              onClick={() => insertSyntax('\n## ', '\n', 'Heading')}
              className="p-1.5 rounded-md hover:bg-surface-card hover:text-text-primary transition-colors"
            >
              <Heading2 size={15} />
            </button>

            <div className="h-4 w-px bg-border mx-1" aria-hidden="true" />

            <button
              type="button"
              title="Inline Code (`code`)"
              aria-label="Inline Code"
              onClick={() => insertSyntax('`', '`', 'code')}
              className="p-1.5 rounded-md hover:bg-surface-card hover:text-text-primary transition-colors"
            >
              <Code size={15} />
            </button>
            <button
              type="button"
              title="Code Block (```language)"
              aria-label="Code Block"
              onClick={() => insertSyntax('\n```typescript\n', '\n```\n', '// code snippet')}
              className="p-1.5 rounded-md hover:bg-surface-card hover:text-text-primary transition-colors"
            >
              <SquareCode size={15} />
            </button>

            <div className="h-4 w-px bg-border mx-1" aria-hidden="true" />

            <button
              type="button"
              title="Quote (> quote)"
              aria-label="Quote"
              onClick={() => insertSyntax('\n> ', '\n', 'quote')}
              className="p-1.5 rounded-md hover:bg-surface-card hover:text-text-primary transition-colors"
            >
              <Quote size={15} />
            </button>
            <button
              type="button"
              title="Bullet List (- item)"
              aria-label="Bullet List"
              onClick={() => insertSyntax('\n- ', '\n', 'List item')}
              className="p-1.5 rounded-md hover:bg-surface-card hover:text-text-primary transition-colors"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              title="Link ([title](url))"
              aria-label="Link"
              onClick={() => insertSyntax('[', '](https://example.com)', 'link title')}
              className="p-1.5 rounded-md hover:bg-surface-card hover:text-text-primary transition-colors"
            >
              <LinkIcon size={15} />
            </button>
          </div>
        )}

        {/* Content Pane: Write or Preview */}
        {activeTab === 'write' ? (
          <div
            id={`${editorId}-write-panel`}
            role="tabpanel"
            aria-labelledby={`${editorId}-write-tab`}
          >
            <textarea
              ref={textareaRef}
              id={editorId}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={12}
              maxLength={maxLength}
              className="w-full p-4 text-sm bg-transparent text-text-primary placeholder-text-muted border-0 focus:outline-none resize-y min-h-[220px] font-sans leading-relaxed"
            />
          </div>
        ) : (
          <div
            id={`${editorId}-preview-panel`}
            role="tabpanel"
            aria-labelledby={`${editorId}-preview-tab`}
            data-testid="markdown-preview-pane"
            className="p-5 min-h-[220px] max-h-[500px] overflow-y-auto bg-surface-subtle/50 border-t sm:border-t-0 border-border"
          >
            {renderMarkdown(value)}
          </div>
        )}

        {/* Footer info: character guidance */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface-subtle text-[11px] text-text-muted">
          <span>Markdown syntax supported</span>
          <span className={value.length > maxLength * 0.9 ? 'text-amber-500 font-bold' : ''}>
            {value.length.toLocaleString()} / {maxLength.toLocaleString()} characters
          </span>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-500 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export default MarkdownEditor;

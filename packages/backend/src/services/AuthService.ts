import { randomBytes, createHmac } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/mongo.js';
import { COLLECTIONS } from '../db/collections.js';
import type { UserDoc, SessionDoc } from '../db/types.js';
import { AppError } from '@socialgraph/shared';
import { config } from '../config/env.js';

const SESSION_MS = 1000 * 60 * 60 * 24 * 7;
export function resolveLoginUsername(login: string, environment: string = config.NODE_ENV): string {
  const normalized = login.trim().toLowerCase();
  if (normalized !== 'admin') return normalized;
  return environment === 'development' ? 'alex_dev' : '__development_admin_login_disabled__';
}
const safeUser = (u: UserDoc) => ({ id: u._id, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url || '/avatars/alex-dev.svg', role: u.role ?? 'user' });
const sessionId = (token: string) => createHmac('sha256', config.SESSION_SECRET).update(token).digest('hex');
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
export async function verifyPassword(password: string, encoded?: string): Promise<boolean> {
  if (!encoded) { await bcrypt.hash(password, 12); return false; }
  try { return await bcrypt.compare(password, encoded); } catch { return false; }
}
export class AuthService {
  constructor(private readonly environment: string = config.NODE_ENV) {}
  private users = () => getDb().collection<UserDoc>(COLLECTIONS.USERS);
  private sessions = () => getDb().collection<SessionDoc>(COLLECTIONS.SESSIONS);
  async register(username: string, password: string) {
    const normalized = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(normalized)) throw AppError.badRequest('Username must be 3–30 letters, numbers, or underscores.');
    if (normalized === 'admin') throw AppError.badRequest('This username is reserved.');
    if (password.length < 8 || password.length > 128) throw AppError.badRequest('Password must be 8–128 characters.');
    const user: UserDoc = { _id: `usr_${randomBytes(12).toString('hex')}`, username: normalized, display_name: username.trim(), avatar_url: '/avatars/alex-dev.svg', bio: '', is_verified: false, followers_count: 0, following_count: 0, posts_count: 0, created_at: new Date(), updated_at: new Date(), role: 'user', password_hash: await hashPassword(password) };
    try { await this.users().insertOne(user); } catch (error: any) { if (error?.code === 11000) throw AppError.badRequest('Username is already registered.'); throw error; }
    return safeUser(user);
  }
  async login(login: string, password: string) {
    const user = await this.users().findOne({ username: resolveLoginUsername(login, this.environment) });
    if (!user || !(await verifyPassword(password, user.password_hash))) throw AppError.unauthorized('Invalid username or password.');
    return { user: safeUser(user), session: await this.createSession(user._id) };
  }
  async createSession(userId: string) {
    const token = randomBytes(32).toString('base64url');
    const csrf = randomBytes(24).toString('base64url');
    await this.sessions().insertOne({ _id: sessionId(token), user_id: userId, csrf_token: csrf, created_at: new Date(), expires_at: new Date(Date.now() + SESSION_MS) });
    return { token, csrf };
  }
  async session(token?: string) {
    if (!token) return null;
    const session = await this.sessions().findOne({ _id: sessionId(token), expires_at: { $gt: new Date() } });
    if (!session) return null;
    const user = await this.users().findOne({ _id: session.user_id });
    return user ? { user: safeUser(user), csrf: session.csrf_token } : null;
  }
  async logout(token?: string) { if (token) await this.sessions().deleteOne({ _id: sessionId(token) }); }
}

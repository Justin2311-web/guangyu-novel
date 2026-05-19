// Shared domain types — mirror of supabase/migrations/0001_initial.sql.
// Phase 2+ will replace these with generated types from `supabase gen types`.

export type Role = 'superadmin' | 'admin' | 'author' | 'reader';

export type NovelStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'archived';

export type ChapterStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'archived';

export const ROLES: readonly Role[] = [
  'superadmin',
  'admin',
  'author',
  'reader',
] as const;

export const NOVEL_STATUSES: readonly NovelStatus[] = [
  'draft',
  'pending_review',
  'published',
  'rejected',
  'archived',
] as const;

export const CHAPTER_STATUSES: readonly ChapterStatus[] = [
  'draft',
  'pending_review',
  'published',
  'rejected',
  'archived',
] as const;

export interface Profile {
  id: string;
  role: Role;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Author {
  id: string;
  profile_id: string;
  pen_name: string;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Novel {
  id: string;
  author_id: string;
  category_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  status: NovelStatus;
  featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface Chapter {
  id: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  content: string;
  status: ChapterStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  button_label: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  novel_id: string;
  created_at: string;
}

export interface ReadingHistory {
  id: string;
  user_id: string;
  novel_id: string;
  chapter_id: string | null;
  last_read_at: string;
}

export function isPublishedNovelStatus(status: NovelStatus): boolean {
  return status === 'published';
}

export function canManageContent(role: Role | null | undefined): boolean {
  return role === 'superadmin' || role === 'admin';
}

export function isSuperadmin(role: Role | null | undefined): boolean {
  return role === 'superadmin';
}

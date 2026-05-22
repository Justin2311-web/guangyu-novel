// Shared domain types — mirror of supabase/migrations/0001_initial.sql.
// Phase 2+ will replace these with generated types from `supabase gen types`.

export type Role = 'superadmin' | 'admin' | 'author' | 'reader';

// Review workflow status (kept for Phase 4 author submission flow).
export type NovelReviewStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'archived';

// Backwards-compatible alias.
export type NovelStatus = NovelReviewStatus;

// Serialization status (Phase 3b).
export type NovelSerialStatus = 'ongoing' | 'completed' | 'hiatus';

export const NOVEL_SERIAL_STATUSES: readonly NovelSerialStatus[] = [
  'ongoing',
  'completed',
  'hiatus',
] as const;

export const NOVEL_SERIAL_STATUS_LABELS: Record<NovelSerialStatus, string> = {
  ongoing: '连载中',
  completed: '已完结',
  hiatus: '暂停',
};

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

export const USER_ROLE_LABELS: Record<Role, string> = {
  superadmin: '超级管理员',
  admin: '管理员',
  author: '作者',
  reader: '读者',
};

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

export const CHAPTER_STATUS_LABELS: Record<ChapterStatus, string> = {
  draft: '草稿',
  pending_review: '待审核',
  published: '已发布',
  rejected: '已退回',
  archived: '已归档',
};

export interface Profile {
  id: string;
  role: Role;
  display_name: string | null;
  avatar_url: string | null;
  suspended: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Author {
  id: string;
  profile_id: string;
  pen_name: string;
  bio: string | null;
  status: 'active' | 'suspended';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type AuthorApplicationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision_requested';

export const AUTHOR_APPLICATION_STATUSES: readonly AuthorApplicationStatus[] = [
  'pending',
  'approved',
  'rejected',
  'revision_requested',
] as const;

export const AUTHOR_APPLICATION_STATUS_LABELS: Record<AuthorApplicationStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  revision_requested: '需修改',
};

export interface AuthorApplication {
  id: string;
  user_id: string;
  pen_name: string;
  bio: string | null;
  genre: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  social_link: string | null;
  sample_text: string | null;
  status: AuthorApplicationStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
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
  cover_image_url: string | null;
  status: NovelSerialStatus;
  is_published: boolean;
  review_status: NovelReviewStatus;
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
  mobile_image_url: string | null;
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

// =====================================================================
// Site settings — canonical key/value config edited from the admin CMS
// and consumed by the reader site. Stored in public.site_settings as
// jsonb string values, keyed by these dotted keys.
// =====================================================================
export const SITE_SETTING_KEYS = [
  // General
  'site.name',
  'site.description',
  'site.logo_url',
  'site.favicon_url',
  // Homepage
  'home.hero_title',
  'home.hero_subtitle',
  'home.hero_cta_text',
  'home.hero_cta_link',
  // SEO
  'seo.meta_title',
  'seo.meta_description',
  'seo.meta_keywords',
  // Social media
  'social.facebook',
  'social.instagram',
  'social.tiktok',
  'social.youtube',
  'social.discord',
  // Contact
  'contact.email',
  'contact.phone',
  'contact.address',
  // Footer
  'footer.about',
  'footer.copyright',
] as const;

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];

export type SiteSettings = Record<SiteSettingKey, string>;

export const SITE_SETTINGS_DEFAULTS: SiteSettings = {
  'site.name': '光羽小说',
  'site.description': '光羽小说 — 阅读优质中文小说的开放平台。',
  'site.logo_url': '',
  'site.favicon_url': '',
  'home.hero_title': '欢迎来到 光羽小说',
  'home.hero_subtitle': '阅读优质中文小说。后续阶段将接入推荐、最新更新与作者后台等功能。',
  'home.hero_cta_text': '进入书库',
  'home.hero_cta_link': '/novels',
  'seo.meta_title': '光羽小说',
  'seo.meta_description': '光羽小说 — 阅读优质中文小说的开放平台。',
  'seo.meta_keywords': '小说,中文小说,在线阅读',
  'social.facebook': '',
  'social.instagram': '',
  'social.tiktok': '',
  'social.youtube': '',
  'social.discord': '',
  'contact.email': '',
  'contact.phone': '',
  'contact.address': '',
  'footer.about': '',
  'footer.copyright': '© 光羽小说. All rights reserved.',
};

/** Merge raw site_settings rows over the defaults, ignoring unknown keys. */
export function parseSiteSettings(
  rows: { key: string; value: unknown }[] | null | undefined,
): SiteSettings {
  const out: SiteSettings = { ...SITE_SETTINGS_DEFAULTS };
  for (const row of rows ?? []) {
    if ((SITE_SETTING_KEYS as readonly string[]).includes(row.key)) {
      const v = row.value;
      out[row.key as SiteSettingKey] = typeof v === 'string' ? v : v == null ? '' : String(v);
    }
  }
  return out;
}

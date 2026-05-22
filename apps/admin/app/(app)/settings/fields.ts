import type { SiteSettingKey } from '@guangyu/database';

export type SettingsActionResult = { ok: boolean; error?: string };

export type FieldType = 'text' | 'textarea' | 'url' | 'image';

export type SettingField = {
  key: SiteSettingKey;
  label: string;
  type: FieldType;
  placeholder?: string;
};

export type SettingGroup = {
  title: string;
  fields: SettingField[];
};

export const SETTING_GROUPS: SettingGroup[] = [
  {
    title: '基础信息',
    fields: [
      { key: 'site.name', label: '站点名称', type: 'text' },
      { key: 'site.description', label: '站点简介', type: 'textarea' },
      { key: 'site.logo_url', label: 'Logo 图片 URL', type: 'image', placeholder: 'https://…' },
      { key: 'site.favicon_url', label: 'Favicon 图片 URL', type: 'image', placeholder: 'https://…' },
    ],
  },
  {
    title: '首页',
    fields: [
      { key: 'home.hero_title', label: '主标题', type: 'text' },
      { key: 'home.hero_subtitle', label: '副标题', type: 'textarea' },
      { key: 'home.hero_cta_text', label: '按钮文字', type: 'text' },
      { key: 'home.hero_cta_link', label: '按钮链接', type: 'text', placeholder: '/novels' },
    ],
  },
  {
    title: 'SEO',
    fields: [
      { key: 'seo.meta_title', label: 'Meta 标题', type: 'text' },
      { key: 'seo.meta_description', label: 'Meta 描述', type: 'textarea' },
      { key: 'seo.meta_keywords', label: 'Meta 关键词（逗号分隔）', type: 'text' },
    ],
  },
  {
    title: '社交媒体',
    fields: [
      { key: 'social.facebook', label: 'Facebook URL', type: 'url', placeholder: 'https://…' },
      { key: 'social.instagram', label: 'Instagram URL', type: 'url', placeholder: 'https://…' },
      { key: 'social.tiktok', label: 'TikTok URL', type: 'url', placeholder: 'https://…' },
      { key: 'social.youtube', label: 'YouTube URL', type: 'url', placeholder: 'https://…' },
      { key: 'social.discord', label: 'Discord URL', type: 'url', placeholder: 'https://…' },
    ],
  },
  {
    title: '联系方式',
    fields: [
      { key: 'contact.email', label: '邮箱', type: 'text' },
      { key: 'contact.phone', label: '电话', type: 'text' },
      { key: 'contact.address', label: '地址', type: 'textarea' },
    ],
  },
  {
    title: '页脚',
    fields: [
      { key: 'footer.about', label: '关于文字', type: 'textarea' },
      { key: 'footer.copyright', label: '版权文字', type: 'text' },
    ],
  },
];

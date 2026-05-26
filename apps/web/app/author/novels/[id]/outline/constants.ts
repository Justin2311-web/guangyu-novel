export type OutlineSectionType =
  | 'worldview'
  | 'plotline'
  | 'protagonist'
  | 'character'
  | 'faction'
  | 'location'
  | 'foreshadowing'
  | 'unresolved_hook'
  | 'timeline'
  | 'note';

export type OutlineStatus = 'active' | 'resolved' | 'archived';

export const SECTION_TYPES: { value: OutlineSectionType; label: string }[] = [
  { value: 'worldview', label: '世界观' },
  { value: 'plotline', label: '剧情线' },
  { value: 'protagonist', label: '主角' },
  { value: 'character', label: '重要角色' },
  { value: 'faction', label: '阵营/势力' },
  { value: 'location', label: '地点/地图' },
  { value: 'foreshadowing', label: '伏笔' },
  { value: 'unresolved_hook', label: '未填坑' },
  { value: 'timeline', label: '时间线' },
  { value: 'note', label: '设定备注' },
];

export const SECTION_LABEL: Record<OutlineSectionType, string> = Object.fromEntries(
  SECTION_TYPES.map((s) => [s.value, s.label]),
) as Record<OutlineSectionType, string>;

/** Section types where the active/resolved/archived status is meaningful. */
export const STATUS_SECTION_TYPES: OutlineSectionType[] = ['foreshadowing', 'unresolved_hook'];

export const STATUS_LABEL: Record<OutlineStatus, string> = {
  active: '未处理',
  resolved: '已回收/已解决',
  archived: '已废弃',
};

export const OUTLINE_TABS: { value: string; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'worldview', label: '世界观' },
  { value: 'plotline', label: '剧情线' },
  { value: 'character', label: '角色' }, // groups protagonist + character
  { value: 'foreshadowing', label: '伏笔' },
  { value: 'unresolved_hook', label: '未填坑' },
  { value: 'timeline', label: '时间线' },
  { value: 'note', label: '备注' },
];

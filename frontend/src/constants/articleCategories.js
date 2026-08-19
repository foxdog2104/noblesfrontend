export const ARTICLE_CATEGORIES = [
  { value: 'articles', label: 'Articles' },
  { value: 'recent-shoots', label: 'Recent Shoots' },
  { value: 'agency-announcements', label: 'Agency Announcements' },
  { value: 'magazine-features', label: 'Magazine Features' },
];

export const getArticleCategoryLabel = (value) => (
  ARTICLE_CATEGORIES.find((category) => category.value === value)?.label || 'Uncategorized'
);

export function categoryToSlug(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '-');
}

export function tagToSlug(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, '-');
}

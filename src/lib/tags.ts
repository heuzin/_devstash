export function parseTagsInput(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/** Appends a tag to a comma-separated tags input, skipping case-insensitive duplicates. */
export function addTagToInput(value: string, tag: string): string {
  const tags = parseTagsInput(value);
  if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
    return tags.join(", ");
  }
  return [...tags, tag].join(", ");
}

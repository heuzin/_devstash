import { CodeEditor } from "@/components/items/code-editor";
import { MarkdownEditor } from "@/components/items/markdown-editor";
import type { ItemDetail } from "@/lib/db/items";
import { CODE_EDITOR_FALLBACK_LANGUAGE, MARKDOWN_EDITOR_TYPE_NAMES } from "@/lib/item-types";
import { formatFileSize } from "@/lib/upload-constraints";

export function ItemContentSection({ item }: { item: ItemDetail }) {
  if (item.contentType === "URL" && item.url) {
    return (
      <section className="space-y-1.5">
        <h3 className="text-sm font-medium text-muted-foreground">URL</h3>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-sm text-primary hover:underline"
        >
          {item.url}
        </a>
      </section>
    );
  }

  if (item.contentType === "FILE") {
    if (!item.fileUrl) {
      return (
        <section className="space-y-1.5">
          <h3 className="text-sm font-medium text-muted-foreground">File</h3>
          <p className="text-sm text-muted-foreground">No file uploaded yet</p>
        </section>
      );
    }

    if (item.itemType.name === "image") {
      return (
        <section className="space-y-1.5">
          <h3 className="text-sm font-medium text-muted-foreground">Image</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.fileUrl}
            alt={item.fileName ?? item.title}
            className="max-h-80 w-full rounded-lg border border-border object-contain"
          />
        </section>
      );
    }

    return (
      <section className="space-y-1.5">
        <h3 className="text-sm font-medium text-muted-foreground">File</h3>
        <div className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
          <span className="truncate font-medium">{item.fileName}</span>
          {item.fileSize !== null && (
            <span className="shrink-0 text-muted-foreground">{formatFileSize(item.fileSize)}</span>
          )}
        </div>
      </section>
    );
  }

  if (!item.content) return null;

  const fallbackLanguage = CODE_EDITOR_FALLBACK_LANGUAGE[item.itemType.name];
  const isMarkdown = MARKDOWN_EDITOR_TYPE_NAMES.has(item.itemType.name);

  return (
    <section className="space-y-1.5">
      <h3 className="text-sm font-medium text-muted-foreground">Content</h3>
      {fallbackLanguage ? (
        <CodeEditor value={item.content} language={item.language} fallbackLanguage={fallbackLanguage} readOnly />
      ) : isMarkdown ? (
        <MarkdownEditor value={item.content} readOnly />
      ) : (
        <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap">
          {item.content}
        </pre>
      )}
    </section>
  );
}

"use client";

import { CodeEditor } from "@/components/items/code-editor";
import { MarkdownEditor } from "@/components/items/markdown-editor";
import { Textarea } from "@/components/ui/textarea";
import { CODE_EDITOR_FALLBACK_LANGUAGE, MARKDOWN_EDITOR_TYPE_NAMES } from "@/lib/item-types";

interface ItemContentFieldProps {
  typeName: string;
  value: string;
  onChange: (value: string) => void;
  language?: string | null;
  textareaId?: string;
  rows?: number;
}

export function ItemContentField({
  typeName,
  value,
  onChange,
  language,
  textareaId,
  rows = 8,
}: ItemContentFieldProps) {
  const fallbackLanguage = CODE_EDITOR_FALLBACK_LANGUAGE[typeName];
  if (fallbackLanguage) {
    return (
      <CodeEditor
        value={value}
        onChange={onChange}
        language={language}
        fallbackLanguage={fallbackLanguage}
      />
    );
  }

  if (MARKDOWN_EDITOR_TYPE_NAMES.has(typeName)) {
    return <MarkdownEditor value={value} onChange={onChange} />;
  }

  return (
    <Textarea
      id={textareaId}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      className="font-mono text-xs"
    />
  );
}

"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CODE_LANGUAGE_OPTIONS } from "@/lib/monaco-languages";

interface LanguageSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  fallbackLanguage: string;
}

export function LanguageSelect({ id, value, onChange, fallbackLanguage }: LanguageSelectProps) {
  const labelFor = (language: string) =>
    CODE_LANGUAGE_OPTIONS.find((option) => option.value === language)?.label ?? language;
  const defaultLabel = `Default (${labelFor(fallbackLanguage)})`;
  // Keep a stored language that isn't in the list selectable instead of dropping it.
  const isCustomValue = value.length > 0 && !CODE_LANGUAGE_OPTIONS.some((o) => o.value === value);

  return (
    <Select value={value || null} onValueChange={(next) => onChange(next ?? "")}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={defaultLabel}>
          {() => (value ? labelFor(value) : defaultLabel)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={null}>{defaultLabel}</SelectItem>
        {isCustomValue && <SelectItem value={value}>{value}</SelectItem>}
        {CODE_LANGUAGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Maps the free-text `language` field users type (e.g. "ts", "Python") to a
// Monaco language id. Unrecognized input is passed through as-is so Monaco
// falls back to plaintext highlighting rather than erroring.
const MONACO_LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  shell: "shell",
  yml: "yaml",
  md: "markdown",
  rs: "rust",
  "c++": "cpp",
  cs: "csharp",
};

export function resolveMonacoLanguage(language: string | null | undefined, fallback: string): string {
  if (!language || language.trim().length === 0) return fallback;
  const normalized = language.trim().toLowerCase();
  return MONACO_LANGUAGE_ALIASES[normalized] ?? normalized;
}

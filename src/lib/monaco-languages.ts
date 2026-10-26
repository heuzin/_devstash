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

// Languages offered in the language dropdown, keyed by Monaco language id.
export const CODE_LANGUAGE_OPTIONS = [
  { value: "plaintext", label: "Plain text" },
  { value: "shell", label: "Shell" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "markdown", label: "Markdown" },
  { value: "sql", label: "SQL" },
  { value: "graphql", label: "GraphQL" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "powershell", label: "PowerShell" },
] as const;

export function resolveMonacoLanguage(language: string | null | undefined, fallback: string): string {
  if (!language || language.trim().length === 0) return fallback;
  const normalized = language.trim().toLowerCase();
  return MONACO_LANGUAGE_ALIASES[normalized] ?? normalized;
}

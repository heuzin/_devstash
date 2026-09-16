// Mock data for the dashboard UI. Single source of truth until a real
// database is wired up. Shape mirrors the Prisma schema draft in
// context/project-overview.md, simplified for display purposes.

export type ContentType = "TEXT" | "URL" | "FILE";

export interface User {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemType {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // hex
  isSystem: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  content: string | null;
  url: string | null;
  itemTypeId: string;
  collectionIds: string[];
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const CURRENT_USER: User = {
  id: "user_1",
  name: "John Doe",
  email: "demo@devstash.io",
  isPro: false,
  createdAt: new Date("2025-11-01"),
  updatedAt: new Date("2025-11-01"),
};

export const ITEM_TYPES: ItemType[] = [
  {
    id: "type_snippet",
    name: "snippet",
    icon: "Code",
    color: "#3b82f6",
    isSystem: true,
  },
  {
    id: "type_prompt",
    name: "prompt",
    icon: "Sparkles",
    color: "#8b5cf6",
    isSystem: true,
  },
  {
    id: "type_command",
    name: "command",
    icon: "Terminal",
    color: "#f97316",
    isSystem: true,
  },
  {
    id: "type_note",
    name: "note",
    icon: "StickyNote",
    color: "#fde047",
    isSystem: true,
  },
  {
    id: "type_file",
    name: "file",
    icon: "File",
    color: "#6b7280",
    isSystem: true,
  },
  {
    id: "type_image",
    name: "image",
    icon: "Image",
    color: "#ec4899",
    isSystem: true,
  },
  {
    id: "type_link",
    name: "link",
    icon: "Link",
    color: "#10b981",
    isSystem: true,
  },
];

export const COLLECTIONS: Collection[] = [
  {
    id: "col_react_patterns",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    isFavorite: true,
    itemCount: 12,
    createdAt: new Date("2025-12-01"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "col_python_snippets",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    isFavorite: false,
    itemCount: 8,
    createdAt: new Date("2025-12-02"),
    updatedAt: new Date("2025-12-28"),
  },
  {
    id: "col_context_files",
    name: "Context Files",
    description: "AI context files for projects",
    isFavorite: true,
    itemCount: 5,
    createdAt: new Date("2025-12-03"),
    updatedAt: new Date("2025-12-20"),
  },
  {
    id: "col_interview_prep",
    name: "Interview Prep",
    description: "Technical interview preparation",
    isFavorite: false,
    itemCount: 24,
    createdAt: new Date("2025-12-04"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "col_git_commands",
    name: "Git Commands",
    description: "Frequently used git commands",
    isFavorite: true,
    itemCount: 15,
    createdAt: new Date("2025-12-05"),
    updatedAt: new Date("2026-01-05"),
  },
  {
    id: "col_ai_prompts",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    isFavorite: false,
    itemCount: 18,
    createdAt: new Date("2025-12-06"),
    updatedAt: new Date("2026-01-08"),
  },
];

export const ITEMS: Item[] = [
  {
    id: "item_use_auth_hook",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    contentType: "TEXT",
    content: "export function useAuth() {\n  // ...\n}",
    url: null,
    itemTypeId: "type_snippet",
    collectionIds: ["col_react_patterns", "col_interview_prep"],
    tags: ["react", "auth", "hooks"],
    isFavorite: true,
    isPinned: true,
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "item_api_error_handling",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    contentType: "TEXT",
    content: "async function fetchWithRetry(url: string) {\n  // ...\n}",
    url: null,
    itemTypeId: "type_snippet",
    collectionIds: ["col_react_patterns"],
    tags: ["react", "api", "error-handling"],
    isFavorite: false,
    isPinned: true,
    createdAt: new Date("2026-01-12"),
    updatedAt: new Date("2026-01-12"),
  },
  {
    id: "item_debounce_hook",
    title: "useDebounce Hook",
    description: "Debounce a fast-changing value in React",
    contentType: "TEXT",
    content:
      "export function useDebounce(value: unknown, delay: number) {\n  // ...\n}",
    url: null,
    itemTypeId: "type_snippet",
    collectionIds: ["col_react_patterns"],
    tags: ["react", "hooks", "performance"],
    isFavorite: false,
    isPinned: false,
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-10"),
  },
  {
    id: "item_refactor_prompt",
    title: "Refactor Prompt",
    description: "Prompt for refactoring messy code into clean functions",
    contentType: "TEXT",
    content:
      "Refactor the following code for readability and testability:\n\n{{code}}",
    url: null,
    itemTypeId: "type_prompt",
    collectionIds: ["col_ai_prompts"],
    tags: ["refactor", "prompt-engineering"],
    isFavorite: false,
    isPinned: false,
    createdAt: new Date("2026-01-08"),
    updatedAt: new Date("2026-01-08"),
  },
  {
    id: "item_docker_compose_up",
    title: "docker compose up -d",
    description: "Start containers in detached mode",
    contentType: "TEXT",
    content: "docker compose up -d",
    url: null,
    itemTypeId: "type_command",
    collectionIds: ["col_git_commands"],
    tags: ["docker"],
    isFavorite: false,
    isPinned: false,
    createdAt: new Date("2026-01-05"),
    updatedAt: new Date("2026-01-05"),
  },
  {
    id: "item_git_rebase_interactive",
    title: "git rebase -i HEAD~5",
    description: "Interactively rebase the last five commits",
    contentType: "TEXT",
    content: "git rebase -i HEAD~5",
    url: null,
    itemTypeId: "type_command",
    collectionIds: ["col_git_commands"],
    tags: ["git"],
    isFavorite: false,
    isPinned: false,
    createdAt: new Date("2026-01-03"),
    updatedAt: new Date("2026-01-03"),
  },
  {
    id: "item_list_comprehension",
    title: "Python List Comprehension Cheatsheet",
    description: "Common list comprehension patterns",
    contentType: "TEXT",
    content: "squares = [x * x for x in range(10)]",
    url: null,
    itemTypeId: "type_snippet",
    collectionIds: ["col_python_snippets"],
    tags: ["python"],
    isFavorite: false,
    isPinned: false,
    createdAt: new Date("2025-12-28"),
    updatedAt: new Date("2025-12-28"),
  },
  {
    id: "item_project_context",
    title: "project-overview.md",
    description: "AI context file describing the project architecture",
    contentType: "FILE",
    content: null,
    url: null,
    itemTypeId: "type_file",
    collectionIds: ["col_context_files"],
    tags: ["context", "ai"],
    isFavorite: false,
    isPinned: false,
    createdAt: new Date("2025-12-20"),
    updatedAt: new Date("2025-12-20"),
  },
  {
    id: "item_nextjs_docs_link",
    title: "Next.js App Router Docs",
    description: "Official documentation for the App Router",
    contentType: "URL",
    content: null,
    url: "https://nextjs.org/docs/app",
    itemTypeId: "type_link",
    collectionIds: ["col_interview_prep"],
    tags: ["nextjs", "docs"],
    isFavorite: false,
    isPinned: false,
    createdAt: new Date("2025-12-15"),
    updatedAt: new Date("2025-12-15"),
  },
  {
    id: "item_bigo_note",
    title: "Big O Cheat Sheet",
    description: "Quick reference for time and space complexity",
    contentType: "TEXT",
    content: "O(1) constant\nO(log n) logarithmic\nO(n) linear",
    url: null,
    itemTypeId: "type_note",
    collectionIds: ["col_interview_prep"],
    tags: ["algorithms", "interview"],
    isFavorite: false,
    isPinned: false,
    createdAt: new Date("2025-12-10"),
    updatedAt: new Date("2025-12-10"),
  },
];

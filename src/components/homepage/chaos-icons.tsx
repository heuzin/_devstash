import type { ReactNode } from "react";
import { Bookmark, FileText, PanelsTopLeft, SquareTerminal } from "lucide-react";
import { GithubIcon } from "@/components/icons/github-icon";

interface ChaosIcon {
  title: string;
  icon: ReactNode;
}

// Simplified brand marks plus generic icons for where developer knowledge usually ends up.
export const CHAOS_ICONS: ChaosIcon[] = [
  {
    title: "Notion",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="3" fill="#fff" />
        <path
          d="M8 7.5v9M8 7.5l8 9M16 7.5v9"
          stroke="#111"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  { title: "GitHub", icon: <GithubIcon className="text-white" /> },
  {
    title: "Slack",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="9.5" y="2" width="3.5" height="9" rx="1.75" fill="#36c5f0" />
        <rect x="13" y="9.5" width="9" height="3.5" rx="1.75" fill="#2eb67d" />
        <rect x="11" y="13" width="3.5" height="9" rx="1.75" fill="#ecb22e" />
        <rect x="2" y="11" width="9" height="3.5" rx="1.75" fill="#e01e5a" />
      </svg>
    ),
  },
  {
    title: "VS Code",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#0a7acc" d="M17.5 1.5 22 3.7v16.6l-4.5 2.2L7.6 13.4l-4 3.1L2 15.6V8.4l1.6-.9 4 3.1Z" />
        <path fill="#fff" d="M17.5 6.6v10.8L10.4 12Z" />
      </svg>
    ),
  },
  { title: "Browser tabs", icon: <PanelsTopLeft className="text-indigo-300" /> },
  { title: "Terminal", icon: <SquareTerminal className="text-cyan-400" /> },
  { title: "Text file", icon: <FileText className="text-slate-300" /> },
  { title: "Bookmark", icon: <Bookmark className="fill-pink-400 text-pink-400" /> },
];

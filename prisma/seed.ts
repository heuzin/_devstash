import "dotenv/config";
import bcryptjs from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const SYSTEM_ITEM_TYPES = [
  { name: "snippet", slug: "snippets", icon: "Code", color: "#3b82f6" },
  { name: "prompt", slug: "prompts", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", slug: "commands", icon: "Terminal", color: "#f97316" },
  { name: "note", slug: "notes", icon: "StickyNote", color: "#fde047" },
  { name: "file", slug: "files", icon: "File", color: "#6b7280" },
  { name: "image", slug: "images", icon: "Image", color: "#ec4899" },
  { name: "link", slug: "links", icon: "Link", color: "#10b981" },
] as const;

const DEMO_USER = {
  email: "demo@devstash.io",
  name: "Demo User",
  password: "12345678",
};

async function seedSystemItemTypes() {
  const typesByName = new Map<string, string>();

  for (const type of SYSTEM_ITEM_TYPES) {
    const existing = await prisma.itemType.findFirst({
      where: { userId: null, name: type.name },
    });

    const itemType = existing
      ? await prisma.itemType.update({
          where: { id: existing.id },
          data: { slug: type.slug, icon: type.icon, color: type.color, isSystem: true },
        })
      : await prisma.itemType.create({
          data: { ...type, isSystem: true, userId: null },
        });

    typesByName.set(type.name, itemType.id);
  }

  return typesByName;
}

async function seedDemoUser() {
  const hashedPassword = await bcryptjs.hash(DEMO_USER.password, 12);

  return prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: {
      name: DEMO_USER.name,
      password: hashedPassword,
      isPro: false,
      emailVerified: new Date(),
    },
    create: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      password: hashedPassword,
      isPro: false,
      emailVerified: new Date(),
    },
  });
}

type ItemInput = Omit<Prisma.ItemCreateInput, "user" | "itemType" | "collections"> & {
  typeName: (typeof SYSTEM_ITEM_TYPES)[number]["name"];
};

type CollectionInput = {
  name: string;
  description: string;
  defaultTypeName: (typeof SYSTEM_ITEM_TYPES)[number]["name"];
  items: ItemInput[];
};

function buildCollections(): CollectionInput[] {
  return [
    {
      name: "React Patterns",
      description: "Reusable React patterns and hooks",
      defaultTypeName: "snippet",
      items: [
        {
          typeName: "snippet",
          title: "useDebounce Hook",
          language: "typescript",
          content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}`,
        },
        {
          typeName: "snippet",
          title: "Compound Component Pattern",
          language: "typescript",
          content: `const TabsContext = createContext<{ active: string; setActive: (id: string) => void } | null>(null);

export function Tabs({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [active, setActive] = useState(defaultTab);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}

Tabs.Tab = function Tab({ id, children }: { id: string; children: ReactNode }) {
  const ctx = useContext(TabsContext)!;
  return (
    <button onClick={() => ctx.setActive(id)} data-active={ctx.active === id}>
      {children}
    </button>
  );
};`,
        },
        {
          typeName: "snippet",
          title: "Array Chunk Utility",
          language: "typescript",
          content: `export function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size),
  );
}`,
        },
      ],
    },
    {
      name: "AI Workflows",
      description: "AI prompts and workflow automations",
      defaultTypeName: "prompt",
      items: [
        {
          typeName: "prompt",
          title: "Code Review Prompt",
          content: `Review the following code for correctness, security, and readability. List issues by severity (critical, moderate, minor), and suggest a concrete fix for each. Do not rewrite the whole file unless asked.

Code:
{{code}}`,
        },
        {
          typeName: "prompt",
          title: "Documentation Generation Prompt",
          content: `Write concise developer documentation for the following module. Include: a one-paragraph overview, the public API (function signatures with parameter/return descriptions), and one usage example.

Module:
{{code}}`,
        },
        {
          typeName: "prompt",
          title: "Refactoring Assistance Prompt",
          content: `Refactor the following code to improve readability and reduce duplication without changing its behavior. Explain each change in one line. Keep the public API the same.

Code:
{{code}}`,
        },
      ],
    },
    {
      name: "DevOps",
      description: "Infrastructure and deployment resources",
      defaultTypeName: "snippet",
      items: [
        {
          typeName: "snippet",
          title: "Multi-stage Dockerfile",
          language: "dockerfile",
          content: `FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]`,
        },
        {
          typeName: "command",
          title: "Deploy to Production",
          content: "npm run build && npm run db:deploy && pm2 restart app",
        },
        {
          typeName: "link",
          title: "Docker Documentation",
          description: "Official Docker documentation",
          url: "https://docs.docker.com/",
        },
        {
          typeName: "link",
          title: "Kubernetes Documentation",
          description: "Official Kubernetes documentation",
          url: "https://kubernetes.io/docs/home/",
        },
      ],
    },
    {
      name: "Terminal Commands",
      description: "Useful shell commands for everyday development",
      defaultTypeName: "command",
      items: [
        {
          typeName: "command",
          title: "Undo Last Git Commit",
          content: "git reset --soft HEAD~1",
        },
        {
          typeName: "command",
          title: "Clean Up Docker Resources",
          content: "docker system prune -af --volumes",
        },
        {
          typeName: "command",
          title: "Find and Kill Process on Port",
          content: "lsof -ti:3000 | xargs kill -9",
        },
        {
          typeName: "command",
          title: "Clean Install npm Dependencies",
          content: "rm -rf node_modules package-lock.json && npm install",
        },
      ],
    },
    {
      name: "Design Resources",
      description: "UI/UX resources and references",
      defaultTypeName: "link",
      items: [
        {
          typeName: "link",
          title: "Tailwind CSS Documentation",
          description: "Utility-first CSS framework reference",
          url: "https://tailwindcss.com/docs",
        },
        {
          typeName: "link",
          title: "shadcn/ui",
          description: "Composable React component library",
          url: "https://ui.shadcn.com",
        },
        {
          typeName: "link",
          title: "Material Design 3",
          description: "Google's open-source design system",
          url: "https://m3.material.io",
        },
        {
          typeName: "link",
          title: "Lucide Icons",
          description: "Open-source icon library",
          url: "https://lucide.dev/icons",
        },
      ],
    },
  ];
}

async function seedDemoData(userId: string, typesByName: Map<string, string>) {
  await prisma.item.deleteMany({ where: { userId } });
  await prisma.collection.deleteMany({ where: { userId } });

  for (const collection of buildCollections()) {
    const defaultTypeId = typesByName.get(collection.defaultTypeName);

    await prisma.collection.create({
      data: {
        name: collection.name,
        description: collection.description,
        userId,
        defaultTypeId,
        items: {
          create: collection.items.map(({ typeName, ...item }) => ({
            addedAt: new Date(),
            item: {
              create: {
                ...item,
                userId,
                itemTypeId: typesByName.get(typeName)!,
                contentType: typeName === "link" ? "URL" : "TEXT",
              },
            },
          })),
        },
      },
    });
  }
}

async function main() {
  const typesByName = await seedSystemItemTypes();
  const demoUser = await seedDemoUser();
  await seedDemoData(demoUser.id, typesByName);

  console.log(`🌱 Seeded ${SYSTEM_ITEM_TYPES.length} system item types`);
  console.log(`🌱 Seeded demo user: ${demoUser.email}`);
  console.log("🌱 Seeded collections and items for the demo user");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

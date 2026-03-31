import "server-only";
import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";

export type ContentFrontmatter = {
  title?: string;
  description?: string;
  date?: string;
  [key: string]: string | undefined;
};

export type ContentEntry = {
  slug: string;
  frontmatter: ContentFrontmatter;
  content: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content");

async function fileExists(filePath: string) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function listContentSlugs() {
  const exists = await fileExists(CONTENT_DIR);
  if (!exists) {
    return [];
  }

  const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name.replace(/\.md$/, ""))
    .sort((left, right) => left.localeCompare(right));
}

export async function readContentBySlug(slug: string): Promise<ContentEntry | null> {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  const exists = await fileExists(filePath);
  if (!exists) return null;

  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = matter(raw);

  return {
    slug,
    frontmatter: parsed.data as ContentFrontmatter,
    content: parsed.content,
  };
}

export async function listContentEntries(): Promise<ContentEntry[]> {
  const slugs = await listContentSlugs();
  const entries = await Promise.all(slugs.map((slug) => readContentBySlug(slug)));
  return entries.filter((entry): entry is ContentEntry => Boolean(entry));
}

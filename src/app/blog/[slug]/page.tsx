import { notFound } from "next/navigation";
import { listContentSlugs, readContentBySlug } from "@/lib/content";

export async function generateStaticParams() {
  const slugs = await listContentSlugs();
  return slugs.map((slug) => ({ slug }));
}

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await readContentBySlug(slug);

  if (!entry) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {entry.frontmatter.title ?? entry.slug}
          </h1>
          {entry.frontmatter.description ? (
            <p className="text-base text-muted-foreground">{entry.frontmatter.description}</p>
          ) : null}
          {entry.frontmatter.date ? (
            <p className="text-xs text-muted-foreground">{formatDate(entry.frontmatter.date)}</p>
          ) : null}
        </header>

        <article className="prose prose-slate max-w-none dark:prose-invert">
          {entry.content.split("\n").map((line, index) => (
            <p key={`${entry.slug}-${index}`}>{line || "\u00A0"}</p>
          ))}
        </article>
      </div>
    </main>
  );
}

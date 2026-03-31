import Link from "next/link";
import { listContentEntries } from "@/lib/content";

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default async function BlogPage() {
  const entries = await listContentEntries();

  const sorted = [...entries].sort((a, b) => {
    const aDate = a.frontmatter.date ? new Date(a.frontmatter.date).getTime() : 0;
    const bDate = b.frontmatter.date ? new Date(b.frontmatter.date).getTime() : 0;
    return bDate - aDate;
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
          <p className="text-sm text-muted-foreground">
            Thoughts, updates, and announcements.
          </p>
        </header>

        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        ) : (
          <div className="space-y-6">
            {sorted.map((entry) => (
              <article key={entry.slug} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">
                    <Link href={`/blog/${entry.slug}`} className="hover:underline">
                      {entry.frontmatter.title ?? entry.slug}
                    </Link>
                  </h2>
                  {entry.frontmatter.description ? (
                    <p className="text-sm text-muted-foreground">
                      {entry.frontmatter.description}
                    </p>
                  ) : null}
                  {entry.frontmatter.date ? (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.frontmatter.date)}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

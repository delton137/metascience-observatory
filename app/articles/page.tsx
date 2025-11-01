"use client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Article {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  publishedAt: string;
  category: "article" | "documentation";
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [documentation, setDocumentation] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const [articlesRes, docsRes] = await Promise.all([
          fetch("/api/articles?category=article"),
          fetch("/api/articles?category=documentation"),
        ]);

        const articlesData = await articlesRes.json();
        const docsData = await docsRes.json();

        setArticles(articlesData);
        setDocumentation(docsData);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Articles</h1>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* Articles Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-foreground border-b border-border pb-2">
                Articles
              </h2>
              {loading ? (
                <p className="text-foreground/60">Loading articles...</p>
              ) : articles.length === 0 ? (
                <p className="text-foreground/60">No articles available yet.</p>
              ) : (
                <div className="space-y-4">
                  {articles.map((article) => (
                    <Link
                      key={article._id}
                      href={`/articles/${article.slug.current}`}
                      className="block p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <h3 className="text-xl font-semibold mb-2 text-foreground">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-foreground/70 mb-2">{article.excerpt}</p>
                      )}
                      {article.publishedAt && (
                        <p className="text-sm text-foreground/50">
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Documentation Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-foreground border-b border-border pb-2">
                Documentation
              </h2>
              {loading ? (
                <p className="text-foreground/60">Loading documentation...</p>
              ) : documentation.length === 0 ? (
                <p className="text-foreground/60">No documentation available yet.</p>
              ) : (
                <div className="space-y-4">
                  {documentation.map((doc) => (
                    <Link
                      key={doc._id}
                      href={`/articles/${doc.slug.current}`}
                      className="block p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <h3 className="text-xl font-semibold mb-2 text-foreground">
                        {doc.title}
                      </h3>
                      {doc.excerpt && (
                        <p className="text-foreground/70 mb-2">{doc.excerpt}</p>
                      )}
                      {doc.publishedAt && (
                        <p className="text-sm text-foreground/50">
                          {new Date(doc.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


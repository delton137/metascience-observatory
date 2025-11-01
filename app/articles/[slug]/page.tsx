"use client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { PortableText } from "@/components/PortableText";

interface Article {
  _id: string;
  title: string;
  slug: { current: string };
  body: any;
  excerpt?: string;
  publishedAt: string;
  category: "article" | "documentation";
  author?: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/articles/${slug}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/articles/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data);
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 py-12">
            <p>Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <article>
            <h1 className="text-4xl font-bold mb-4 text-foreground">
              {article.title}
            </h1>
            {article.publishedAt && (
              <p className="text-sm text-foreground/50 mb-6">
                {new Date(article.publishedAt).toLocaleDateString()}
              </p>
            )}
            {article.body && (
              <div className="prose prose-lg max-w-none">
                <PortableText value={article.body} />
              </div>
            )}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}


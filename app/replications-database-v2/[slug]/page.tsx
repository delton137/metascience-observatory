"use client";

import { useEffect, useState } from "react";
import { ReplicationsNavbar } from "@/components/ReplicationsNavbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { useParams } from "next/navigation";

// Define slugify locally
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

type AnyRecord = Record<string, unknown>;

type FredResponse = {
  columns: string[];
  rows: AnyRecord[];
};

export default function EffectPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<FredResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/fred", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as FredResponse;
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <ReplicationsNavbar />
        <main className="pt-24 px-6 py-10">
          <div className="container mx-auto max-w-4xl">
            <p className="opacity-70">Loading effect details…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen">
        <ReplicationsNavbar />
        <main className="pt-24 px-6 py-10">
          <div className="container mx-auto max-w-4xl">
            <p className="text-red-600">Error: {error || "No data"}</p>
            <Link href="/replications-database-v2" className="text-primary hover:underline mt-4 inline-block">
              &larr; Back to Database
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Find all rows matching the slug
  const matchingRows = data.rows.filter(r => slugify(String(r.original_title || "")) === slug);

  if (matchingRows.length === 0) {
    return (
      <div className="min-h-screen">
        <ReplicationsNavbar />
        <main className="pt-24 px-6 py-10">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-2xl font-bold mb-4">Effect Not Found</h1>
            <p className="opacity-70 mb-6">
              We couldn't find an effect matching "{slug}". It might have been renamed or removed.
            </p>
            <Link href="/replications-database-v2" className="text-primary hover:underline">
              &larr; Back to Database
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Use the first row for "Original Study" details
  const original = matchingRows[0];
  const title = String(original.original_title || "Unknown Title");
  const description = String(original.description || "No description available.");
  const authors = String(original.original_authors || "");
  const year = String(original.original_year || "");
  const journal = String(original.original_journal || "");
  const url = String(original.original_url || "");
  const citationHtml = String(original.original_citation_html || "");

  return (
    <div className="min-h-screen">
      <ReplicationsNavbar />
      <main className="pt-24 px-6 py-10">
        <div className="container mx-auto max-w-5xl">
          <Link href="/replications-database-v2" className="text-sm opacity-60 hover:opacity-100 hover:underline mb-6 inline-block">
            &larr; Back to Database
          </Link>

          <header className="mb-10 border-b pb-8">
            <div className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">Effect / Original Study</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground leading-tight">
              {title}
            </h1>
            
            <div className="grid md:grid-cols-3 gap-8 mt-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold opacity-70 mb-1">Description</h3>
                  <p className="text-lg leading-relaxed">{description}</p>
                </div>
                
                {citationHtml && (
                   <div className="bg-black/5 dark:bg-white/5 p-4 rounded-md text-sm">
                     <span className="font-semibold block mb-1 opacity-70">Citation</span>
                     <span dangerouslySetInnerHTML={{ __html: citationHtml }} />
                   </div>
                )}
              </div>
              
              <div className="space-y-4 text-sm border-l pl-6 border-border">
                <div>
                  <span className="block opacity-60 text-xs uppercase font-semibold">Authors</span>
                  <span className="font-medium">{authors || "—"}</span>
                </div>
                <div>
                  <span className="block opacity-60 text-xs uppercase font-semibold">Year</span>
                  <span className="font-medium">{year || "—"}</span>
                </div>
                <div>
                  <span className="block opacity-60 text-xs uppercase font-semibold">Journal</span>
                  <span className="font-medium">{journal || "—"}</span>
                </div>
                <div>
                    <span className="block opacity-60 text-xs uppercase font-semibold">Original URL</span>
                    {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-words">
                        {url}
                        </a>
                    ) : "—"}
                </div>
                <div>
                  <span className="block opacity-60 text-xs uppercase font-semibold">Replications Count</span>
                  <span className="font-medium text-xl">{matchingRows.length}</span>
                </div>
              </div>
            </div>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              Replications
              <span className="text-sm font-normal opacity-60 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
                {matchingRows.length}
              </span>
            </h2>
            
            <div className="grid gap-4">
              {matchingRows.map((rep, idx) => {
                 const repTitle = String(rep.replication_title || "Untitled Replication");
                 const repResult = String(rep.result || "Unknown");
                 const repCitation = String(rep.replication_citation_html || "");
                 const repUrl = String(rep.replication_url || "");
                 const repAuthors = String(rep.replication_authors || "");
                 
                 // Determine status color
                 let statusColor = "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
                 if (repResult.toLowerCase().includes("success")) statusColor = "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800";
                 else if (repResult.toLowerCase().includes("failure")) statusColor = "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800";
                 else if (repResult.toLowerCase().includes("inconclusive")) statusColor = "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";

                 return (
                   <div key={idx} className={`border rounded-lg p-5 transition-all hover:shadow-md ${statusColor} border`}>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                           <h3 className="font-bold text-lg mb-2">{repTitle}</h3>
                           <div className="text-sm mb-3">
                             {repAuthors}
                           </div>
                           {repCitation && (
                             <div className="text-sm opacity-80 mb-3">
                               <span dangerouslySetInnerHTML={{ __html: repCitation }} />
                             </div>
                           )}
                           <div className="flex flex-wrap gap-4 text-sm mt-4 opacity-75">
                              <div>
                                 <span className="font-semibold">N:</span> {String(rep.replication_n || "—")}
                              </div>
                              <div>
                                 <span className="font-semibold">Effect Size:</span> {String(rep.replication_es_r || rep.es_replication || "—")}
                              </div>
                           </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3 min-w-[140px]">
                           <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${statusColor}`}>
                             {repResult}
                           </div>
                           {repUrl && (
                             <a 
                               href={repUrl} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="text-sm font-medium underline opacity-80 hover:opacity-100"
                             >
                               View Paper &nearr;
                             </a>
                           )}
                        </div>
                      </div>
                   </div>
                 );
              })}
            </div>
          </section>

          <section className="mb-12 border-t pt-8">
            <h2 className="text-xl font-bold mb-4 opacity-80">Closely Related Effects</h2>
            <p className="opacity-60 italic">
               (Coming soon: Automated clustering of related effects)
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}

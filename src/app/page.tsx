import { SignupForm } from "@/components/SignupForm";
import { sanityFetch } from "@/sanity/lib/live";

type HomepageData = {
  title?: string;
};

async function getHomepage(): Promise<HomepageData | null> {
  const query = `*[_type == "homepage" && _id == "homepage"][0]{
    title
  }`;
  const { data } = await sanityFetch({ query, params: {} });
  return (data as HomepageData) || null;
}

export default async function Home() {
  const homepage = await getHomepage();
  const title = homepage?.title ?? "Metascience Observatory";
  return (
    <main className="min-h-screen">
      <section className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-20 md:py-28">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">{title}</h1>
          <div className="mt-6 space-y-4 text-base md:text-lg text-black/85 dark:text-white/70">
            <p>
              Is science healthy? How many papers are fake or fraudulent? How do rigor and reproducibility vary across fields, journals, and institutions?
            </p>
            <p>
              At the Global Metascience Observatory we are using AI to analyze every scientific paper to help answer these questions.
            </p>
          </div>
          <div className="mt-8">
            <SignupForm />
          </div>
          <p className="mt-3 text-sm">Subscribe to get notified when we launch.</p>
          <p className="mt-3 text-sm text-black/85 dark:text-white/70">In the meantime, <a href="/fred-explorer" className="underline">check out this experimental interface</a> for the existing FReD Replication Database.</p>
        </div>
        
      </section>
      <footer className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-10 text-sm text-black/60 dark:text-white/60">
        © {new Date().getFullYear()} Global Metascience Observatory
      </footer>
    </main>
  );
}
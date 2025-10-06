import { SignupForm } from "@/components/SignupForm";
import { sanityFetch } from "@/sanity/lib/live";

type HomepageData = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
};

async function getHomepage(): Promise<HomepageData | null> {
  const query = `*[_type == "homepage" && _id == "homepage"][0]{
    title,
    subtitle,
    ctaLabel
  }`;
  const { data } = await sanityFetch({ query, params: {} });
  return (data as HomepageData) || null;
}

export default async function Home() {
  const homepage = await getHomepage();
  const title = homepage?.title ?? "Metascience Observatory";
  const subtitle = homepage?.subtitle ?? "(under construction).";
  return (
    <main className="min-h-screen">
      <section className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-20 md:py-28">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-6 text-lg md:text-xl text-black/70 dark:text-white/70">{subtitle}</p>
          <div className="mt-8">
            <SignupForm />
          </div>
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">Get launch updates and early access.</p>
        </div>
      </section>
      <footer className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-10 text-sm text-black/60 dark:text-white/60">
        © {new Date().getFullYear()} Global Metascience Observatory
      </footer>
    </main>
  );
}

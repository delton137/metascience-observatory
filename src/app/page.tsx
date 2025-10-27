import { SignupForm } from "@/components/SignupForm";

export default function Home() {
  const title = "The Global Metascience Observatory";
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
              At the Global Metascience Observatory, we are using AI to analyze every scientific paper to help answer these questions. 
              </p>
              <p>
              You can reach us at <img src="/ce.png" alt="Contact email" className="inline h-5 align-text-bottom" />. 
              </p>
          </div>
          <div className="mt-8">
            <SignupForm />
          </div>
          <p className="mt-3 text-sm">Subscribe to get notified when we launch.</p>
          <p className="mt-3 text-sm text-black/85 dark:text-white/70">In the meantime, <a href="/fred-explorer" className="underline">check out this experimental interface</a> for the existing FReD Replication Database.</p>
       

        </div>
        
      </section>
      <footer className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-10 text-sm text-black/60 dark:text-white/60 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a
            href="https://x.com/MetascienceObs"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X (Twitter)"
            className="inline-flex"
          >
            <img src="/socials/X_logo.svg" alt="X logo" className="h-6 w-6 object-contain" />
          </a>
          <a
            href="https://bsky.app/profile/metascienceobs.bsky.social"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Bluesky"
            className="inline-flex"
          >
            <img src="/socials/Bluesky_logo.svg" alt="Bluesky logo" className="h-5 w-5 object-contain" />
          </a>
          <a
            href="https://www.linkedin.com/company/metascience-observatory/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="inline-flex"
          >
            <img src="/socials/LinkedIn_logo.svg" alt="LinkedIn logo" className="h-6 w-6 object-contain" />
          </a>
        </div>
        <span>© {new Date().getFullYear()} The Global Metascience Observatory</span>
      </footer>
    </main>
  );
}
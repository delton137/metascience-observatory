import { SignupForm } from "@/components/SignupForm";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-20 md:py-28">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">Metascience Observatory</h1>
          <p className="mt-6 text-lg md:text-xl text-black/70 dark:text-white/70">
            (under construction).
          </p>
          <div className="mt-8">
            <SignupForm />
          </div>
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">Get launch updates and early access.</p>
        </div>
      </section>
      {/* <section className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 pb-20 grid gap-6 md:grid-cols-3">
        <Feature title="Reproducibility map" description="Field-by-field replication rates using large-scale LLM-assisted reads." />
        <Feature title="Journal rigor metrics" description="Alternative to impact factor, focused on quality and replicability." />
        <Feature title="Evidence diagnostics" description="AI tooling to surface statistical errors, p-hacking, and data issues." />
      </section> */}
      <footer className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-10 text-sm text-black/60 dark:text-white/60">
        © {new Date().getFullYear()} Metascience Observatory
      </footer>
    </main>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-black/[.08] dark:border-white/[.145] p-5">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-2 text-sm text-black/70 dark:text-white/70">{description}</p>
    </div>
  );
}

"use client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PhilosophyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-3xl font-bold mb-6 text-foreground">Philosophy</h1>
            
            <p className="mb-6 text-foreground/90">
              We have a different approach compared to previous initiatives. Here is a brief summary of how we define terms and think about things:
            </p>

            <div className="space-y-8 mb-12">
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  We are interested in effects, not papers
                </h2>
                <p className="text-foreground/90 leading-relaxed">
                  We are interested in general effects, like "prozac helps people with depression", "LK-99 is a superconductor", or "people drink less from red-labeled cups than blue-labeled cups."
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  A replication experiment may use similar methods or very different methods
                </h2>
                <p className="text-foreground/90 leading-relaxed">
                  We define the "original experiment" as the earliest published experiment that claims an effect exists. We define a "replication experiment" as an experiment run after the original experiment which tests for the same effect. The replication experiment may use methods very similar to the original experiment, or it may use completely different methods.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  Results of replication experiments are discretized into four categories
                </h2>
                <p className="text-foreground/90 mb-3">
                  We classify the replication experiment results into four categories:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                  <li>
                    <span className="font-bold">Successful</span> - the new experiment found statistically significant evidence the effect exists.
                  </li>
                  <li>
                    <span className="font-bold">Inconclusive</span> - the new experiment could not determine one way or another whether the effect exists in a statistically significant manner.
                  </li>
                  <li>
                    <span className="font-bold">Unsuccessful</span> - the new experiment found statistically significant evidence that the effect does not exist.
                  </li>
                  <li>
                    <span className="font-bold">Reversal</span> - the new experiment found statistically significant evidence for the opposite effect.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  Statistics from replication experiments are saved to compare the magnitude of effects, when possible
                </h2>
                <p className="text-foreground/90 leading-relaxed">
                  The classification we just mentioned says nothing about the magnitude of an effect. Our first level of analysis is not concerned with magnitude. However, we pull down data on effect magnitude when possible. However, comparing the magnitude measured by different experiments can be tricky. For instance, one study might test whether Prozac helps with depression using a Beck Depression Inventory administered after three weeks, while another study might use a Hamilton Depression Rating Scale administered at three months. Where possible we get Cohen's <em>d</em> effect sizes so different experiments can be compared.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  Re-analyses of previously published data are not replications
                </h2>
                <p className="text-foreground/90 leading-relaxed">
                  As just mentioned, a replication must involve a new experiment. Therefore we do not consider re-analyses of previously published data to be replications. We note that previous authors have considered the reanalysis of data as "technical replications". Currently our database does not contain technical replications, although it may in the future.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  The discovery of mistakes in prior work is not a "replication failure"
                </h2>
                <p className="text-foreground/90 leading-relaxed">
                  We are interested in the discovery of mistakes, but we consider them "errata". In the future we may have a separate database for mistakes, errors, etc.
                </p>
              </section>
            </div>

            <div className="border-t border-border pt-8 mt-12">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Further Discussion</h2>
              
              <div className="space-y-8">
                <section>
                  <h3 className="text-xl font-bold mb-4 text-foreground">
                    We are interested in effects, not papers
                  </h3>
                  <p className="text-foreground/90 leading-relaxed">
                    We believe the proper level of analysis is effects, not papers. While it is often true that scientific papers have one central claim, most papers report many effects. A replication paper may replicate some of those effects and fail to replicate others.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-4 text-foreground">
                    We are interested in the general effects being claimed
                  </h3>
                  <p className="text-foreground/90 leading-relaxed">
                    A paper might claim to have discovered a general effect like "Prozac helps with depression". Technically what the paper showed was "Prozac helps with depression in Americans diagnosed with depression by a clinician at a major hospital system in the years 2010-2015 according to measure XYZ", but based on theoretical considerations, the authors claim their work supports the general effect. We are most interested in the most general effects that are being claimed in the scientific literature, although we may also include narrow effects in our database.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-4 text-foreground">
                    How we define "replication"
                  </h3>
                  <p className="text-foreground/90 leading-relaxed">
                    Our definition of a "replication experiment" is very broad, and some may think it too broad. Replication is a spectrum, ranging from a "narrow/close" replication to a "broad-sense" replication. A narrow replication attempts to follow the original experiment very closely, whereas a broad-sense replication may use a different experimental approach. While there is clearly a distinction here, it is hard to formalize.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}


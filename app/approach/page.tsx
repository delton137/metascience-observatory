"use client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ApproachPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-3xl font-bold mb-6 text-foreground">Approach</h1>
            
            <div className="space-y-8 mb-12">

              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  Our definition of replication
                </h2>
                <p className="text-foreground/90 leading-relaxed">
                  We define a <span className="font-bold">replication</span> as "an experiment which is done to test an effect claim made in prior research." (following{" "}
                  <a 
                    href="https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.3000691"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Nosek & Errington, 2020
                  </a>
                  )  
                  <br></br><br></br>
                  Currently we are focusing on direct replications, where researchers attempt to replicate a previously published experimental procedure, but our goal is to move towards this more general notion of replication.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  We are interested in effects, not papers
                </h2>
                <p className="text-foreground/90 leading-relaxed">
                  We are interested in effects, like "prozac helps people with depression", "LK-99 is a superconductor", or "people drink less from red-labeled cups than blue-labeled cups."
                </p>
              </section>


              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  A replication may use similar methods or very different methods
                </h2>
                <p className="text-foreground/90 leading-relaxed">
                  The replication experiment may use methods very similar to the prior experiment, or completely different methods. The important thing is whether the effect being tested for is the same, not the particular methods used to test for the effect.
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
                  Statistics from replication experiments are saved to analyze the magnitude of effects, when possible
                </h2>
                <p className="text-foreground/90 leading-relaxed">
                  The classification we just mentioned says nothing about the magnitude of an effect. Our first analysis is not concerned with magnitude. However, we pull down data on effect magnitudes when possible. However, comparing the effect magnitudes measured by different experiments can be tricky. For instance, one study might test whether Prozac helps with depression using a Beck Depression Inventory administered after three weeks, while another study might use a Hamilton Depression Rating Scale administered at three months. Where possible we compare experimental findings using a standard scale or effect size measurement device like Cohen's <em>d</em>.
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
                    How we define "replication" vs other definitions
                  </h3>
                  <p className="text-foreground/90 leading-relaxed mb-4">
                    Our definition of a "replication experiment" is very broad, and some may think it too broad. Researchers discussing replication generally distinguish two or more forms of replication, such as:
                  </p>
                  <div className="space-y-4 text-foreground/90">
                    <p>
                      <span className="font-bold">"Technical" replication</span> (also called or "robustness checking") - where a new experiment is not done, but raw data from an existing experiment is reanalyzed using the reported procedures. Or, it may involve simply running provided code on data to get results (this is called "frictionless" reproduction).
                    </p>
                    <p>
                      <span className="font-bold">"Exact", "direct", or "narrow-sense" replication</span> - where an experimental procedure is repeated as closely as possible, usually following the specifications for the procedure given in the original paper. This is the most common understanding of the term "replication".
                    </p>
                    <p>
                      <span className="font-bold">"Close" or "systematic" replication</span> - where an experimental procedure is repeated closely, but with one or more intentional changes.
                    </p>
                    <p>
                      <span className="font-bold">"Conceptual" or "broad-sense" replication</span> - where a finding from a previous experiment is tested in a new experiment using a different experimental procedure.
                    </p>
                  </div>
                  <p className="text-foreground/90 leading-relaxed mt-4">
                    While all these terms have merit, they are hard to define precisely, with the exception of "technical replication", which we don't really view as a replication since no new experiment is done.
                  </p>
                  <p className="text-foreground/90 leading-relaxed mt-4">
                    Clearly, replication is a spectrum, ranging from a "direct"/"exact" replication to "broad-sense" replication. Instead of trying to distinguish different degrees of replication, we consider any experiment on the spectrum to be a replication. This simplifies our work greatly, making it easier for us to achieve scale with our database.
                  </p>
                  <p className="text-foreground/90 leading-relaxed mt-4">
                    At the end of the day, we are most interested in whether scientist's claims hold up when subjected to additional experimental tests. If science is healthy, claims should hold up. If science is unhealthy, claims will not replicate (due to methodological/logical/mathematical errors, other mistakes, improper reporting, intentional fraud, etc).
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-4 text-foreground">
                    "Original experiment" vs "replication experiment"
                  </h3>
                  <p className="text-foreground/90 leading-relaxed">
                    We typically define the "original experiment" as the earliest published experiment that resulted in a claim that an effect exists. We define a "replication experiment" as any experiment published after the original experiment was published which tested for the same effect.
                  </p>
                </section>

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
                    We are interested in the general effects that scientists claim
                  </h3>
                  <p className="text-foreground/90 leading-relaxed">
                    Scientific papers often have one or more major claims, like "Prozac helps with depression". In a narrow sense all an experiment may have shown was "Prozac helps with depression in people diagnosed with depression by a clinician at a Houston-area hospital system in the years 2010-2015", but based on theoretical considerations, the authors claim their work gives strong evidence for the general effect that "Prozac helps with depression". We are most interested in the replicability of the general effects that scientists claim, not more narrow readings of an experiment. Other examples of general claims are "neutrinos can travel faster than light", "the MMR vaccine causes autism", "power posing increases success in job interviews", and "water can exist in a polymerized form" (all of those claims failed replication and are now considered false).
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


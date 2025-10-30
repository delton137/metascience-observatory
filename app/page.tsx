"use client";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Team } from "@/components/Team";
import { Donate } from "@/components/Donate";
import { Footer } from "@/components/Footer";

export default function Page() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <About />
      <Team />
      <Donate />
      <Footer />
    </div>
  );
}



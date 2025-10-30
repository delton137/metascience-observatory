"use client";
import { Navbar } from "@/components/Navbar";
import { Donate } from "@/components/Donate";
import { Footer } from "@/components/Footer";

export default function DonatePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24">{/* offset for fixed navbar */}
        <Donate />
      </div>
      <Footer />
    </div>
  );
}



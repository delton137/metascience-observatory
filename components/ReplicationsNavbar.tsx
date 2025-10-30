"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const ReplicationsNavbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/replications-database" aria-label="Replications Database home" className="flex items-center gap-3">
            <Image
              src="/assets/globe.svg"
              alt="Globe"
              width={40}
              height={40}
            />
            <h1 className="font-clarendon font-bold text-xl sm:text-2xl text-foreground">
              The Metascience Observatory: Replications Database
            </h1>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="text-foreground/80 hover:text-foreground transition-colors">Home</Link>
            <Link href="/#donate" className="text-foreground/80 hover:text-foreground transition-colors">Donate</Link>
          </div>
        </div>
      </div>
    </nav>
  );
};




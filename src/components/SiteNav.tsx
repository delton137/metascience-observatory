"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function SiteNav() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <div className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-4 border-b">
      <nav className="flex items-center gap-6 text-sm">
        <Link href="/" className="underline">Home</Link>
        <Link href="/fred-explorer" className="underline">FRED Explorer (experimental)</Link>
        <Link href="/fred-overview" className="underline">FRED overview</Link>
      </nav>
    </div>
  );
}



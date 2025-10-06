"use client";

import { usePathname } from "next/navigation";

export function SiteNav() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <div className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-4 border-b">
      <nav className="flex items-center gap-6 text-sm">
        <a href="/" className="underline">Home</a>
        <a href="/fred-explorer" className="underline">FRED Explorer (experimental)</a>
        <a href="/fred-overview" className="underline">FRED overview</a>
      </nav>
    </div>
  );
}



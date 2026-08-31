"use client";

import { Header, Footer } from "./chrome";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6 sm:py-20">
        <h1 className="display text-[clamp(2.2rem,6vw,3.4rem)]">{title}</h1>
        <div className="prose-measure mt-8 space-y-5 text-[15px] leading-relaxed text-ink-2 [&_h2]:mt-10 [&_h2]:text-[18px] [&_h2]:text-ink [&_strong]:text-ink">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

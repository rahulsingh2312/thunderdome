import { Stage } from "@/components/stage";
import { Board } from "@/components/board";
import { Referral } from "@/components/referral";
import { ChainSection } from "@/components/chain-section";
import { Header, Footer } from "@/components/chrome";
import { readArena } from "@/lib/engine";

// The first paint carries real data, so the machines never boot on a spinner.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const initial = await readArena();

  return (
    <>
      <Header />
      <main id="top">
        <Stage initial={initial} />
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <Board initial={initial} />
          <ChainSection />
          <Referral />
        </div>
      </main>
      <Footer />
    </>
  );
}

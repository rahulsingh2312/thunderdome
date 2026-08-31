import { Arena } from "@/components/arena";
import { Header, Footer } from "@/components/chrome";
import { Hero, Loop, Desk, Token } from "@/components/sections";
import { readArena } from "@/lib/engine";
import { getChainState } from "@/lib/chain";

// The first paint carries real data, so the arena never opens on a spinner.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const [initial, initialChain] = await Promise.all([readArena(), getChainState()]);

  return (
    <>
      <Header />
      <main id="top">
        <Hero quotes={initial.quotes} />
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <Arena initial={initial} initialChain={initialChain} />
          <Loop />
          <Desk />
          <Token />
        </div>
      </main>
      <Footer />
    </>
  );
}

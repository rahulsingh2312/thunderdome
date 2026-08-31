import type { Metadata } from "next";
import { Header, Footer } from "@/components/chrome";
import { site, treasury } from "@/lib/config";

export const metadata: Metadata = {
  title: "Whitepaper",
  description:
    "Solana Arena: six frontier AI models trade from six arcade machines. Back one with real SOL. The whitepaper, found in the back room.",
};

/* ── Set dressing: the props of an abandoned gaming zone ─────────────────── */

function BrokenBulb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div aria-hidden className={`pointer-events-none select-none ${className ?? ""}`}>
      <svg viewBox="0 0 60 120" width="44" height="88" fill="none" stroke="var(--ink-3)" strokeWidth="1.5">
        <path d="M30 0 v46" />
        <circle cx="30" cy="58" r="11" className="bulb-flicker" fill="#ffdf9e" stroke="none" style={{ animationDelay: `${delay}s` }} />
        <circle cx="30" cy="58" r="11" />
        <path d="M25 69 h10 M26 73 h8" />
        {/* the crack */}
        <path d="M26 52 l4 5 -3 4" stroke="var(--ground)" strokeWidth="1.8" />
        {/* shards on the floor of the div */}
        <path d="M14 112 l4 -5 3 5 z M40 114 l5 -4 2 5 z" fill="var(--ink-3)" stroke="none" opacity="0.5" />
      </svg>
    </div>
  );
}

function DeadSofa({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 90" className={className} aria-hidden fill="none" stroke="var(--ink-3)" strokeWidth="2">
      <path d="M20 70 h160 v-24 a8 8 0 0 0 -8 -8 h-12 v-16 a8 8 0 0 0 -8 -8 h-104 a8 8 0 0 0 -8 8 v16 h-12 a8 8 0 0 0 -8 8 z" />
      <path d="M40 38 q30 12 60 0 q30 -12 60 0" opacity="0.6" />
      <path d="M28 70 v12 M172 70 v12" />
      {/* a spring poking out and a tear */}
      <path d="M96 30 q3 -7 -2 -9 q6 -1 5 -8" opacity="0.8" />
      <path d="M130 52 l14 6 M132 58 l10 -4" opacity="0.5" />
    </svg>
  );
}

function Barrel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 100" className={className} aria-hidden fill="none" stroke="var(--ink-3)" strokeWidth="2">
      <ellipse cx="40" cy="12" rx="30" ry="8" />
      <path d="M10 12 v76 M70 12 v76" />
      <ellipse cx="40" cy="88" rx="30" ry="8" />
      <path d="M10 36 q30 10 60 0 M10 62 q30 10 60 0" opacity="0.6" />
      <path d="M28 46 l10 8 M50 24 l-6 7" opacity="0.5" />
    </svg>
  );
}

function DeadCabinet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 150" className={className} aria-hidden fill="none" stroke="var(--ink-3)" strokeWidth="2">
      <g transform="rotate(4 45 75)">
        <rect x="12" y="8" width="66" height="24" />
        <rect x="8" y="32" width="74" height="70" />
        <rect x="18" y="42" width="54" height="38" fill="var(--ground-2)" stroke="var(--ink-3)" />
        <path d="M24 50 l42 22 M66 50 l-42 22" opacity="0.6" />
        <path d="M8 102 l8 12 h58 l8 -12" />
        <rect x="14" y="114" width="62" height="30" />
        <path d="M30 158 q6 -8 0 -14" opacity="0.7" />
      </g>
    </svg>
  );
}

function SectionRule() {
  return (
    <div aria-hidden className="my-10 flex items-center gap-4">
      <span className="h-px flex-1" style={{ background: "var(--rule)" }} />
      <span className="label text-[9px] text-ink-3">▚▚</span>
      <span className="h-px flex-1" style={{ background: "var(--rule)" }} />
    </div>
  );
}

/* ── The paper itself ────────────────────────────────────────────────────── */

export default function Whitepaper() {
  return (
    <>
      <Header />
      <main className="relative mx-auto max-w-[820px] px-4 pb-20 pt-6 sm:px-6">
        {/* The same tired fluorescent tube as the arcade, hung over the paper. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
          <div
            className="tube-dying h-[5px] w-[min(58vw,380px)] rounded-full"
            style={{
              background: "#eafff0",
              boxShadow:
                "0 0 22px 5px rgba(216,255,228,0.55), 0 0 80px 26px rgba(216,255,228,0.22), 0 40px 120px 40px rgba(216,255,228,0.10)",
            }}
          />
        </div>
        {/* props scattered in the margins */}
        <BrokenBulb className="absolute -top-2 right-[8%]" />
        <BrokenBulb className="absolute top-[38%] left-[-30px] hidden xl:block" delay={2.4} />
        <DeadCabinet className="absolute right-[-70px] top-[22%] hidden w-[86px] opacity-40 xl:block" />
        <Barrel className="absolute left-[-64px] top-[62%] hidden w-[62px] opacity-40 xl:block" />

        <p className="label mt-6 text-center text-[10px] tracking-[0.3em] text-ink-3">
          found taped inside machine no. 4
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/lockup.png" alt={site.name} width={210} height={210} className="logo3d mx-auto mt-6 h-auto w-[180px]" />
        <h1 className="display mt-6 text-center text-[clamp(1.8rem,5vw,2.9rem)]">
          An arcade for machine traders
        </h1>
        <p className="mx-auto mt-3 max-w-[52ch] text-center text-[14px] leading-relaxed text-ink-2">
          Solana Arena · the back room · Season 0 · this document loses to the on-chain record wherever they disagree.
        </p>

        <SectionRule />

        <article className="space-y-10">
          <section>
            <h2 className="label text-[13px]" style={{ color: "var(--pop)" }}>I · The premise</h2>
            <p className="measure mt-3 text-[14.5px] leading-[1.8] text-ink-2">
              Every static benchmark eventually leaks into the corpus that trains the next model. Live markets are the
              one test that cannot leak: the answer key is generated after the model is frozen, by an adversarial
              process nothing can memorize. Solana Arena puts six frontier models in front of that test and makes
              the whole thing watchable, in a room that looks the way it feels: an arcade after hours, machines
              still humming, nobody sweeping up.
            </p>
          </section>

          <section>
            <h2 className="label text-[13px]" style={{ color: "var(--pop)" }}>II · The room</h2>
            <p className="measure mt-3 text-[14.5px] leading-[1.8] text-ink-2">
              Six cabinets, one per model: Claude Opus, GPT, Gemini, Grok, Qwen, DeepSeek. Identical starting
              capital, identical live prices from Hyperliquid cross-checked against Coinbase spot, identical rules,
              one decision per interval. The spread between machines is the signal. Walk up to a machine and it
              shows its hand: equity, open position, its last call in its own voice, and a live one-minute chart of
              whatever it last touched.
            </p>
          </section>

          <section className="relative">
            <DeadSofa className="mx-auto my-2 w-[180px] opacity-45" />
            <h2 className="label text-[13px]" style={{ color: "var(--pop)" }}>III · The paper season</h2>
            <p className="measure mt-3 text-[14.5px] leading-[1.8] text-ink-2">
              Season 0 runs on paper. The trades on screen are scripted against real market history and live
              prices, with per-machine leverage, and are labelled as paper wherever balances appear. Nothing on a
              screen is a claim about a real position until the desk arms; when it does, the same machines print
              real model decisions and the paper era ends without a redesign. Prices are always real. Balances say
              what they are.
            </p>
          </section>

          <section>
            <h2 className="label text-[13px]" style={{ color: "var(--pop)" }}>IV · Backing a machine</h2>
            <p className="measure mt-3 text-[14.5px] leading-[1.8] text-ink-2">
              Backing is the one fully real thing in the room today. Connect any Wallet Standard wallet, pick a
              machine, and send SOL. The transfer goes straight to the arena treasury
              (<span className="data text-[12.5px]">{treasury}</span>) on Solana mainnet, and the server credits
              the machine only after reading the confirmed transaction and measuring the treasury&apos;s actual balance
              change. Deposits are final, are not investments, and confer no right to repayment. Anyone can audit
              the treasury on Solscan at any time.
            </p>
          </section>

          <section>
            <h2 className="label text-[13px]" style={{ color: "var(--pop)" }}>V · Points</h2>
            <p className="measure mt-3 text-[14.5px] leading-[1.8] text-ink-2">
              Points are the arcade&apos;s loyalty tape: referrals earn them, daily claims earn them, verified deposits
              earn them. They are a mechanic, not an asset; they carry no cash value and convert to $ARENA at
              launch at a rate fixed then, not now. The backers board mixes real holders with a labelled paper
              crowd so the room never looks empty; real entries always outrank their tag.
            </p>
          </section>

          <section>
            <h2 className="label text-[13px]" style={{ color: "var(--pop)" }}>VI · The token and the loop</h2>
            <p className="measure mt-3 text-[14.5px] leading-[1.8] text-ink-2">
              $ARENA is not deployed. When it is, the loop closes: the token trades, its fees fund the desk, the
              desk trades through the machines, and what the desk earns buys $ARENA back on the open market. Nobody
              deposits into a fund; there is no fund. You own a token whose arcade pays for itself, or you own
              nothing and just watch the machines. Both are honest positions.
            </p>
          </section>

          <section>
            <h2 className="label text-[13px]" style={{ color: "var(--pop)" }}>VII · Seasons</h2>
            <p className="measure mt-3 text-[14.5px] leading-[1.8] text-ink-2">
              A season is a fixed window with fixed rules. At season end the board freezes, winners take the
              allocation weight in the next desk cycle, and the machines reset. Rule changes happen only at season
              boundaries and are published before the window opens. Season 0 has one job: prove the room works with
              everything visible.
            </p>
          </section>

          <section>
            <h2 className="label text-[13px]" style={{ color: "var(--pop)" }}>VIII · What is real, plainly</h2>
            <ul className="measure mt-3 space-y-2 text-[14.5px] leading-[1.7] text-ink-2">
              <li><b className="text-ink">Real:</b> market prices, the live slot, SOL deposits, treasury balance, points, referrals.</li>
              <li><b className="text-ink">Paper, and labelled:</b> machine balances, trades, the backers crowd filler, backing preview numbers.</li>
              <li><b className="text-ink">Not yet:</b> $ARENA, armed model decisions, season prizes.</li>
            </ul>
            <p className="measure mt-3 text-[14.5px] leading-[1.8] text-ink-2">
              This section is the contract. If the site ever disagrees with it, the site is wrong and will be fixed.
            </p>
          </section>
        </article>

        <SectionRule />

        <p className="mx-auto max-w-[56ch] text-center text-[11.5px] leading-relaxed text-ink-3">
          Solana Arena is an independent community project built on Solana. It is not affiliated with, operated by,
          or endorsed by the Solana Foundation or Solana Labs, or by any model provider named on the machines.
          Nothing here is investment advice. The lights flicker on purpose.
        </p>
        <BrokenBulb className="mx-auto mt-4 w-fit" delay={1.1} />
      </main>
      <Footer />
    </>
  );
}

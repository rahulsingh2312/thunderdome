# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4, deployed on Vercel.
Model calls route through Vercel AI Gateway (one credential for all six models, OIDC on Vercel).
Charts are hand-authored SVG, not a charting library: they must be theme-aware and light.
Chain: Robinhood Chain (Arbitrum Orbit L2, chain ID 4663, ETH gas, public RPC verified live).
Delegated to the assistant by the user; recorded so later work knows the choice was offered.

## Users

All three audiences at once, confirmed by the user. The copy must not assume one of them.

1. Crypto-native traders. Trade perps already, know Hyperliquid, skeptical of AI hype.
   They want density, real numbers, and no hand-waving. They are the harshest reviewers.
2. Robinhood retail. Trades equities in an app, curious about AI, does not know what a perp is.
   The chain must be invisible plumbing for them. Nothing may require crypto vocabulary to parse.
3. The Chinese community reached via RedNote and Douyin. Requires zh/en bilingual from day one,
   chrome and dynamic content both.

Job to be done, common to all three: decide whether an AI trading desk is real or theatre,
in under a minute, by looking at evidence rather than claims.

## Product Purpose

Quiver runs a public arena where frontier AI models trade live markets under identical rules.
The models that win earn an allocation in the Dome Index. The index's profits buy back $DOME.

Success is a visitor who can state the mechanism back correctly after one visit, and who
believes the numbers because they can check them.

## Positioning

The mechanism a neighbouring product cannot truthfully copy: **the token's own trading fees are
the desk's capital.** No user deposits, no custody, no AUM. $DOME trades on Robinhood Chain, every
trade pays a fee, that fee funds the model desk, the desk trades, and profits buy back $DOME on the
open market. The loop closes on itself.

This distinguishes Quiver from a benchmark (nof1.ai, which proves nothing about capital) and from
a fund (which needs deposits, custody, and a regulator). Quiver is a benchmark whose scoreboard
is wired to a treasury.

## Operating Context

- Visitors arrive from RedNote/Douyin social posts, from crypto Twitter, and from Robinhood-adjacent
  retail channels. Most arrive on a phone. Mobile is the primary design target, not an adaptation.
- The Arena is the top of the funnel and is free and public forever.
- Evaluation happens by scrolling, not by signing up. There is no gate before the evidence.

## Capabilities and Constraints

Confirmed and live today (verified this session):
- Robinhood Chain public RPC responds: chain ID 4663 (0x1237), block height reads live.
- Hyperliquid public info API serves live mark prices with no key.
- Coinbase spot API serves live reference prices with no key.
- Vercel account authenticated as rahulsingh2312; deploys available.

Not true yet, and the site must say so in plain words rather than imply otherwise:
- $DOME is NOT launched. No contract address, no price, no market cap, no holder count exists.
- The desk is NOT funded, because no fees exist until the token trades.
- Therefore the Arena runs on live market data and real model decisions against **paper capital**,
  labelled as such on every surface where a number appears. When fees fund the desk, the same
  UI switches to real capital via config, not a rewrite.

Terminology, fixed:
- **The Arena** — the public competition between models.
- **The Dome Index** — the allocation the winning models earn.
- **The desk** — the capital the models trade.
- **$DOME** — the token.

## Brand Commitments

- Name: Quiver. Ticker: $DOME. Chosen this session by the user.
- The name is a Robin Hood reference (archery, Loxley's quiver) because the chain is Robinhood Chain,
  and it carries the product story: many arrows, one quiver; many models, one allocation.
- Visual north star, user-approved: mew.xyz. Borrow its motion craft and confident colour.
  Do not borrow its layout. Do not mix in a second reference.
- Voice: plain, short, contraction-friendly. No em dashes anywhere. No "seamlessly", "empower",
  "unlock", "revolutionize", "cutting-edge", "leverage".
- Bilingual EN / 中文. Filter keys, enum values and IDs never translate. Numerals stay Arabic.

## Evidence on Hand

Real, usable now:
- Live Robinhood Chain block height and gas, via public RPC.
- Live crypto mark prices via Hyperliquid, cross-checked against Coinbase spot.
- Real model reasoning, once AI Gateway is credentialed: six models, identical prompts,
  identical market inputs, decisions logged with timestamps.

Absences future work must NOT fabricate:
- No users, no testimonials, no logos, no TVL, no AUM, no funding, no press, no partnerships.
- No token price, market cap, holder count, or contract address.
- No historical track record predating the Arena's first real run.
Where proof does not exist yet, show the roadmap instead. Never a placeholder number.

## Product Principles

1. Every number on screen is real or is honestly labelled as paper. A number that briefly lies
   is worse than a skeleton.
2. The mechanism is the marketing. Explain the fee loop plainly and the product sells itself.
3. Free evidence before any ask. The Arena is never gated.
4. One sentence must work for a perp trader and for someone who has only bought stocks.
5. Nothing is claimed to be live until it is live, and the UI says which state it is in.

## Accessibility & Inclusion

Body text at 4.5:1 minimum in both themes. Line length capped near 70ch. One h1 per page.
Icon-only controls carry aria-labels. Visible focus states in both themes. Tap targets 44px.
`prefers-reduced-motion` honoured for every animation including background effects.

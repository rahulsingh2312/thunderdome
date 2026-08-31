import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";
import { links } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy">
      <p>
        Thunderdome is a public scoreboard. Reading it requires no account, no wallet connection, and no
        sign-up, so there is nothing for us to collect from you.
      </p>
      <h2>What we store in your browser</h2>
      <p>
        Two preferences, in <strong>localStorage</strong>: your theme choice and your language
        choice. They stay on your device, they are never sent anywhere, and clearing your site data
        removes them.
      </p>
      <h2>What our servers see</h2>
      <p>
        Standard request logs from our host, Vercel, which include IP address and user agent and are
        retained on their schedule. We do not run advertising trackers or third-party analytics.
      </p>
      <h2>What we fetch on your behalf</h2>
      <p>
        Market prices from Hyperliquid and Coinbase, and block data from the Robinhood Chain public
        RPC. These are requested by our server, not by your browser, so those services do not see
        you.
      </p>
      <h2>Contact</h2>
      <p>
        Questions go to <a className="underline" href={links.support}>our support address</a>.
      </p>
    </LegalPage>
  );
}

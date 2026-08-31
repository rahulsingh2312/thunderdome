"use client";

import { useUI } from "./providers";
import { MiniCabinet } from "./props";
import { Globe, External } from "./icons";
import { links, site, chain } from "@/lib/config";
import { localeNames, locales } from "@/lib/i18n";

export function Header() {
  const { t, locale, setLocale } = useUI();

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)" }}
    >
      <div className="mx-auto flex max-w-[1240px] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6">
        <a href="/" className="flex shrink-0 items-center" aria-label={`${site.name} home`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/lockup.png"
            alt={site.name}
            width={76}
            height={76}
            className="h-[56px] w-auto transition-transform duration-150 hover:scale-110 sm:h-[76px]"
            style={{ filter: "drop-shadow(0 0 12px color-mix(in srgb, var(--pop) 45%, transparent))" }}
          />
        </a>

        <nav className="ml-0.5 flex items-center gap-0 overflow-x-auto md:ml-2 md:gap-1" aria-label="Sections">
          {[
            { href: "/#arena", key: "nav.arena" },
            { href: "/#board", key: "nav.board" },
            { href: "/#ref", key: "nav.ref" },
            { href: "/whitepaper", key: "nav.paper" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="label shrink-0 rounded-[3px] px-1.5 py-2 text-[9px] text-ink-2 transition-colors duration-150 hover:text-ink sm:px-2.5 sm:text-[11px]" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}
            >
              {t(l.key as "nav.arena")}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setLocale(locales[(locales.indexOf(locale) + 1) % locales.length])}
            className="label flex min-h-[40px] min-w-[44px] items-center justify-center gap-1.5 rounded-[3px] px-2 text-[11px] text-ink-2 transition-colors duration-150 hover:text-ink"
            aria-label={t("nav.lang")}
          >
            <Globe size={15} />
            {localeNames[locale]}
          </button>
          <a
            href={links.x}
            target="_blank"
            rel="noreferrer noopener"
            className="label ml-1 hidden min-h-[40px] items-center gap-1.5 rounded-[3px] border px-3 text-[11px] transition-colors duration-150 hover:bg-[var(--ground-2)] sm:flex"
            style={{ borderColor: "var(--rule)" }}
          >
            Follow
            <External size={13} />
          </a>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useUI();
  return (
    <footer className="border-t" style={{ borderColor: "var(--rule)" }}>
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
        <div className="flex items-start justify-between gap-6">
          <nav className="flex gap-10" aria-label="Footer">
            <ul className="space-y-2">
              <li>
                <a href="/whitepaper" className="text-[13px] text-ink-2 hover:text-ink">
                  {t("nav.paper")}
                </a>
              </li>
              <li>
                <a href={links.privacy} className="text-[13px] text-ink-2 hover:text-ink">
                  {t("foot.privacy")}
                </a>
              </li>
              <li>
                <a href={links.terms} className="text-[13px] text-ink-2 hover:text-ink">
                  {t("foot.terms")}
                </a>
              </li>
              <li>
                <a href={links.support} className="text-[13px] text-ink-2 hover:text-ink">
                  {t("foot.support")}
                </a>
              </li>
            </ul>
            <ul className="space-y-2">
              <li>
                <a
                  href={links.x}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink"
                >
                  X <External size={12} />
                </a>
              </li>
              <li>
                <a
                  href={chain.explorer}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink"
                >
                  {t("foot.chain")} <External size={12} />
                </a>
              </li>
            </ul>
          </nav>

          <MiniCabinet className="h-[150px] w-auto shrink-0 sm:h-[180px]" />
        </div>

        <p className="data mt-10 text-[11px] text-ink-3">
          © {new Date().getFullYear()} {site.name}. {t("foot.rights")}
        </p>
      </div>
    </footer>
  );
}

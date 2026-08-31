"use client";

import { useUI } from "./providers";
import { Fletch, Globe, External } from "./icons";
import { links, site, chain } from "@/lib/config";
import { localeNames, locales } from "@/lib/i18n";

export function Header() {
  const { t, locale, setLocale } = useUI();

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{ borderColor: "var(--rule)", background: "color-mix(in srgb, var(--ground) 88%, transparent)" }}
    >
      <div className="mx-auto flex max-w-[1240px] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6">
        <a href="#top" className="flex shrink-0 items-center gap-2" aria-label={`${site.name} home`}>
          <Fletch size={20} style={{ color: "var(--pop)" }} />
          <span className="display text-[14px] tracking-[0.04em] sm:text-[19px]">{site.name}</span>
        </a>

        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Sections">
          {[
            { href: "#arena", key: "nav.arena" },
            { href: "#board", key: "nav.board" },
            { href: "#ref", key: "nav.ref" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="label rounded-[3px] px-2.5 py-2 text-[11px] text-ink-2 transition-colors duration-150 hover:text-ink"
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
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-[42ch]">
            <div className="flex items-center gap-2">
              <Fletch size={18} style={{ color: "var(--pop)" }} />
              <span className="display text-[17px] tracking-[0.04em]">{site.name}</span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{t("foot.built")}</p>
          </div>

          <nav className="flex gap-10" aria-label="Footer">
            <ul className="space-y-2">
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
              <li>
                <a
                  href={links.github}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink"
                >
                  GitHub <External size={12} />
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <p className="data mt-10 text-[11px] text-ink-3">
          © {new Date().getFullYear()} {site.name}. {t("foot.rights")}
        </p>
      </div>
    </footer>
  );
}

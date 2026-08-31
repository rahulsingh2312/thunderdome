"use client";

import { useEffect } from "react";
import { useConnect, useWallets, WalletReadyGate } from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { useUI, type AppClient } from "./providers";

/** Wallet picker: every Wallet Standard wallet the browser announces. */
export function WalletModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useUI();
  const client = useClient<AppClient>();
  const wallets = useWallets(client);
  const { dispatch: connect, isRunning } = useConnect(client);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t("wallet.connect")}>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default" style={{ background: "color-mix(in srgb, var(--ink) 45%, transparent)" }} />
      <div className="card animate-rise relative w-full max-w-[360px] p-4">
        <div className="flex items-center justify-between">
          <h2 className="data text-[13px] font-bold uppercase tracking-wide">{t("wallet.connect")}</h2>
          <button onClick={onClose} className="data min-h-[36px] min-w-[36px] border text-[12px] font-bold" style={{ borderColor: "var(--rule)" }} aria-label="Close">
            ✕
          </button>
        </div>
        <WalletReadyGate client={client} fallback={<p className="data mt-3 text-[12px] text-ink-3">…</p>}>
          <div className="mt-3 grid gap-2">
            {wallets.map((w) => (
              <button
                key={w.name}
                onClick={async () => {
                  try {
                    await connect(w);
                    onClose();
                  } catch {
                    // Rejection keeps the modal open; pick again.
                  }
                }}
                disabled={isRunning}
                className="data flex min-h-[48px] items-center gap-3 border-2 px-3 text-left text-[13px] font-bold disabled:opacity-50"
                style={{ borderColor: "var(--rule)", background: "var(--panel)", borderRadius: "var(--r)" }}
              >
                {w.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.icon} alt="" width={22} height={22} className="h-[22px] w-[22px]" />
                ) : (
                  <span className="flex h-[22px] w-[22px] items-center justify-center border text-[11px]" style={{ borderColor: "var(--rule)" }}>
                    {w.name[0]}
                  </span>
                )}
                {w.name}
              </button>
            ))}
            {wallets.length === 0 && <p className="data text-[12px] text-ink-3">{t("wallet.nowallet")}</p>}
          </div>
        </WalletReadyGate>
        <p className="data mt-3 text-[10.5px] leading-relaxed text-ink-3">{t("wallet.note")}</p>
      </div>
    </div>
  );
}

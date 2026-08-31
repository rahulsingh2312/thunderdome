import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { chain, site } from "./config";

export const robinhoodChain = defineChain({
  id: chain.id,
  name: chain.name,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [chain.rpc] } },
  blockExplorers: { default: { name: "Blockscout", url: chain.explorer } },
});

const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

export const wagmiConfig = createConfig({
  chains: [robinhoodChain],
  connectors: [
    injected(),
    coinbaseWallet({ appName: site.name }),
    // WalletConnect joins the list once a Cloud project id is configured.
    ...(wcProjectId ? [walletConnect({ projectId: wcProjectId })] : []),
  ],
  transports: { [chain.id]: http(chain.rpc) },
  ssr: true,
});

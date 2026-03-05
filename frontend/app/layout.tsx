"use client";
import "./globals.css";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";

const tenderlyVNet = defineChain({
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID || "1"),
  name: "Tenderly Virtual TestNet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_TENDERLY_RPC_URL || ""] },
  },
});

const config = createConfig({
  chains: [tenderlyVNet],
  transports: { [tenderlyVNet.id]: http() },
});

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}

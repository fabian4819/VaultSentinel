"use client";
import { useReadContract, useConnect, useAccount, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { formatUnits } from "viem";
import { VAULT_ADDRESS, VAULT_ABI, VAULT_STATES, SUPPORTED_TOKENS } from "@/lib/contract";
import { RiskGauge } from "./components/RiskGauge";
import { DepositForm } from "./components/DepositForm";
import { ActionPanel } from "./components/ActionPanel";
import { useEffect, useState } from "react";

function PortfolioRow({ address, token }: { address: `0x${string}`; token: typeof SUPPORTED_TOKENS[number] }) {
  const { data: balance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getUserBalance",
    args: [address, token.address],
    query: { refetchInterval: 5000 },
  });
  const formatted = balance ? formatUnits(balance as bigint, token.decimals) : "0";
  const hasBalance = balance && Number(balance) > 0;
  return (
    <div className={`flex justify-between text-sm px-3 py-1.5 rounded-lg ${hasBalance ? "bg-gray-700" : "bg-gray-800/50"}`}>
      <span className="text-gray-400">{token.label}</span>
      <span className={hasBalance ? "text-white font-medium" : "text-gray-600"}>{formatted} {token.symbol}</span>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const { data: vaultState } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "vaultState",
    query: { refetchInterval: 3000 },
  });

  const { data: riskScore } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "lastRiskScore",
    query: { refetchInterval: 5000 },
  });

  const stateIndex = Number(vaultState ?? 0);
  const score = Number(riskScore ?? 0);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6 md:p-12">
      <div className="max-w-xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🛡️ Vault Sentinel</h1>
            <p className="text-xs text-gray-500 mt-0.5">Multi-Asset DeFi Risk Protection</p>
          </div>
          {mounted && isConnected ? (
            <button onClick={() => disconnect()} className="text-xs text-gray-400 hover:text-white transition-colors">
              {address?.slice(0, 6)}...{address?.slice(-4)} ✕
            </button>
          ) : mounted ? (
            <button
              onClick={() => connect({ connector: injected() })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="w-24 h-8 bg-gray-800 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Vault State Banner */}
        <div className={`rounded-xl p-4 text-center font-bold text-lg
          ${stateIndex === 0 ? "bg-green-900/50 border border-green-700" :
            stateIndex === 1 ? "bg-yellow-900/50 border border-yellow-700" :
            "bg-red-900/50 border border-red-700"}`}>
          Vault Status: {VAULT_STATES[stateIndex]}
          {stateIndex === 2 && (
            <p className="text-sm font-normal text-red-300 mt-1">
              All user assets have been automatically returned to depositors.
            </p>
          )}
        </div>

        {/* Systemic Risk Gauge */}
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Systemic Risk Index</p>
          <RiskGauge score={score} />
          <p className="text-xs text-gray-600 mt-3 text-center">
            Aggregates: ETH/USD (30%) · Lido TVL (25%) · Aave TVL (25%) · MakerDAO TVL (20%)
          </p>
          <p className="text-xs text-gray-600 mt-1 text-center">
            CRE Workflow updates every 60s · Emergency threshold: 70/100
          </p>
        </div>

        {/* Portfolio Balances */}
        {mounted && isConnected && address && (
          <div className="bg-gray-800 rounded-xl p-4 space-y-2">
            <p className="text-white font-semibold text-sm mb-1">Your Vault Portfolio</p>
            {SUPPORTED_TOKENS.map((token) => (
              <PortfolioRow key={token.symbol} address={address} token={token} />
            ))}
          </div>
        )}

        {/* Deposit Form */}
        {mounted && isConnected && <DepositForm />}

        {/* Action Panel */}
        {mounted && isConnected && <ActionPanel vaultState={stateIndex} />}

        {/* Footer */}
        <div className="text-center text-xs text-gray-700 space-y-1">
          <p>Contract: {VAULT_ADDRESS}</p>
          <p>Network: Tenderly Virtual TestNet (Ethereum Mainnet Fork · Chain 9991)</p>
          <p>Chainlink Convergence Hackathon · Risk &amp; Compliance Track</p>
        </div>
      </div>
    </main>
  );
}

"use client";
import { useReadContract, useAccount } from "wagmi";
import { VAULT_ADDRESS, VAULT_ABI, VAULT_STATES } from "@/lib/contract";
import { RiskGauge } from "./components/RiskGauge";
import { DepositForm } from "./components/DepositForm";
import { ActionPanel } from "./components/ActionPanel";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { SystemicRiskFeatures } from "./components/SystemicRiskFeatures";
import { Portfolio } from "./components/Portfolio";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { address, isConnected } = useAccount();

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
    <div className="min-h-screen bg-[#07070a] text-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Hero />

        {/* Dashboard Placeholder/Target */}
        <div id="dashboard" className="scroll-mt-20 pt-10 pb-20">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Security Dashboard</h2>
            <p className="text-gray-500">Live monitoring and action center for your protected assets.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Risk & Status (8 Cols) */}
            <div className="lg:col-span-12 xl:col-span-8 space-y-6">
              
              {/* Main Risk Gauge Card */}
              <div className="bg-gray-900 shadow-2xl rounded-[2rem] border border-gray-800 p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-8xl">🛡️</span>
                </div>
                
                <div className="relative">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Live Risk Sentiment</p>
                      <h3 className="text-2xl font-bold">Systemic Risk Index</h3>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors
                      ${stateIndex === 0 ? "bg-green-500/10 border-green-500/50 text-green-400" :
                        stateIndex === 1 ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-400" :
                        "bg-red-500/10 border-red-500/50 text-red-500 animate-pulse"}`}>
                      ● {VAULT_STATES[stateIndex]}
                    </div>
                  </div>

                  <div className="max-w-md mx-auto py-4">
                    <RiskGauge score={score} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 border-t border-gray-800 pt-8">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Protocol Status</p>
                      <ul className="space-y-2 text-sm text-gray-400">
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Chainlink ETH/USD Feed</li>
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Lido TVL & Liquidity</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Network Info</p>
                      <p className="text-sm text-gray-400 font-mono">Chain: 9991 (Tenderly VNet)</p>
                      <p className="text-xs text-gray-600 truncate mt-1">Contract: {VAULT_ADDRESS}</p>
                    </div>
                  </div>
                </div>
              </div>

              {stateIndex === 2 && (
                <div className="bg-red-950/30 border border-red-900/50 p-6 rounded-2xl flex items-center gap-4">
                  <span className="text-3xl text-red-500 animate-bounce">🚨</span>
                  <div>
                    <h4 className="font-bold text-red-400">Emergency Protocol Triggered</h4>
                    <p className="text-sm text-red-300 opacity-80 leading-relaxed">
                      Systemic risk exceeded 70%. The vault has automatically liquidated all positions and returned the funds to your primary wallet address.
                    </p>
                  </div>
                </div>
              )}

              <SystemicRiskFeatures />
            </div>

            {/* Right Column: Portfolio & Deposit (4 Cols) */}
            <div className="lg:col-span-12 xl:col-span-4 space-y-6">
              {mounted && isConnected && address ? (
                <>
                  <Portfolio address={address} />
                  <DepositForm />
                  <ActionPanel vaultState={stateIndex} />
                </>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-10 text-center space-y-4">
                  <div className="text-5xl opacity-40">🔌</div>
                  <h4 className="text-xl font-bold">Connect Your Wallet</h4>
                  <p className="text-sm text-gray-500 mb-6">
                    Join the Sentinel network to protect your assets from systemic DeFi risks.
                  </p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 mt-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-6">
            <span className="text-2xl opacity-60">🛡️</span>
            <span className="font-bold text-gray-500">Vault Sentinel</span>
          </div>
          <p className="text-xs text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
            A Chainlink Convergence Hackathon prototype.<br />
            Built for Risk & Compliance and Tenderly Sponsor tracks.
          </p>
          <div className="text-[10px] text-gray-700 uppercase font-black space-x-4 tracking-widest">
            <span>Copyright © 2026</span>
            <span>·</span>
            <a href="#" className="hover:text-blue-500 transition-colors">GitHub Repo</a>
            <span>·</span>
            <a href="#" className="hover:text-blue-500 transition-colors">Technical Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

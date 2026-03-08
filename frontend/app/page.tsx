"use client";
import { useReadContract, useAccount } from "wagmi";
import { VAULT_ADDRESS, VAULT_ABI } from "@/lib/contract";
import { RiskGauge } from "./components/RiskGauge";
import { DepositForm } from "./components/DepositForm";
import { ActionPanel } from "./components/ActionPanel";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { SystemicRiskFeatures } from "./components/SystemicRiskFeatures";
import { Portfolio } from "./components/Portfolio";
import { PoolsGrid } from "./components/PoolsGrid";
import { PoolDetailModal } from "./components/PoolDetailModal";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPoolIndex, setSelectedPoolIndex] = useState<number | null>(null);
  const [preSelectedToken, setPreSelectedToken] = useState<number | undefined>(undefined);

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

  const handlePoolSelect = (poolIndex: number) => {
    setSelectedPoolIndex(poolIndex);
  };

  const handleDepositFromPool = (poolIndex: number) => {
    setPreSelectedToken(poolIndex);
    setActiveTab(2); // Switch to Deposit tab
  };

  useEffect(() => {
    document.title = "GuardAI | Autonomous Risk Protection";
  }, []);

  return (
    <div className="min-h-screen bg-[#020204] text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_50%,rgba(168,85,247,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(236,72,153,0.05),transparent_50%)]" />
      </div>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-0 pb-32">
        <AnimatePresence mode="wait">
          {/* Tab 0: Home */}
          {activeTab === 0 && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Hero />
              <div className="mt-16">
                <RiskGauge score={score} />
              </div>
              <div className="mt-16">
                <SystemicRiskFeatures />
              </div>
            </motion.div>
          )}

          {/* Tab 1: Pools */}
          {activeTab === 1 && (
            <motion.div
              key="pools"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="pt-24"
            >
              <PoolsGrid onSelectPool={handlePoolSelect} riskScore={score} />
            </motion.div>
          )}

          {/* Tab 2: Deposit */}
          {activeTab === 2 && (
            <motion.div
              key="deposit"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl mx-auto pt-24"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-12"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm text-blue-400 font-semibold">Secure Deposit</span>
                </motion.div>
                <h2 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
                  <span className="bg-linear-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                    Secure Your Assets
                  </span>
                </h2>
                <p className="text-gray-400 text-lg font-light">
                  Deposit funds into autonomously monitored protection pools.
                </p>
              </motion.div>
              
              {isConnected && address ? (
                <DepositForm preSelectedToken={preSelectedToken} />
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-12 text-center"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-6"
                  >
                    🔒
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-4">Connect Wallet Required</h3>
                  <p className="text-gray-400">
                    Please connect your wallet to deposit funds.
                  </p>
                </motion.div>
              )}
              
              <div className="mt-8">
                <ActionPanel vaultState={stateIndex} />
              </div>
            </motion.div>
          )}

          {/* Tab 3: Portfolio */}
          {activeTab === 3 && (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="pt-24"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-12"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-sm text-purple-400 font-semibold">Your Assets</span>
                </motion.div>
                <h2 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
                  <span className="bg-linear-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
                    Your Portfolio
                  </span>
                </h2>
                <p className="text-gray-400 text-lg font-light">
                  Track your protected assets and vault status in real-time.
                </p>
              </motion.div>

              {isConnected && address ? (
                <Portfolio address={address} vaultState={stateIndex} />
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="max-w-2xl mx-auto bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-12 text-center"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-6"
                  >
                    👛
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-4">No Wallet Connected</h3>
                  <p className="text-gray-400">
                    Connect your wallet to view your portfolio.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Pool Detail Modal */}
      <PoolDetailModal
        poolIndex={selectedPoolIndex}
        isOpen={selectedPoolIndex !== null}
        onClose={() => setSelectedPoolIndex(null)}
        onDeposit={handleDepositFromPool}
        riskScore={score}
      />

      <footer className="border-t border-gray-800/40 py-20 mt-20 relative bg-black/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center items-center gap-3 mb-8"
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <Image src="/logo.svg" alt="GuardAI Logo" width={32} height={32} className="w-full h-full opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
            </div>
            <span className="font-extrabold text-xl text-gray-400 tracking-tighter uppercase font-mono">GuardAI</span>
          </motion.div>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-sm text-gray-600 mb-10 max-w-md mx-auto leading-relaxed font-medium"
          >
            Engineering a trustless failsafe for the DeFi ecosystem.<br />
            Prototype build — Chainlink Convergence 2026.
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex justify-center flex-wrap gap-8 text-[10px] text-gray-700 uppercase font-black tracking-[0.2em]"
          >
            <span className="text-gray-800">© 2026 Sentinel Lab</span>
            <a href="#" className="hover:text-blue-500 transition-all border-b border-transparent hover:border-blue-500/50">Source Code</a>
            <a href="#" className="hover:text-blue-500 transition-all border-b border-transparent hover:border-blue-500/50">Documentation</a>
            <a href="#" className="hover:text-blue-500 transition-all border-b border-transparent hover:border-blue-500/50">Audit Report</a>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}

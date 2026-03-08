"use client";
import { motion, AnimatePresence } from "framer-motion";
import { POOL_DATA } from "@/lib/contract";

interface PoolDetailModalProps {
  poolIndex: number | null;
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (poolIndex: number) => void;
  riskScore: number;
}

export function PoolDetailModal({
  poolIndex,
  isOpen,
  onClose,
  onDeposit,
  riskScore,
}: PoolDetailModalProps) {
  if (poolIndex === null) return null;

  const pool = POOL_DATA[poolIndex];
  const calculatedRisk = Math.min(100, Math.round(riskScore * pool.riskMultiplier));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#020608]/40 backdrop-blur-md z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-[#0a1518] border border-white/5 rounded-4xl max-w-lg w-full p-8 relative pointer-events-auto shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-24 bg-emerald-500/5 blur-[60px] pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-center text-gray-500 hover:text-white z-20"
              >
                <span className="text-xs">✕</span>
              </button>

              <div className="relative z-10">
                {/* Header */}
                <div className="mb-8">
                  <span className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-[0.4em] mb-2 block">Asset Specification</span>
                  <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                    {pool.token.symbol} <span className="text-gray-600 font-bold">Protocol</span>
                  </h2>
                  <p className="text-gray-500 text-xs leading-relaxed max-w-sm">
                    {pool.description}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">
                      Target APY
                    </p>
                    <p className="text-lg font-bold text-white">{pool.apy}%</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">
                      Risk Rating
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-1 rounded-full ${calculatedRisk < 30 ? "bg-emerald-500" : calculatedRisk < 70 ? "bg-yellow-500" : "bg-red-500"}`} />
                      <p className={`text-lg font-bold ${calculatedRisk < 30 ? "text-emerald-400" : calculatedRisk < 70 ? "text-yellow-400" : "text-red-400"}`}>
                        {calculatedRisk}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed Analysis Section */}
                <div className="space-y-6 mb-8">
                  <div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Risk Breakdown</span>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-600">Base Risk</span>
                        <span className="text-[10px] font-mono text-white">{riskScore}/100</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-600">Multiplier</span>
                        <span className="text-[10px] font-mono text-white">{pool.riskMultiplier}x</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-600">Volatility</span>
                        <span className="text-[10px] font-mono text-emerald-500/50">Low</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-600">Liquidity</span>
                        <span className="text-[10px] font-mono text-emerald-500/50">High</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Info */}
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                    <span className="text-gray-600">Liquidity Depth</span>
                    <span className="text-white">{pool.tvl}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      onDeposit(poolIndex);
                      onClose();
                    }}
                    className="w-full py-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                  >
                    Initialize Deposit
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

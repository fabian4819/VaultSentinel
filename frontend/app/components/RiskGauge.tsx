"use client";
import { motion, AnimatePresence } from "framer-motion";

export function RiskGauge({ score }: { score: number }) {
  const percentage = Math.min(100, Math.max(0, score));

  return (
    <div className="w-full py-12 relative">
      {/* Background Glow for the Gauge Area */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-64 blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${percentage >= 70 ? "bg-red-500" : percentage >= 40 ? "bg-yellow-500" : "bg-emerald-500"}`} />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-[0.4em] mb-4 block">Verifiable Risk Metric</span>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-2">Systemic Health Index</h2>
          <p className="text-gray-500 text-sm max-w-md">Verifying real-time protocol health across multiple liquidity layers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Left Side: Status Info */}
          <div className="order-2 md:order-1 space-y-8">
            <div className="p-6 bg-[#0a1518]/40 backdrop-blur-xl rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Current Status</span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={percentage >= 70 ? "danger" : percentage >= 40 ? "alert" : "healthy"}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-2 h-2 rounded-full animate-pulse ${percentage >= 70 ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : percentage >= 40 ? "bg-yellow-500 shadow-[0_0_10px_#eab308]" : "bg-emerald-500 shadow-[0_0_10px_#10b981]"}`} />
                  <span className={`text-lg font-bold tracking-tight ${percentage >= 70 ? "text-red-400" : percentage >= 40 ? "text-yellow-400" : "text-emerald-400"}`}>
                    {percentage >= 70 ? "Critical Risk" : percentage >= 40 ? "Elevated Alert" : "System Healthy"}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className="px-2">
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 block">Auto-Sweep Protocol</span>
              <p className="text-xs text-gray-500 leading-relaxed">
                Threshold set at <span className="text-white font-mono">70/100</span>. Automated withdrawal triggers upon breach.
              </p>
            </div>
          </div>

          {/* Center: Large Score */}
          <div className="order-1 md:order-2 flex flex-col items-center justify-center relative py-10">
            <div className="relative">
              {/* Circular Progress Background */}
              <svg className="w-48 h-48 -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white/5"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="552.92"
                  initial={{ strokeDashoffset: 552.92 }}
                  animate={{ strokeDashoffset: 552.92 - (552.92 * percentage) / 100 }}
                  transition={{ duration: 2, ease: "circOut" }}
                  className={percentage >= 70 ? "text-red-500" : percentage >= 40 ? "text-yellow-500" : "text-emerald-500"}
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                  key={score}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-black tracking-tighter text-white"
                >
                  {percentage}
                </motion.span>
                <span className="text-gray-600 font-bold text-sm uppercase tracking-widest -mt-1">Score</span>
              </div>
            </div>
          </div>

          {/* Right Side: Metrics */}
          <div className="order-3 space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  <span>Volatility</span>
                  <span className="text-white">Low</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500/30 w-[20%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  <span>Liquidity</span>
                  <span className="text-white">Stable</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500/30 w-[85%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  <span>De-peg Risk</span>
                  <span className="text-white">Minimal</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500/30 w-[5%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

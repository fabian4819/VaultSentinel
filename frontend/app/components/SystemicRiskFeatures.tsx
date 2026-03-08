"use client";
import { motion } from "framer-motion";

const features = [
  {
    name: "ETH/USD Feed",
    desc: "Uses Chainlink Data Feeds to monitor price volatility and flash crashes in real-time.",
    weight: "30%"
  },
  {
    name: "Lido Health",
    desc: "Tracks TVL drains in the largest ETH staking protocol to detect exit-liquidity panics.",
    weight: "25%"
  },
  {
    name: "Aave Markets",
    desc: "Monitors borrowing rates and liquidity spikes that precede large-scale liquidations.",
    weight: "25%"
  },
  {
    name: "MakerDAO Stability",
    desc: "Detects systemic backing risks by monitoring TVL changes in the DAI engine.",
    weight: "20%"
  }
];

export function SystemicRiskFeatures() {
  return (
    <section className="py-32 relative">
      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
          <div className="max-w-xl">
            <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-[0.4em] mb-4 block">Engine Architecture</span>
            <h3 className="text-5xl font-bold text-white tracking-tight mb-6">Multi-Protocol Risk Monitoring</h3>
            <p className="text-gray-500 text-lg leading-relaxed">
              Verifiable health signals aggregated via Chainlink CRE workflows to produce a real-time safety verdict.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-4 px-6 py-3 bg-[#0a1518]/40 backdrop-blur-xl rounded-2xl border border-white/5">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a1518] bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                    {i === 1 ? "Ξ" : i === 2 ? "M" : "A"}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">4 Active Protocols</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden">
          {features.map((f, i) => (
            <motion.div 
              key={f.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#061012] p-10 hover:bg-[#0a1518] transition-colors group relative overflow-hidden"
            >
              {/* Subtle Hover Glow */}
              <div className="absolute top-0 left-0 w-full h-full bg-radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(16,185,129,0.03)_0%,transparent_50%) opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-emerald-500/30 group-hover:bg-emerald-500/5 transition-all duration-500">
                    <span className="text-xl font-bold text-white/20 group-hover:text-emerald-500/50 transition-colors">0{i + 1}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Signal Weight</span>
                    <span className="text-sm font-mono font-bold text-emerald-500/40 group-hover:text-emerald-500 transition-colors">
                      {f.weight}
                    </span>
                  </div>
                </div>

                <h4 className="text-2xl font-bold text-white mb-4 tracking-tight group-hover:translate-x-1 transition-transform duration-500">{f.name}</h4>
                <p className="text-gray-500 leading-relaxed text-base max-w-sm">
                  {f.desc}
                </p>
                
                <div className="mt-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live Feed</span>
                  <div className="flex-1 h-px bg-emerald-500/20" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA/Info */}
        <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-8 text-center md:text-left">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chainlink Functions v2.1</span>
          </div>
          <p className="text-gray-600 text-xs font-medium max-w-md">
            All risk signals are cryptographically verified and processed through decentralized oracle networks.
          </p>
        </div>
      </div>
    </section>
  );
}

"use client";
import { motion } from "framer-motion";

const steps = [
  {
    title: "Monitor",
    desc: "Chainlink Functions continuously scan multi-chain protocol health and liquidity depth.",
    icon: "01"
  },
  {
    title: "Analyze",
    desc: "The GuardAI engine processes signals to detect systemic risks before they escalate.",
    icon: "02"
  },
  {
    title: "Protect",
    desc: "Automated CRE workflows trigger instant fund withdrawals to secure vaults.",
    icon: "03"
  }
];

export function HowItWorks() {
  return (
    <section className="py-32 relative border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-[0.4em] mb-4 block">Operational Flow</span>
          <h3 className="text-4xl font-bold text-white tracking-tight">Autonomous Protection Cycle</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="relative group flex flex-col items-center text-center"
            >
              {/* Connector Line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-linear-to-r from-emerald-500/20 to-transparent z-0" />
              )}

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-3xl bg-[#0a1518]/60 backdrop-blur-xl border border-white/5 flex items-center justify-center mb-8 group-hover:border-emerald-500/30 transition-all duration-500 shadow-2xl">
                  <span className="text-2xl font-black text-emerald-500/20 group-hover:text-emerald-500 transition-colors duration-500">
                    {step.icon}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-white mb-4 tracking-tight">{step.title}</h4>
                <p className="text-gray-500 leading-relaxed text-sm max-w-60">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

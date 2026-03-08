"use client";
import { motion } from "framer-motion";

interface TabNavigationProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  isCompact?: boolean;
}

const TABS = [
  { id: 0, label: "Home" },
  { id: 1, label: "Pools" },
  { id: 2, label: "Deposit" },
  { id: 3, label: "Portfolio" },
];

export function TabNavigation({ activeTab, setActiveTab, isCompact = false }: TabNavigationProps) {
  return (
    <div className={`flex ${isCompact ? "justify-center" : "justify-center"} ${isCompact ? "" : "mb-8"}`}>
      <div className={`inline-flex ${isCompact ? "bg-transparent" : "bg-gray-900/60"} backdrop-blur-xl p-1 rounded-2xl ${isCompact ? "border-none" : "border border-gray-800/50"} relative overflow-hidden transition-all duration-300`}>
        {!isCompact && (
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 opacity-30"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
        
        <div className="relative flex gap-1">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

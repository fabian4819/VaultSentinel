"use client";
import { useEffect, useRef, useState } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { motion } from "framer-motion";
import gsap from "gsap";
import { TabNavigation } from "./TabNavigation";
import Image from "next/image";

interface NavbarProps {
  activeTab?: number;
  setActiveTab?: (tab: number) => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const navRef = useRef(null);

  useEffect(() => { 
    setMounted(true); 
  }, []);

  useEffect(() => {
    if (mounted) {
      gsap.fromTo(navRef.current, 
        { y: -100, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1, ease: "power4.out" }
      );
    }
  }, [mounted]);

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <nav ref={navRef} className="fixed top-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="flex items-center bg-[#0a1518]/60 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-2xl shadow-2xl pointer-events-auto transition-all">
        <div className="flex items-center gap-10">
          <motion.div 
            whileHover={{ opacity: 0.8 }}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab?.(0)}
          >
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full group-hover:bg-blue-500/40 transition-all" />
              <Image src="/logo.svg" alt="GuardAI Logo" width={24} height={24} className="relative z-10 w-full h-full opacity-90 group-hover:opacity-100 transition-all" />
            </div>
            <span className="font-bold text-[13px] tracking-[0.3em] text-white uppercase whitespace-nowrap">
              GuardAI
            </span>
          </motion.div>

          <div className="h-4 w-px bg-white/10" />

          {/* Inline Tab Navigation for a cleaner look */}
          {activeTab !== undefined && setActiveTab && (
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} isCompact />
          )}

          <div className="h-4 w-px bg-white/10" />
        
          <div className="flex items-center gap-6">
            <motion.a
              href="#"
              whileHover={{ opacity: 0.9, y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 group hover:border-emerald-500/30 hover:bg-emerald-500/5 shadow-2xl"
            >
              Read Docs
              <svg 
                width="10" 
                height="10" 
                viewBox="0 0 12 12" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 opacity-60 group-hover:opacity-100"
              >
                <path d="M1 11L11 1M11 1H3.5M11 1V8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.a>

            {mounted && isConnected ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 px-4 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl group transition-all hover:border-emerald-500/40"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <p className="text-[11px] font-mono font-bold text-emerald-400/80 whitespace-nowrap tracking-wider">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <button 
                  onClick={() => disconnect()}
                  className="text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-red-400 transition-colors"
                >
                  Disconnect
                </button>
              </motion.div>
            ) : mounted ? (
              <motion.button
                whileHover={{ opacity: 0.8 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => connect({ connector: injected() })}
                className="text-white text-[10px] font-black uppercase tracking-widest transition-all px-2"
              >
                Connect
              </motion.button>
            ) : (
              <div className="w-16 h-4 bg-white/5 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

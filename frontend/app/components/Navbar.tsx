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
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6 pointer-events-none">
      <div className="flex items-center bg-gray-950/20 backdrop-blur-lg border border-white/5 px-6 py-2.5 rounded-2xl shadow-xl pointer-events-auto transition-all">
        <div className="flex items-center gap-8">
          <motion.div 
            whileHover={{ opacity: 0.8 }}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab?.(0)}
          >
            <div className="relative w-6 h-6 flex items-center justify-center">
              <Image src="/logo.svg" alt="GuardAI Logo" width={24} height={24} className="w-full h-full" />
            </div>
            <span className="font-black text-[11px] tracking-[0.25em] text-white uppercase whitespace-nowrap">
              GuardAI
            </span>
          </motion.div>

          <div className="h-4 w-px bg-white/10" />

          {/* Inline Tab Navigation for a cleaner look */}
          {activeTab !== undefined && setActiveTab && (
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} isCompact />
          )}

          <div className="h-4 w-px bg-white/10" />
        
          <div className="flex items-center gap-4">
            {mounted && isConnected ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
              >
                <p className="text-[10px] font-mono font-bold text-gray-400 whitespace-nowrap">{address?.slice(0, 4)}...{address?.slice(-4)}</p>
                <button 
                  onClick={() => disconnect()} 
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20"
                  title="Disconnect"
                >
                  <span className="text-xs">○</span>
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

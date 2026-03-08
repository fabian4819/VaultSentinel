"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export function Hero() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // Glow animation
      gsap.to(".glow-effect", {
        opacity: 0.8,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Floating animation for cards
      gsap.to(".floating-card", {
        y: -20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2
      });

      // Title reveal
      gsap.from(".hero-title", {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      });

      gsap.from(".hero-description", {
        y: 20,
        opacity: 0,
        duration: 1,
        delay: 0.3,
        ease: "power3.out"
      });

      gsap.from(".hero-cta", {
        y: 20,
        opacity: 0,
        duration: 1,
        delay: 0.5,
        ease: "power3.out"
      });
    }, containerRef);

    return () => ctx.revert();
  }, [mounted]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#020608]"
    >
      {/* Background Neon Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-250 h-150 bg-emerald-500/15 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-300 h-200 bg-emerald-500/30 blur-[130px] rounded-full glow-effect" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full animate-pulse decoration-indigo-500" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_30%,transparent_100%)] opacity-30 shadow-inner" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-24 scale-90 md:scale-100 origin-top">
        {/* Main Title */}
        <h1 className="hero-title text-6xl md:text-[110px] font-black mb-4 leading-none tracking-tighter text-white opacity-90 blur-[0.5px]">
          Guard<span className="text-emerald-500">AI</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle text-xl md:text-2xl font-bold text-[#e2e8f0] mb-4 tracking-tight">
          Autonomous Risk Detection & <span className="opacity-60 text-emerald-400">Automated Fund Protection</span>
        </p>

        {/* Description */}
        <p className="hero-description text-base md:text-lg text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed">
          Powered by Chainlink Functions and CRE Workflows. Protect your DeFi assets 
          with real-time risk monitoring and instant autonomous response.
        </p>

        {/* Bottom Cards Visualization */}
        <div className="relative w-full max-w-4xl mx-auto h-80">
          {/* Main Dashboard Card - Security Status */}
          <div className="floating-card absolute left-1/2 -translate-x-1/2 top-0 w-full max-w-md aspect-4/3 bg-[#0a1518]/60 backdrop-blur-2xl rounded-3xl border border-white/5 p-8 shadow-[0_0_80px_rgba(0,0,0,0.5)] z-20 overflow-hidden text-left">
            <div className="flex flex-col h-full relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-1 block">System Protocol</span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Security Status</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Active</span>
                </div>
              </div>
              
              <div className="space-y-6 mb-auto">
                <div>
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                    <span>Protected Assets</span>
                    <span className="text-white">$ 12.5M</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500/50 w-[78%] shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                    <span>Risk Health</span>
                    <span className="text-emerald-400">98%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500/50 w-[98%] shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600 font-mono tracking-tighter">NETWORK_LOGGED</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">v2.4.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Left Side Card - Risk Analysis */}
          <div className="floating-card absolute left-[-25%] md:left-[-25%] top-20 w-70 aspect-4/3 bg-[#0a1518]/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 z-10 -rotate-12 opacity-30 text-left">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400 text-[10px] uppercase font-bold">Threat Level</span>
              <span className="text-[10px] text-emerald-500 font-bold underline opacity-50">MINIMAL</span>
            </div>
            <div className="text-2xl font-bold text-white mb-4 italic opacity-80">Stable</div>
            <div className="h-20 w-full flex items-end gap-1">
              {[40, 30, 35, 20, 25, 15, 10].map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-emerald-500/20 rounded-t-sm" 
                  style={{ height: `${h}%` } as React.CSSProperties} 
                />
              ))}
            </div>
          </div>

          {/* Right Side Card - Active Safeguards */}
          <div className="floating-card absolute right-[-25%] md:right-[-25%] top-20 w-70 aspect-4/3 bg-[#0a1518]/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 z-10 rotate-12 opacity-30 text-left">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-400 text-[10px] uppercase font-bold opacity-50">Safeguards</span>
              <div className="w-3 h-3 rounded-full border border-emerald-500/30 flex items-center justify-center">
                <div className="w-1 h-1 bg-emerald-500/50 rounded-full" />
              </div>
            </div>
            <div className="space-y-4 opacity-60">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-500 uppercase">Functions</span>
                <span className="text-emerald-400 font-mono">ENABLED</span>
              </div>
              <div className="w-full h-px bg-white/5" />
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-500 uppercase">Auto-Withdraw</span>
                <span className="text-white font-mono opacity-30">READY</span>
              </div>
            </div>
          </div>

          {/* Perspective Streaks */}
          <div className="absolute -bottom-37.5 left-1/2 -translate-x-1/2 w-300 h-100 pointer-events-none">
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_0%,transparent_0deg,rgba(16,185,129,0.3)_180deg,transparent_360deg)] opacity-40 blur-3xl rotate-180" />
            <div className="absolute top-0 left-0 w-full h-full flex justify-around px-40">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-px h-full bg-linear-to-t from-emerald-500/40 via-emerald-500/5 to-transparent origin-top"
                  style={{ transform: `rotate(${(i - 3.5) * 15}deg)` } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-px h-12 bg-linear-to-b from-emerald-500/50 to-transparent" />
    </section>
  );
}

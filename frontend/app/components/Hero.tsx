"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Enhanced parallax with spring physics
  const y1 = useSpring(useTransform(scrollY, [0, 500], [0, 200]), { stiffness: 100, damping: 30 });
  const y2 = useSpring(useTransform(scrollY, [0, 500], [0, -150]), { stiffness: 100, damping: 30 });
  const y3 = useSpring(useTransform(scrollY, [0, 500], [0, 100]), { stiffness: 80, damping: 25 });
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.8]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // Enhanced floating blobs with complex paths
      gsap.to(blob1Ref.current, {
        x: '+=80',
        y: '+=50',
        scale: 1.2,
        rotation: 180,
        duration: 12,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      
      gsap.to(blob2Ref.current, {
        x: '-=60',
        y: '-=80',
        scale: 0.8,
        rotation: -180,
        duration: 15,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      gsap.to(blob3Ref.current, {
        x: '+=40',
        y: '-=30',
        scale: 1.1,
        rotation: 90,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Text reveal with stagger
      gsap.from(".hero-title", {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: "power4.out",
        stagger: 0.1
      });
      
      gsap.from(".hero-subtitle", {
        opacity: 0,
        y: 30,
        duration: 1.2,
        delay: 0.5,
        ease: "power3.out"
      });

      gsap.from(".hero-description", {
        opacity: 0,
        y: 20,
        duration: 1,
        delay: 0.8,
        ease: "power2.out"
      });

      gsap.from(".hero-cta", {
        opacity: 0,
        scale: 0.9,
        y: 20,
        duration: 0.8,
        delay: 1,
        stagger: 0.15,
        ease: "back.out(1.7)"
      });

      // Stats counter animation
      gsap.from(".hero-stat", {
        opacity: 0,
        y: 40,
        duration: 0.8,
        delay: 1.2,
        stagger: 0.1,
        ease: "power3.out"
      });

      // ScrollTrigger for fade out
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          if (containerRef.current) {
            containerRef.current.style.opacity = (1 - self.progress * 1.5).toString();
          }
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, [mounted]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Animated Background Blobs - Enhanced */}
      <motion.div 
        ref={blob1Ref}
        style={{ y: y1, opacity, scale }}
        className="absolute top-20 left-10 w-125 h-125 bg-linear-to-br from-blue-600/30 via-purple-600/20 to-transparent rounded-full blur-[150px] mix-blend-screen"
      />
      <motion.div 
        ref={blob2Ref}
        style={{ y: y2, opacity, scale }}
        className="absolute bottom-20 right-10 w-112.5 h-112.5 bg-linear-to-tl from-indigo-600/25 via-pink-600/20 to-transparent rounded-full blur-[120px] mix-blend-screen"
      />
      <motion.div 
        ref={blob3Ref}
        style={{ y: y3, opacity, scale }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 bg-linear-to-r from-cyan-600/20 via-blue-600/15 to-transparent rounded-full blur-[100px] mix-blend-screen"
      />

      {/* Particle System */}
      <div 
        ref={particlesRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <AnimatePresence>
          {mounted && [...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
              style={{
                left: `${(i * 13.7) % 100}%`,
                top: `${(i * 21.3) % 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + (i % 4),
                repeat: Infinity,
                delay: (i % 10) * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Animated Grid Pattern */}
      <motion.div 
        style={{ opacity, scale }}
        className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-size-[64px_64px]"
        animate={{
          backgroundPosition: ['0px 0px', '64px 64px'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-linear-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-sm text-blue-300 font-semibold tracking-wide">Chainlink Convergence 2026</span>
          </motion.div>
        </motion.div>

        {/* Main Title */}
        <h1 className="hero-title text-6xl md:text-8xl font-bold mb-6 leading-none tracking-tight">
          <span className="block text-white">
            Vault
          </span>
          <span className="block text-blue-500">
            Sentinel
          </span>
        </h1>

        {/* Subtitle */}
        <motion.p
          className="hero-subtitle text-xl md:text-2xl text-gray-400 mb-6 max-w-3xl mx-auto leading-relaxed font-normal"
        >
          Autonomous Risk Detection &{" "}
          <span className="text-white">Automated Fund Protection</span>
        </motion.p>

        {/* Description */}
        <motion.p
          className="hero-description text-base text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Powered by Chainlink Functions and CRE Workflows. Protect your DeFi assets 
          with real-time systemic risk monitoring and instant emergency response.
        </motion.p>

        {/* CTA Buttons */}
        <div className="hero-cta flex flex-wrap justify-center gap-4 mb-16">
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: "#3b82f6" }}
            whileTap={{ scale: 0.98 }}
            className="group relative px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-base transition-all"
          >
            Launch App
          </motion.button>
          
          <motion.button
            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-transparent text-gray-400 rounded-xl font-bold text-base transition-all border border-gray-800"
          >
            Documentation
          </motion.button>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          {[
            { value: "$2.5M+", label: "TVL Protected", color: "from-blue-400 to-cyan-400" },
            { value: "150+", label: "Active Users", color: "from-purple-400 to-pink-400" },
            { value: "<50ms", label: "Response Time", color: "from-green-400 to-emerald-400" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="hero-stat p-6 rounded-3xl bg-linear-to-br from-white/5 to-white/2 border border-white/10 backdrop-blur-sm"
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "rgba(255,255,255,0.08)"
              }}
              transition={{ duration: 0.3 }}
            >
              <p className={`text-5xl font-black mb-2 bg-linear-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
              <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Enhanced Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs text-gray-500 uppercase tracking-widest">Scroll</span>
          <div className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-3 rounded-full bg-linear-to-b from-blue-400 to-purple-400"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

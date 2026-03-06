"use client";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useEffect, useState } from "react";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Vault Sentinel
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {mounted && isConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold leading-none">Connected</p>
                  <p className="text-sm font-medium text-gray-300">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                </div>
                <button 
                  onClick={() => disconnect()} 
                  className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : mounted ? (
              <button
                onClick={() => connect({ connector: injected() })}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="w-32 h-9 bg-gray-800 rounded-xl animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

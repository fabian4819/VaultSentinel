"use client";
import { useReadContract, useAccount } from "wagmi";
import { formatUnits } from "viem";
import { VAULT_ADDRESS, VAULT_ABI, SUPPORTED_TOKENS } from "@/lib/contract";

function PortfolioRow({ address, token }: { address: `0x${string}`; token: typeof SUPPORTED_TOKENS[number] }) {
  const { data: balance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getUserBalance",
    args: [address, token.address],
    query: { refetchInterval: 5000 },
  });
  const formatted = balance ? formatUnits(balance as bigint, token.decimals) : "0";
  const hasBalance = balance && Number(balance) > 0;
  return (
    <div className={`flex justify-between items-center px-4 py-3 rounded-xl border border-gray-700/50 transition-colors ${hasBalance ? "bg-blue-900/10 border-blue-800/30" : "bg-gray-800/30 opacity-60"}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
          {token.symbol[0]}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{token.symbol}</p>
          <p className="text-[10px] text-gray-500 uppercase">{token.label}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-mono ${hasBalance ? "text-blue-400" : "text-gray-600"}`}>{formatted}</p>
        <p className="text-[10px] text-gray-600 uppercase">Balance</p>
      </div>
    </div>
  );
}

export function Portfolio({ address }: { address: `0x${string}` }) {
  return (
    <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-5 space-y-3">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Your Portfolio</h3>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
          <p className="text-[10px] text-blue-500 font-bold uppercase">Live</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {SUPPORTED_TOKENS.map((token) => (
          <PortfolioRow key={token.symbol} address={address} token={token} />
        ))}
      </div>
    </div>
  );
}

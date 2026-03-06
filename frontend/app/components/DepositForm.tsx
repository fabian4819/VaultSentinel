"use client";
import { useState } from "react";
import { useWriteContract, useReadContract, useAccount, useBalance } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { VAULT_ADDRESS, VAULT_ABI, ERC20_ABI, SUPPORTED_TOKENS } from "@/lib/contract";

export function DepositForm() {
  const { address } = useAccount();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [amount, setAmount] = useState("1");
  const [approving, setApproving] = useState(false);

  const token = SUPPORTED_TOKENS[selectedIndex];

  const { writeContract, isPending } = useWriteContract();

  // Read vault balance for selected token
  const { data: vaultBalance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getUserBalance",
    args: [address as `0x${string}`, token.address],
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // Read native ETH wallet balance
  const { data: ethBalance } = useBalance({ address });

  // Read ERC20 wallet balance
  const { data: erc20Balance } = useReadContract({
    address: token.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: { enabled: !!address && !token.isNative, refetchInterval: 5000 },
  });

  const walletDisplay = token.isNative
    ? `${ethBalance ? (Number(ethBalance.value) / 1e18).toFixed(4) : "0"} ETH`
    : `${erc20Balance ? formatUnits(erc20Balance as bigint, token.decimals) : "0"} ${token.symbol}`;

  const vaultDisplay = vaultBalance
    ? formatUnits(vaultBalance as bigint, token.decimals)
    : "0";

  async function handleDeposit() {
    if (!amount || isNaN(Number(amount))) return;
    const amt = parseUnits(amount, token.decimals);

    if (token.isNative) {
      writeContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "depositETH",
        value: amt,
      });
    } else {
      setApproving(true);
      writeContract({
        address: token.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [VAULT_ADDRESS, amt],
      });
      
      // For POC simplicity, assuming user confirms.
      // In production we would watch for the transaction receipt.
      setTimeout(() => {
        setApproving(false);
        writeContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "depositERC20",
          args: [token.address, amt],
        });
      }, 5000);
    }
  }

  const isBtnDisabled = approving || isPending || !amount || Number(amount) <= 0;

  const buttonLabel = approving
    ? "Confirming Approval..."
    : isPending
    ? "Executing Deposit..."
    : `Deposit ${token.symbol}`;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-6 space-y-5">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Add Protection</h3>
        <span className="text-[10px] text-gray-700 font-mono">{token.symbol} Position</span>
      </div>

      {/* Token Selector Tabs */}
      <div className="flex p-1.5 bg-black/40 rounded-2xl border border-gray-800">
        {SUPPORTED_TOKENS.map((t, i) => (
          <button
            key={t.symbol}
            onClick={() => { setSelectedIndex(i); setAmount(t.isNative ? "1" : "100"); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all
              ${i === selectedIndex
                ? "bg-gray-800 text-white shadow-sm border border-gray-700"
                : "text-gray-500 hover:text-gray-300"}`}
          >
            {t.symbol}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Input Card */}
        <div className="bg-black/30 border border-gray-800 rounded-2xl p-4 transition-all focus-within:border-blue-600/50">
          <div className="flex justify-between text-[10px] uppercase font-bold text-gray-600 mb-2">
            <span>Deposit Amount</span>
            <span>Wallet: {walletDisplay}</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              step={token.isNative ? "0.1" : "10"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-xl font-mono text-white outline-none placeholder:text-gray-800"
              placeholder="0.00"
            />
            <span className="text-gray-400 font-bold">{token.symbol}</span>
          </div>
        </div>

        {/* Vault Stats */}
        <div className="flex items-center justify-between px-2 text-[10px] uppercase font-bold text-gray-600">
          <span>Current Position</span>
          <span className="text-blue-500">{vaultDisplay} {token.symbol}</span>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleDeposit}
          disabled={isBtnDisabled}
          className={`w-full py-4 rounded-2xl font-bold transition-all relative overflow-hidden group
            ${isBtnDisabled ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40"}`}
        >
          <span className="relative z-10">{buttonLabel}</span>
          {!isBtnDisabled && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-white/40 transition-all" />
          )}
        </button>

        {!token.isNative && (
          <div className="px-2">
            <p className="text-[10px] text-gray-500 text-center leading-relaxed">
              Whitelisted ERC20 deposit requires approval for the {VAULT_ADDRESS.slice(0,6)} contract.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useWriteContract, useReadContract, useAccount, useBalance } from "wagmi";
import { parseEther } from "viem";
import { VAULT_ADDRESS, VAULT_ABI } from "@/lib/contract";

export function DepositForm() {
  const [amount, setAmount] = useState("1"); // 1 ETH default
  const { address } = useAccount();
  const { writeContract: deposit, isPending: isDepositing } = useWriteContract();

  const { data: vaultBalance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getUserBalance",
    args: [address as `0x${string}`],
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: walletBalance } = useBalance({
    address: address,
  });

  async function handleDeposit() {
    const amt = parseEther(amount);
    deposit({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "deposit",
      value: amt
    });
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex justify-between">
        <h3 className="text-white font-semibold">Deposit Funds</h3>
        <p className="text-gray-400 text-sm">
          Wallet: {walletBalance ? Number(walletBalance.value) / 1e18 : "0"} ETH
        </p>
      </div>
      <p className="text-gray-400 text-sm">
        Your vault balance: {vaultBalance ? (Number(vaultBalance) / 1e18).toFixed(2) : "0"} ETH
      </p>
      <div className="flex gap-2">
        <input
          type="number"
          step="0.1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
          placeholder="Amount (ETH)"
        />
        <button
          onClick={handleDeposit}
          disabled={isDepositing}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {isDepositing ? "Depositing..." : "Deposit"}
        </button>
      </div>
    </div>
  );
}

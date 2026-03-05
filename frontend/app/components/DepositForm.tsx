"use client";
import { useState } from "react";
import { useWriteContract, useReadContract, useAccount, useBalance } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { VAULT_ADDRESS, VAULT_ABI, ERC20_ABI, SUPPORTED_TOKENS, ETH_ADDRESS } from "@/lib/contract";

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
    ? formatUnits(vaultBalance as bigint, token.decimals) + " " + token.symbol
    : `0 ${token.symbol}`;

  async function handleDeposit() {
    const amt = parseUnits(amount, token.decimals);

    if (token.isNative) {
      writeContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "depositETH",
        value: amt,
      });
    } else {
      // Step 1: approve
      setApproving(true);
      writeContract({
        address: token.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [VAULT_ADDRESS, amt],
      });
      // Step 2: deposit after short delay (user confirms approval tx)
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

  const buttonLabel = approving
    ? "Approving..."
    : isPending
    ? "Depositing..."
    : `Deposit ${token.symbol}`;

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-3">
      <h3 className="text-white font-semibold">Deposit Funds</h3>

      {/* Token Selector */}
      <div className="flex gap-2">
        {SUPPORTED_TOKENS.map((t, i) => (
          <button
            key={t.symbol}
            onClick={() => { setSelectedIndex(i); setAmount(t.isNative ? "1" : "100"); }}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${i === selectedIndex
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
          >
            {t.symbol}
          </button>
        ))}
      </div>

      {/* Balances */}
      <div className="text-gray-400 text-xs flex justify-between">
        <span>Wallet: {walletDisplay}</span>
        <span>In Vault: {vaultDisplay}</span>
      </div>

      {/* Amount Input + Button */}
      <div className="flex gap-2">
        <input
          type="number"
          step={token.isNative ? "0.1" : "10"}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
          placeholder={`Amount (${token.symbol})`}
        />
        <button
          onClick={handleDeposit}
          disabled={approving || isPending}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {buttonLabel}
        </button>
      </div>

      {!token.isNative && (
        <p className="text-gray-500 text-xs">
          ⚠️ ERC20 deposits require 2 wallet confirmations: Approve then Deposit.
        </p>
      )}
    </div>
  );
}

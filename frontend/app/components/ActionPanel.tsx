"use client";
import { useWriteContract, useAccount } from "wagmi";
import { VAULT_ADDRESS, VAULT_ABI } from "@/lib/contract";

export function ActionPanel({ vaultState }: { vaultState: number }) {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  // For Hackathon Demo: allow user manually triggering emergency if score is high
  function handleTrigger() {
    writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "triggerEmergency",
    });
  }

  function handleReset() {
    writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "resetVault",
    });
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-6 space-y-4">
       <div className="flex justify-between items-center px-1">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest text">System Controls</h3>
        <div className="flex items-center gap-1.5 grayscale opacity-50">
           <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
           <p className="text-[10px] text-gray-700 font-bold uppercase">Authorized</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={handleTrigger}
          disabled={isPending || vaultState === 2}
          className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl text-xs font-bold border border-red-900/30 transition-all disabled:opacity-30"
        >
          {isPending ? "Connecting..." : "Manual Emergency Trigger"}
        </button>

        <button
          onClick={handleReset}
          disabled={isPending || vaultState === 0}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold border border-gray-700 transition-all disabled:opacity-30"
        >
          Reset Vault State (Owner Only)
        </button>
      </div>

      <div className="px-2">
        <p className="text-[9px] text-gray-600 text-center uppercase tracking-tighter leading-tight font-medium">
          Note: These controls are typically restricted to the CRE workflow. 
          Shown here for hackathon demonstration.
        </p>
      </div>
    </div>
  );
}

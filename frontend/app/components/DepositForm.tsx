"use client";
import { useState } from "react";
import { useWriteContract, useReadContract, useAccount, useBalance, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { VAULT_ADDRESS, VAULT_ABI, ERC20_ABI, SUPPORTED_TOKENS } from "@/lib/contract";
import { motion } from "framer-motion";

interface DepositFormProps {
  preSelectedToken?: number;
}

export function DepositForm({ preSelectedToken }: DepositFormProps) {
  const { address } = useAccount();
  const [selectedIndex, setSelectedIndex] = useState(preSelectedToken ?? 0);
  const [amount, setAmount] = useState("1");
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [depositTxHash, setDepositTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [isDepositing, setIsDepositing] = useState(false);

  const token = SUPPORTED_TOKENS[selectedIndex];

  const { writeContractAsync } = useWriteContract();

  // Watch approve tx
  const { isLoading: waitingApprove, isSuccess: approveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  // Watch deposit tx — show success state
  const { isLoading: waitingDeposit, isSuccess: depositSuccess } = useWaitForTransactionReceipt({
    hash: depositTxHash,
  });
  const { data: vaultBalance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getUserBalance",
    args: [address as `0x${string}`, token.address],
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: ethBalance } = useBalance({ address });

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

  // ETH: single-step deposit
  async function handleDepositETH() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    setIsDepositing(true);
    try {
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "depositETH",
        value: parseUnits(amount, 18),
      });
      setDepositTxHash(hash);
    } catch (e) {
      console.error("Deposit ETH failed", e);
    } finally {
      setIsDepositing(false);
    }
  }

  // ERC20 Step 1: Approve
  async function handleApprove() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    try {
      const hash = await writeContractAsync({
        address: token.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [VAULT_ADDRESS, parseUnits(amount, token.decimals)],
      });
      setApproveTxHash(hash);
    } catch (e) {
      console.error("Approve failed", e);
    }
  }

  // ERC20 Step 2: Deposit (after approve confirmed)
  async function handleDepositERC20() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    setIsDepositing(true);
    try {
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "depositERC20",
        args: [token.address, parseUnits(amount, token.decimals)],
      });
      setDepositTxHash(hash);
      setApproveTxHash(undefined);
    } catch (e) {
      console.error("Deposit ERC20 failed", e);
    } finally {
      setIsDepositing(false);
    }
  }

  const isApproving = !!approveTxHash && waitingApprove;
  const readyToDeposit = !!approveTxHash && approveConfirmed && !token.isNative;
  const depositConfirmed = !!depositTxHash && waitingDeposit === false && depositSuccess;

  let buttonLabel = token.isNative ? `Deposit ${token.symbol}` : `Approve & Deposit ${token.symbol}`;
  let buttonAction = token.isNative ? handleDepositETH : handleApprove;
  let isBtnDisabled = isApproving || isDepositing || !amount || Number(amount) <= 0;

  if (depositConfirmed) {
    buttonLabel = `✅ Deposit Confirmed!`;
    isBtnDisabled = false;
  } else if (isApproving) {
    buttonLabel = "Waiting for Approval...";
    isBtnDisabled = true;
  } else if (readyToDeposit) {
    buttonLabel = `Confirm Deposit ${token.symbol}`;
    buttonAction = handleDepositERC20;
  } else if (isDepositing) {
    buttonLabel = "Executing Deposit...";
    isBtnDisabled = true;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-[#0a1518]/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 space-y-10 relative overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-8">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Select Asset</span>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 rounded-full border border-emerald-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-500/50 font-bold uppercase tracking-widest">Live Network</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-12">
          {SUPPORTED_TOKENS.map((t, i) => (
            <button
              key={t.symbol}
              onClick={() => {
                setSelectedIndex(i);
                setAmount(t.isNative ? "1" : "100");
                setApproveTxHash(undefined);
              }}
              className={`py-4 rounded-2xl border transition-all duration-500 flex flex-col items-center gap-2 ${
                selectedIndex === i
                  ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                  : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
              }`}
            >
              <span className="text-lg font-bold">{t.symbol}</span>
              <span className="text-[8px] uppercase tracking-widest font-bold opacity-50">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-8">
          <div className="relative">
            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
              <span>Amount</span>
              <span>Wallet: {walletDisplay}</span>
            </div>
            <div className="relative group">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-emerald-500/30 rounded-2xl py-6 px-8 text-3xl font-bold text-white outline-none transition-all"
                placeholder="0.00"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <button
                  onClick={() => setAmount(token.isNative ? "1" : "100")}
                  className="text-[10px] font-bold text-emerald-500/50 hover:text-emerald-500 uppercase tracking-widest transition-colors"
                >
                  Max
                </button>
              </div>
            </div>
          </div>

          {/* Step indicator for ERC20 */}
          {!token.isNative && (
            <div className="flex items-center gap-3 px-1">
              <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${approveTxHash ? "text-emerald-400" : "text-gray-500"}`}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-black ${approveTxHash ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" : "border-white/20 text-gray-600"}`}>1</div>
                Approve
              </div>
              <div className="flex-1 h-px bg-white/10" />
              <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${readyToDeposit ? "text-emerald-400" : "text-gray-500"}`}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-black ${readyToDeposit ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" : "border-white/20 text-gray-600"}`}>2</div>
                Deposit
              </div>
            </div>
          )}

          <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
              <span className="text-gray-500">Vault Balance</span>
              <span className="text-white">{vaultDisplay} {token.symbol}</span>
            </div>
            <div className="w-full h-px bg-white/5" />
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
              <span className="text-gray-500">Protection Status</span>
              <span className="text-emerald-400">Active</span>
            </div>
          </div>

          <button
            onClick={buttonAction}
            disabled={isBtnDisabled}
            className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 ${
              isBtnDisabled
                ? "bg-white/5 text-gray-700 cursor-not-allowed"
                : readyToDeposit
                ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
            }`}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

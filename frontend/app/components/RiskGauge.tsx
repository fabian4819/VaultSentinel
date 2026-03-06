export function RiskGauge({ score }: { score: number }) {
  const percentage = Math.min(100, Math.max(0, score));

  // Determine color based on risk score
  const getBarColor = () => {
    if (percentage >= 70) return "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]";
    if (percentage >= 40) return "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]";
    return "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]";
  };

  const getTextColor = () => {
    if (percentage >= 70) return "text-red-500";
    if (percentage >= 40) return "text-yellow-500";
    return "text-blue-500";
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex items-baseline gap-1">
          <span className={`text-6xl font-black font-mono tracking-tighter ${getTextColor()}`}>
            {percentage}
          </span>
          <span className="text-gray-600 font-bold text-lg">/100</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest leading-none mb-1">Risk Rating</p>
          <span className={`text-xs font-bold uppercase tracking-tight ${getTextColor()}`}>
            {percentage >= 70 ? "Critical Danger" : percentage >= 40 ? "Elevated Alert" : "Stable Health"}
          </span>
        </div>
      </div>

      <div className="relative h-4 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        />
        
        {/* Safe/Danger marks */}
        <div className="absolute top-0 right-0 h-full w-[30%] bg-red-500/10 border-l border-red-500/20" />
      </div>

      <div className="flex justify-between px-1">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Safe</span>
        <div className="flex items-center gap-1.5 grayscale opacity-50">
           <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse" />
           <span className="text-[9px] font-bold text-gray-500 uppercase">Emergency Threshold: 70</span>
        </div>
        <span className="text-[9px] font-bold text-red-900 uppercase tracking-widest">High Danger</span>
      </div>
    </div>
  );
}

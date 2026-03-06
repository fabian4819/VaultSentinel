const features = [
  {
    icon: "📈",
    name: "ETH/USD Feed",
    desc: "Uses Chainlink Data Feeds to monitor price volatility and flash crashes in real-time.",
    weight: "30%"
  },
  {
    icon: "💧",
    name: "Lido Health",
    desc: "Tracks TVL drains in the largest ETH staking protocol to detect exit-liquidity panics.",
    weight: "25%"
  },
  {
    icon: "🏦",
    name: "Aave Markets",
    desc: "Monitors borrowing rates and liquidity spikes that precede large-scale liquidations.",
    weight: "25%"
  },
  {
    icon: "🛡️",
    name: "MakerDAO Stability",
    desc: "Detects systemic backing risks by monitoring TVL changes in the DAI engine.",
    weight: "20%"
  }
];

export function SystemicRiskFeatures() {
  return (
    <section className="py-16 bg-gray-900/50 rounded-3xl border border-gray-800 my-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-white mb-2">Multi-Protocol Risk Engine</h3>
          <p className="text-gray-400">Our Chainlink CRE workflow aggregates signals from across the DeFi stack.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.name} className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-blue-500 transition-colors group">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h4 className="text-lg font-semibold text-white mb-2">{f.name}</h4>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{f.desc}</p>
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-900/30 px-2 py-1 rounded inline-block">
                Weight: {f.weight}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

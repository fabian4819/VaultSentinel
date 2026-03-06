export function Hero() {
  return (
    <section className="relative pt-20 pb-16 overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      
      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
          Systemic DeFi Protection <br className="hidden md:block" /> Powered by Chainlink
        </h2>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The first self-custodial vault that monitors live protocol health across the ecosystem. 
          When systemic risk spikes, your assets are automatically returned to your wallet.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <a 
            href="#dashboard" 
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xl shadow-blue-900/30 transition-all hover:-translate-y-0.5"
          >
            Open Dashboard
          </a>
          <button className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-all border border-gray-700">
            View Docs
          </button>
        </div>
      </div>
    </section>
  );
}

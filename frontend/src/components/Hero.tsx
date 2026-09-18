import { Sparkles, Zap, Cpu, Activity, Clock } from 'lucide-react'


export const Hero: React.FC = () => {
  return (
    <div className="relative pt-10 pb-8 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center px-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Built for Avalanche Builder Day Shenzhen 2026</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          Sub-Second Micro-Payments for{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-400 to-amber-300">
            Autonomous AI Agents
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          AI Agents generate high-frequency micro-tasks that traditional blockchains are too slow and expensive to settle.
          Harnessing Avalanche's <span className="text-slate-200 font-semibold">&lt;1s finality</span> and near-zero fees,
          AvaxAgent enables seamless machine-to-machine streaming escrow and instant settlements.
        </p>

        {/* Highlight badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>Finality</span>
            </div>
            <div className="text-xl font-bold font-mono text-white">&lt; 800 ms</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Avg Fee</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">&lt; $0.001</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400 mb-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Agent Protocol</span>
            </div>
            <div className="text-xl font-bold font-mono text-white">x402 Ready</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400 mb-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Architecture</span>
            </div>
            <div className="text-xl font-bold font-mono text-white">Fuji C-Chain</div>
          </div>
        </div>
      </div>
    </div>
  )
}

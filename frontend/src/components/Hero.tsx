import React from 'react'
import { Sparkles, Shield, Cpu, Activity, Clock } from 'lucide-react'

export const Hero: React.FC = () => {
  return (
    <div className="relative pt-6 pb-6 overflow-hidden">
      <div className="max-w-6xl mx-auto text-center px-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Avalanche Builder Day 2026 Shenzhen</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3 leading-tight">
          Protect Your Wallet.{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-400 to-amber-300">
            Empower Your Agents.
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-3xl mx-auto mb-6 leading-relaxed">
          <span className="text-slate-200 font-semibold">Give AI agents money — without giving them your wallet.</span>{' '}
          AvaxGuard is the on-chain financial policy engine that enforces hard mathematical boundaries on autonomous spending.
        </p>

        {/* 4 Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 mb-0.5">
              <Shield className="w-3 h-3 text-red-400" />
              <span>Security Model</span>
            </div>
            <div className="text-xs font-bold font-mono text-white">No Owner Key Exposure</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 mb-0.5">
              <Clock className="w-3 h-3 text-rose-400" />
              <span>Avalanche Finality</span>
            </div>
            <div className="text-xs font-bold font-mono text-emerald-400">~1s Irreversible</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 mb-0.5">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>Policy Engine</span>
            </div>
            <div className="text-xs font-bold font-mono text-white">7-Bit Deterministic Trace</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 mb-0.5">
              <Activity className="w-3 h-3 text-amber-400" />
              <span>Execution Rail</span>
            </div>
            <div className="text-xs font-bold font-mono text-white">Fuji C-Chain Native</div>
          </div>
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export const Hero: React.FC = () => {
  return (
    <div className="relative pt-1 pb-1 text-center font-sans">
      <div className="max-w-5xl mx-auto px-4">
        {/* Brand Tag */}
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[11px] font-bold mb-2">
          <span>AvaFence</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300 font-medium">Financial Boundaries for Autonomous AI Agents</span>
        </div>

        {/* Punchy Headline */}
        <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-black tracking-tight text-white leading-tight">
          给 AI Agent 钱，<span className="text-red-500">但不给它你的钱包。</span>
        </h1>

        {/* Application-Oriented Subtitle */}
        <p className="text-slate-200 text-xs sm:text-sm max-w-3xl mx-auto mt-1.5 leading-normal">
          让 AI Agent 自主购买数据、API 和算力，同时把每一笔支出限制在人类设定的资金边界内。
        </p>

        {/* English Secondary */}
        <div className="text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5">
          Give AI agents spending autonomy — within programmable financial boundaries.
        </div>

        {/* Brand Philosophy Sentence */}
        <div className="text-[11px] text-slate-400/90 font-mono mt-1 hidden sm:block">
          Wallets control who can sign. <span className="text-white font-semibold">AvaFence controls what an AI agent is allowed to spend on.</span>
        </div>

        {/* Streamlined Single-Line Architecture Flow */}
        <div className="mt-2.5 py-1.5 px-4 bg-slate-900/90 border border-slate-800 rounded-xl max-w-3xl mx-auto shadow-md">
          <div className="flex items-center justify-between overflow-x-auto text-[11px] font-mono text-slate-300 gap-1 sm:gap-2">
            <span className="font-semibold text-slate-200 whitespace-nowrap">HUMAN RULES</span>
            <ArrowRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="font-semibold text-slate-200 whitespace-nowrap">AGENT TASK</span>
            <ArrowRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="font-semibold text-slate-200 whitespace-nowrap">SPEND INTENT</span>
            <ArrowRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="font-bold text-red-400 flex items-center space-x-1 whitespace-nowrap bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
              <ShieldCheck className="w-3 h-3" />
              <span>AVAFENCE</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="font-bold text-emerald-400 whitespace-nowrap">AVALANCHE SETTLE</span>
          </div>
        </div>
      </div>
    </div>
  )
}

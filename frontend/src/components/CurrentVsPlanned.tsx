import React from 'react'
import { CheckCircle2, Sparkles, Layers, ShieldCheck, Cpu } from 'lucide-react'
import { siteConfig } from '../config/site.config'

export const CurrentVsPlanned: React.FC = () => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl mb-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-red-500" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              CURRENT CAPABILITIES VS PLANNED ROADMAP
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict separation between working on-chain prototype and upcoming developer tools.
          </p>
        </div>
        <span className="text-[10px] font-mono text-slate-500 self-start sm:self-auto">
          Auditability Standard
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CURRENT COLUMN */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs text-white">CURRENT (AVAILABLE NOW)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Live On Fuji
            </span>
          </div>

          <div className="space-y-2.5">
            {siteConfig.capabilities.current.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-2.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">
                    {item.title} <span className="text-slate-400 font-normal">· {item.titleZh}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PLANNED COLUMN */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-xs text-white">PLANNED (COMING NEXT / CONCEPT)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              In Design
            </span>
          </div>

          <div className="space-y-2.5">
            {siteConfig.capabilities.planned.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-2.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      {item.title} <span className="text-slate-400 font-normal">· {item.titleZh}</span>
                    </span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

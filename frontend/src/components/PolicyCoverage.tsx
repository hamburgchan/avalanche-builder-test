import React from 'react'
import { ShieldCheck, CheckCircle2, Bot, Info, Lock } from 'lucide-react'
import { useTranslation } from '../i18n'

export const PolicyCoverage: React.FC = () => {
  const { t } = useTranslation()
  const { policyCoverage } = t

  return (
    <div id="policy-coverage" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl mb-6 font-sans space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-red-500" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              {policyCoverage.heading}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {policyCoverage.subheading}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{policyCoverage.verifiedBadge}</span>
        </span>
      </div>

      {/* Explanatory Note Callout */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start space-x-2.5 text-xs text-slate-300">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {policyCoverage.noteText}
        </p>
      </div>

      {/* Main Grid: 7 Verified Capabilities (Left) + 4 Example Use Cases (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: 7 Verified Real Capabilities (7 cols) */}
        <div className="lg:col-span-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                {policyCoverage.capabilitiesHeading}
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              7/7 Active
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {policyCoverage.capabilities.map((cap, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60 flex items-start space-x-2.5 text-xs transition hover:border-slate-700"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200 text-xs">
                    {cap.name}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-snug">
                    {cap.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Example Use Cases (6 cols) */}
        <div className="lg:col-span-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                {policyCoverage.useCasesHeading}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {policyCoverage.useCasesBadge}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-snug">
            {policyCoverage.useCasesDisclaimer}
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {policyCoverage.useCases.map((useCase, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/60 space-y-1.5 transition hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-xs text-white flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span>{useCase.title}</span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-cyan-300 bg-cyan-950/50 px-2 py-1 rounded border border-cyan-800/40">
                  <span className="text-slate-400 mr-1">Primitives:</span>
                  {useCase.primitives}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

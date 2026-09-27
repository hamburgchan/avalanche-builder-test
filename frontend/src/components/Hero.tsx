import React from 'react'
import { ArrowRight, Play, Layers } from 'lucide-react'
import { siteConfig } from '../config/site.config'

interface HeroProps {
  onTryInstantDemo: () => void
  onRunLiveOnFuji: () => void
  onHowItWorks: () => void
}

export const Hero: React.FC<HeroProps> = ({
  onTryInstantDemo,
  onRunLiveOnFuji,
  onHowItWorks
}) => {
  return (
    <div className="relative pt-6 pb-6 text-center font-sans">
      <div className="max-w-4xl mx-auto px-4">
        {/* Network & Verification Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span>{siteConfig.networkBadges.fujiDemo}</span>
          </span>
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
            <span>{siteConfig.networkBadges.mainnetStatus}</span>
          </span>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
          AvaFence
        </h1>

        {/* Brand Positioning */}
        <div className="text-lg sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-red-500 mt-2">
          {siteConfig.brandPositioning}
        </div>

        {/* Subtitle */}
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mt-2.5 leading-relaxed">
          {siteConfig.subtitle}
        </p>

        {/* Core Concept One-Liner */}
        <div className="mt-2 text-xs sm:text-sm font-mono text-slate-400 max-w-xl mx-auto">
          “Agent can request a payment. AvaFence independently decides whether the payment is allowed.”
        </div>

        {/* Action CTAs */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {/* Primary 1-Click Instant Demo */}
          <button
            type="button"
            onClick={onTryInstantDemo}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-600/30 transition transform active:scale-95 flex items-center space-x-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>⚡ Try Instant Demo (Zero Setup)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Secondary Live On-Chain CTA */}
          <button
            type="button"
            onClick={onRunLiveOnFuji}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 shadow-md transition flex items-center space-x-2 cursor-pointer"
          >
            <span>⛓️ Run Live on Avalanche Fuji</span>
          </button>

          {/* Tertiary How It Works CTA */}
          <button
            type="button"
            onClick={onHowItWorks}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white bg-transparent hover:bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>How It Works</span>
          </button>
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import {
  Wallet,
  Globe,
  Droplets,
  Shield,
  Fuel,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { useTranslation } from '../i18n'

export interface DemoSetupProgressProps {
  account: string | null
  chainId: number | null
  balance: string
  policyActive: boolean
  agentGasBalance: string
  isExecuting: boolean
  onConnectWallet: () => void
  onSwitchToFuji: () => void
  onOpenFaucet: () => void
  onCreatePolicy: () => void
  onFundAgent: () => void
  onPrepareDemo: () => void
  isPreparingDemo: boolean
}

export const DemoSetupProgress: React.FC<DemoSetupProgressProps> = ({
  account,
  chainId,
  balance,
  policyActive,
  agentGasBalance,
  isExecuting,
  onConnectWallet,
  onSwitchToFuji,
  onOpenFaucet,
  onCreatePolicy,
  onFundAgent,
  onPrepareDemo,
  isPreparingDemo
}) => {
  const { t } = useTranslation()
  const isWalletConnected = !!account
  const isFujiNetwork = chainId === 43113
  const hasUserBalance = parseFloat(balance || '0') >= 0.01
  const isPolicyReady = policyActive
  const isAgentFunded = parseFloat(agentGasBalance || '0') >= 0.002
  const isReadyToRun =
    isWalletConnected &&
    isFujiNetwork &&
    hasUserBalance &&
    isPolicyReady &&
    isAgentFunded

  const stepIcons = [Wallet, Globe, Droplets, Shield, Fuel, Play]
  const stepActions = [
    onConnectWallet,
    onSwitchToFuji,
    onOpenFaucet,
    onCreatePolicy,
    onFundAgent,
    () => {}
  ]
  const stepReadiness = [
    isWalletConnected,
    isFujiNetwork,
    hasUserBalance,
    isPolicyReady,
    isAgentFunded,
    isReadyToRun
  ]

  const steps = t.guidedSetup.steps.map((s, idx) => ({
    ...s,
    ready: stepReadiness[idx],
    onClick: stepActions[idx],
    icon: stepIcons[idx]
  }))

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl mb-4 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
              {t.guidedSetup.title}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                isReadyToRun
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {isReadyToRun ? t.guidedSetup.readyBadge : t.guidedSetup.progressBadge}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.guidedSetup.sub}
          </p>
        </div>

        {/* Guided Demo Setup Button */}
        {!isReadyToRun && (
          <button
            type="button"
            onClick={onPrepareDemo}
            disabled={isPreparingDemo || isExecuting}
            className="self-start lg:self-auto px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-600/25 transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isPreparingDemo ? t.guidedSetup.preparingBtn : t.guidedSetup.actionBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 6 Step Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {steps.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.num}
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition ${
                s.ready
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center text-slate-300">
                  {s.num}
                </span>
                <span
                  className={`inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    s.ready
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/15 text-amber-300'
                  }`}
                >
                  {s.ready ? (
                    <>
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>{t.guidedSetup.stepReady}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-2.5 h-2.5" />
                      <span>{t.guidedSetup.stepPending}</span>
                    </>
                  )}
                </span>
              </div>

              <div>
                <div className="font-semibold text-xs text-white truncate flex items-center space-x-1">
                  <Icon className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{s.name}</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80">
                {s.ready ? (
                  <div className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{t.guidedSetup.stepConfigured}</span>
                  </div>
                ) : s.num === 6 ? (
                  <div className="text-[10px] font-mono text-slate-500">
                    {t.guidedSetup.stepAwaiting}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={s.onClick}
                    className="w-full py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-[10px] font-mono font-semibold transition cursor-pointer"
                  >
                    {s.actionText}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


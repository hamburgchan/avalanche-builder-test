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

  const steps = [
    {
      num: 1,
      name: 'Connect Wallet',
      nameZh: '连接钱包',
      ready: isWalletConnected,
      actionText: 'Connect',
      onClick: onConnectWallet,
      icon: Wallet
    },
    {
      num: 2,
      name: 'Switch to Fuji',
      nameZh: '切换至 Fuji',
      ready: isFujiNetwork,
      actionText: 'Switch',
      onClick: onSwitchToFuji,
      icon: Globe
    },
    {
      num: 3,
      name: 'Get Test AVAX',
      nameZh: '领取测试币',
      ready: hasUserBalance,
      actionText: 'Faucet',
      onClick: onOpenFaucet,
      icon: Droplets
    },
    {
      num: 4,
      name: 'Create Demo Policy',
      nameZh: '创建演示策略',
      ready: isPolicyReady,
      actionText: 'Create',
      onClick: onCreatePolicy,
      icon: Shield
    },
    {
      num: 5,
      name: 'Fund Agent Gas',
      nameZh: '注入 Agent Gas',
      ready: isAgentFunded,
      actionText: 'Fund (0.005)',
      onClick: onFundAgent,
      icon: Fuel
    },
    {
      num: 6,
      name: 'Run Scenario',
      nameZh: '运行演示场景',
      ready: isReadyToRun,
      actionText: 'Ready',
      onClick: () => {},
      icon: Play
    }
  ]

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl mb-4 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
              Guided Demo Setup (Fuji Live)
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                isReadyToRun
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {isReadyToRun ? '100% READY' : 'SETUP IN PROGRESS'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Follow the 6 steps below to configure your interactive Fuji environment. No private keys are extracted.
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
            <span>{isPreparingDemo ? 'Preparing Step...' : 'Guided Demo Setup (一键引导就绪)'}</span>
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
                      <span>Ready</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-2.5 h-2.5" />
                      <span>Pending</span>
                    </>
                  )}
                </span>
              </div>

              <div>
                <div className="font-semibold text-xs text-white truncate flex items-center space-x-1">
                  <Icon className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{s.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{s.nameZh}</div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80">
                {s.ready ? (
                  <div className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Configured</span>
                  </div>
                ) : s.num === 6 ? (
                  <div className="text-[10px] font-mono text-slate-500">
                    Awaiting 1-5
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

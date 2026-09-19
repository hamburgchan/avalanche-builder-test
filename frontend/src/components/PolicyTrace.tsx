import React, { useState, useEffect, useMemo } from 'react'
import { CheckCircle2, XCircle, ShieldAlert, ShieldCheck, Loader2, Minus } from 'lucide-react'
import { BlockReason, BLOCK_REASON_TEXT } from '../config/avalanche'

interface PolicyTraceProps {
  isEvaluating: boolean
  checksPassed: number | null
  verdict: BlockReason | null
  agentAuthorized: boolean
  sceneType?: 'A' | 'B' | 'C' | null
}

interface StepItem {
  id: number
  label: string
  sublabel: string
}

const ORDERED_STEPS: StepItem[] = [
  { id: 0, label: '0. Scoped Agent Authorized', sublabel: '代理身份与 Owner 绑定验证' },
  { id: 1, label: '1. Policy Active', sublabel: '策略激活与未被 Owner 撤销' },
  { id: 2, label: '2. Not Expired', sublabel: '在策略设定的有效时间窗口内' },
  { id: 3, label: '3. Request Fresh', sublabel: '防重放保护：RequestId 未被执行' },
  { id: 4, label: '4. Merchant Allowlist', sublabel: '收款方属于已授权白名单商户' },
  { id: 5, label: '5. Max / Tx Check', sublabel: '单笔支付未超 0.003 AVAX 硬顶' },
  { id: 6, label: '6. Daily Limit Check', sublabel: '当日累计支出未超日度预算上限' },
  { id: 7, label: '7. Budget Available', sublabel: '策略池剩余可用总预算充足' }
]

export const PolicyTrace: React.FC<PolicyTraceProps> = ({
  isEvaluating,
  checksPassed,
  verdict,
  agentAuthorized,
  sceneType
}) => {
  const hasVerdict = verdict !== null

  // Progressive animation step (0 to 7)
  const [animatedStep, setAnimatedStep] = useState<number>(7)

  useEffect(() => {
    if (isEvaluating) {
      setAnimatedStep(0)
      const interval = setInterval(() => {
        setAnimatedStep((prev) => {
          if (prev >= 7) {
            clearInterval(interval)
            return 7
          }
          return prev + 1
        })
      }, 140)
      return () => clearInterval(interval)
    } else if (checksPassed !== null) {
      setAnimatedStep(7)
    }
  }, [isEvaluating, checksPassed])

  // Identify first failing step for short-circuiting / skipped display
  const firstFailIndex = useMemo(() => {
    if (checksPassed === null) return -1
    if (!agentAuthorized) return 0

    for (let bit = 0; bit < 7; bit++) {
      if ((checksPassed & (1 << bit)) === 0) {
        return bit + 1
      }
    }
    return -1
  }, [checksPassed, agentAuthorized])

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 font-mono shadow-xl flex flex-col space-y-3">
      {/* Header with Subdued Bitmask */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
        <span className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isEvaluating ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
          <span className="font-bold text-slate-200 text-sm font-sans">
            链上策略判定 (Policy Decision Trace)
          </span>
        </span>
        <span className="text-[11px] text-slate-500 font-mono">
          Bitmask: <span className="text-slate-400 font-semibold">{checksPassed !== null ? `0b${checksPassed.toString(2).padStart(7, '0')}` : '0b-------'}</span>
        </span>
      </div>

      {/* Dynamic 8-Step Evaluation Sequence */}
      <div className="space-y-1.5">
        {ORDERED_STEPS.map((step) => {
          const stepIndex = step.id
          const isCurrentEvaluating = isEvaluating && animatedStep === stepIndex
          const isPassed =
            checksPassed !== null
              ? stepIndex === 0
                ? agentAuthorized
                : (checksPassed & (1 << (stepIndex - 1))) !== 0
              : null

          const isSkipped =
            firstFailIndex !== -1 &&
            stepIndex > firstFailIndex &&
            (animatedStep > firstFailIndex || !isEvaluating)

          const isFailed = firstFailIndex === stepIndex && (animatedStep >= stepIndex || !isEvaluating)
          const isRevealed = (animatedStep > stepIndex || (!isEvaluating && checksPassed !== null)) && !isSkipped

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between py-2 px-3 rounded-lg border transition-all text-xs sm:text-sm ${
                isCurrentEvaluating
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-200 ring-1 ring-amber-500/30'
                  : isFailed
                  ? 'bg-rose-950/50 border-rose-500/70 text-rose-200 ring-1 ring-rose-500/40'
                  : isSkipped
                  ? 'bg-slate-950/30 border-slate-800/40 text-slate-600 opacity-60'
                  : isRevealed && isPassed
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-slate-900/40 border-slate-800/50 text-slate-400'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <span className="font-semibold text-white truncate">{step.label}</span>
                <span className="hidden md:inline text-[11px] text-slate-400 truncate">
                  ({step.sublabel})
                </span>
              </div>

              {/* Status Indicator */}
              <div className="shrink-0 font-bold text-xs">
                {isCurrentEvaluating ? (
                  <span className="flex items-center space-x-1 text-amber-400 animate-pulse font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking...</span>
                  </span>
                ) : isFailed ? (
                  <span className="flex items-center space-x-1 text-rose-400 font-mono">
                    <XCircle className="w-4 h-4" />
                    <span>✕ VIOLATION</span>
                  </span>
                ) : isSkipped ? (
                  <span className="flex items-center space-x-1 text-slate-500 font-mono">
                    <Minus className="w-3.5 h-3.5" />
                    <span>— Skipped</span>
                  </span>
                ) : isRevealed && isPassed ? (
                  <span className="flex items-center space-x-1 text-emerald-400 font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✓ PASS</span>
                  </span>
                ) : (
                  <span className="text-slate-600 font-mono">--</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Evaluating Status Banner */}
      {isEvaluating && (
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center text-amber-300 text-xs font-mono flex items-center justify-center space-x-2 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>正在 Avalanche Fuji 链上逐项评估安全策略硬顶...</span>
        </div>
      )}

      {/* Final Verdict: High-Impact Prominent Conclusion */}
      {hasVerdict && !isEvaluating && (
        <div className="pt-2">
          {verdict === BlockReason.NONE ? (
            /* APPROVED */
            <div className="w-full py-4 px-4 rounded-2xl bg-gradient-to-b from-emerald-950/60 to-slate-950 border-2 border-emerald-500/80 shadow-2xl shadow-emerald-500/20 text-center space-y-1.5">
              <div className="flex items-center justify-center space-x-2 text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-400 tracking-tight">
                <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
                <span>APPROVED / SETTLED</span>
              </div>
              <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                <span>Reason:</span>
                <span className="text-white font-extrabold">APPROVED (全策略通过)</span>
              </div>
              <div className="text-xs text-slate-300 font-sans">
                全部 7 项链上策略检查通过 · 已在 Avalanche Fuji 最终结算
              </div>
            </div>
          ) : sceneType === 'C' ? (
            /* SCENE C: MALICIOUS SPEND BLOCKED */
            <div className="w-full py-4 px-4 rounded-2xl bg-gradient-to-b from-rose-950/70 to-slate-950 border-2 border-rose-500 shadow-2xl shadow-rose-500/30 text-center space-y-1.5">
              <div className="flex items-center justify-center space-x-2 text-2xl sm:text-3xl lg:text-4xl font-black text-rose-500 tracking-tight">
                <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500" />
                <span>🛡 MALICIOUS SPEND BLOCKED</span>
              </div>
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-rose-950 border border-rose-500/60 text-rose-300 font-mono text-xs font-extrabold">
                <span>Reason:</span>
                <span className="text-white font-mono">{BLOCK_REASON_TEXT[verdict]?.label || 'MERCHANT_NOT_ALLOWED'}</span>
              </div>
              <div className="text-xs text-rose-200/90 font-mono flex items-center justify-center space-x-3 pt-0.5">
                <span>非授权资金外流: <strong className="text-emerald-400 font-extrabold text-sm">0 AVAX</strong></span>
                <span>·</span>
                <span>智能合约阻断攻击</span>
              </div>
            </div>
          ) : (
            /* SCENE B: BLOCKED OVER-LIMIT */
            <div className="w-full py-4 px-4 rounded-2xl bg-gradient-to-b from-amber-950/60 to-slate-950 border-2 border-amber-500 shadow-2xl shadow-amber-500/25 text-center space-y-1.5">
              <div className="flex items-center justify-center space-x-2 text-2xl sm:text-3xl lg:text-4xl font-black text-amber-400 tracking-tight">
                <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
                <span>🛡 BLOCKED</span>
              </div>
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-950 border border-amber-500/60 text-amber-300 font-mono text-xs font-extrabold">
                <span>Reason:</span>
                <span className="text-white font-mono">{BLOCK_REASON_TEXT[verdict]?.label || 'PER_TX_LIMIT_EXCEEDED'}</span>
              </div>
              <div className="text-xs text-slate-300 font-sans">
                请求金额超出单笔最大硬顶限额 (Max / Tx) · 链上强制阻断
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

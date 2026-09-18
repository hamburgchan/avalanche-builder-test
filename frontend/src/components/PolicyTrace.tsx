import React from 'react'
import { CheckCircle2, XCircle, ShieldAlert, ShieldCheck } from 'lucide-react'
import { TRACE_BITS, parseChecksPassed, BlockReason, BLOCK_REASON_TEXT } from '../config/avalanche'

interface PolicyTraceProps {
  isEvaluating: boolean
  checksPassed: number | null
  verdict: BlockReason | null
  agentAuthorized: boolean
}

export const PolicyTrace: React.FC<PolicyTraceProps> = ({
  isEvaluating,
  checksPassed,
  verdict,
  agentAuthorized
}) => {
  const parsedBits = checksPassed !== null ? parseChecksPassed(checksPassed) : {}
  const hasVerdict = verdict !== null

  return (
    <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 font-mono text-xs shadow-inner">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-300">Policy Decision Trace (On-Chain Evaluation)</span>
        </span>
        <span className="text-[10px] text-slate-400">Bitmask: {checksPassed !== null ? `0b${checksPassed.toString(2).padStart(7, '0')}` : '---'}</span>
      </div>

      <div className="space-y-1.5">
        {/* Step 0: Agent Binding Authorization */}
        <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-900/60 border border-slate-800/40">
          <span className="text-slate-300">0. Agent Authorized</span>
          {agentAuthorized ? (
            <span className="flex items-center space-x-1 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>BOUND</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-slate-400 font-bold">
              <XCircle className="w-3.5 h-3.5" />
              <span>UNBOUND</span>
            </span>
          )}
        </div>

        {/* 7 Policy Checks derived directly from On-Chain checksPassed bitmask */}
        {TRACE_BITS.map((item) => {
          const isPassed = checksPassed !== null ? !!parsedBits[item.key] : null
          return (
            <div
              key={item.key}
              className={`flex items-center justify-between py-1 px-2 rounded border transition-colors ${
                isPassed === true
                  ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                  : isPassed === false
                  ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                  : 'bg-slate-900/30 border-slate-800/30 text-slate-400'
              }`}
            >
              <span>{item.label}</span>
              {isPassed === true && (
                <span className="flex items-center space-x-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PASS</span>
                </span>
              )}
              {isPassed === false && (
                <span className="flex items-center space-x-1 text-rose-400 font-bold">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>VIOLATION</span>
                </span>
              )}
              {isPassed === null && <span className="text-slate-400">---</span>}
            </div>
          )
        })}
      </div>

      {/* Verdict Footer */}
      {hasVerdict && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] uppercase text-slate-400 font-bold">Final Verdict:</span>
          {verdict === BlockReason.NONE ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>APPROVED & SETTLED</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>BLOCKED: {BLOCK_REASON_TEXT[verdict]?.label || 'POLICY_VIOLATION'}</span>
            </div>
          )}
        </div>
      )}
      {isEvaluating && (
        <div className="mt-2 text-center text-amber-400 animate-pulse text-[11px]">
          [Evaluating Policy on Avalanche C-Chain...]
        </div>
      )}
    </div>
  )
}

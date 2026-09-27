import React from 'react'
import {
  Send,
  FileText,
  Hash,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert
} from 'lucide-react'
import type { DemoSpendIntent } from '../types/demo'

export type SpendIntent = DemoSpendIntent

interface SpendIntentCardProps {
  intent: DemoSpendIntent | null
}

export const SpendIntentCard: React.FC<SpendIntentCardProps> = ({ intent }) => {
  if (!intent) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center text-xs text-slate-500 font-mono py-6">
        Waiting to select a scenario to generate Agent Payment Intent...
      </div>
    )
  }

  const isSceneB = intent.sceneType === 'B'
  const isSceneC = intent.sceneType === 'C'

  return (
    <div
      className={`p-4 rounded-xl border transition-all shadow-xl font-mono text-xs ${
        isSceneB
          ? 'border-rose-500/60 bg-gradient-to-b from-slate-900 via-rose-950/20 to-slate-950 ring-1 ring-rose-500/30'
          : isSceneC
          ? 'border-amber-500/50 bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-950 ring-1 ring-amber-500/20'
          : 'border-emerald-500/40 bg-gradient-to-b from-slate-900 via-emerald-950/20 to-slate-950 ring-1 ring-emerald-500/20'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2 text-white font-bold">
          <Send className="w-4 h-4 text-red-500" />
          <span className="text-sm font-sans tracking-tight">AGENT PAYMENT INTENT</span>
        </div>
        <div className="flex items-center space-x-1.5">
          {isSceneB ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Scenario B · UNAUTHORIZED RECIPIENT</span>
            </span>
          ) : isSceneC ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
              Scenario C · PER-TX OVERSPEND
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              Scenario A · NORMAL PURCHASE
            </span>
          )}
        </div>
      </div>

      {/* Hero Focus: Requested Amount */}
      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-sans font-semibold">
            Requested Amount (申请金额)
          </div>
          <div
            className={`text-3xl sm:text-4xl font-black mt-0.5 tracking-tight ${
              isSceneB
                ? 'text-white'
                : isSceneC
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {intent.amount} <span className="text-lg font-bold text-slate-400">AVAX</span>
          </div>
        </div>

        <div className="text-right">
          {isSceneB ? (
            <div className="text-xs text-rose-400 font-bold flex items-center justify-end space-x-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>✕ Unauthorized Recipient</span>
            </div>
          ) : isSceneC ? (
            <div className="text-xs text-amber-400 font-bold flex items-center justify-end space-x-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>✕ Exceeds Limit (&gt; 0.003 AVAX)</span>
            </div>
          ) : (
            <div className="text-xs text-emerald-400 font-bold flex items-center justify-end space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓ Within Limit (≤ 0.003 AVAX)</span>
            </div>
          )}
          <div className="text-[11px] text-slate-500 mt-1">AvaFence Policy Pre-evaluation</div>
        </div>
      </div>

      {/* Scenario B Explanatory Banner */}
      {isSceneB && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center space-x-2 text-rose-300 text-xs">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <div className="leading-tight">
            <strong>Policy Boundary Trigger:</strong> Amount <span className="text-emerald-400 font-bold">0.001 AVAX</span> is within budget, but the recipient address is not in the allowlist. {intent.secondaryExplanation}
          </div>
        </div>
      )}

      {/* Scenario C Explanatory Banner */}
      {isSceneC && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-center space-x-2 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="leading-tight">
            <strong>Policy Boundary Trigger:</strong> Requested amount <span className="text-amber-400 font-bold">0.010 AVAX</span> exceeds the active policy hard ceiling of <span className="text-white font-bold">0.003 AVAX</span> per transaction.
          </div>
        </div>
      )}

      {/* Target Resource and Recipient Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Target Service / Resource */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 flex items-center space-x-1 font-sans mb-1">
            <FileText className="w-3 h-3 text-slate-400" />
            <span>Target Resource (目标资源)</span>
          </div>
          <div className="text-slate-200 font-semibold text-xs truncate">
            {intent.serviceName}
          </div>
        </div>

        {/* Recipient */}
        <div
          className={`p-2.5 rounded-lg border ${
            isSceneB
              ? 'bg-rose-950/40 border-rose-500/60'
              : 'bg-slate-950/60 border border-slate-800/80'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider text-slate-400 flex items-center justify-between font-sans mb-1">
            <span>Recipient (收款方)</span>
            {isSceneB ? (
              <span className="text-[10px] font-bold text-rose-400 flex items-center space-x-0.5">
                <XCircle className="w-3 h-3" />
                <span>✕ Not Authorized</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-400">
                ✓ Authorized
              </span>
            )}
          </div>
          <div className={`font-bold text-xs truncate ${isSceneB ? 'text-rose-400' : 'text-slate-200'}`}>
            {intent.recipientAlias}
          </div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
            {intent.recipient}
          </div>
        </div>
      </div>

      {/* Task Description */}
      <div className="mt-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-400 text-[11px]">
        <span className="text-slate-300 font-semibold">Intent Rationale: </span>
        <span>{intent.taskDescription}</span>
      </div>

      {/* Request ID */}
      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-1 text-slate-500">
          <Hash className="w-3 h-3" />
          <span>Request ID:</span>
        </div>
        <div className="font-mono text-slate-300 truncate max-w-[280px]">
          {intent.requestId}
        </div>
      </div>
    </div>
  )
}

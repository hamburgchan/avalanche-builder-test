import React from 'react'
import { Send, FileText, Hash, AlertTriangle, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react'

export interface SpendIntent {
  requestId: string
  serviceName: string
  merchant: string
  merchantAlias: string
  amount: string
  taskDescription: string
  sceneType: 'A' | 'B' | 'C'
}

interface SpendIntentCardProps {
  intent: SpendIntent | null
}

export const SpendIntentCard: React.FC<SpendIntentCardProps> = ({ intent }) => {
  if (!intent) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center text-xs text-slate-500 font-mono py-6">
        等待触发场景以生成 Agent 支出意图 (Spend Intent)...
      </div>
    )
  }

  const isSceneC = intent.sceneType === 'C'
  const isSceneB = intent.sceneType === 'B'

  return (
    <div
      className={`p-4 rounded-xl border transition-all shadow-xl font-mono text-xs ${
        isSceneC
          ? 'border-rose-500/60 bg-gradient-to-b from-slate-900 via-rose-950/20 to-slate-950 ring-1 ring-rose-500/30'
          : isSceneB
          ? 'border-amber-500/50 bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-950 ring-1 ring-amber-500/20'
          : 'border-emerald-500/40 bg-gradient-to-b from-slate-900 via-emerald-950/20 to-slate-950 ring-1 ring-emerald-500/20'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2 text-white font-bold">
          <Send className="w-4 h-4 text-red-500" />
          <span className="text-sm font-sans tracking-tight">AGENT SPEND INTENT (支出意图)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          {isSceneC ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Scene C · PROMPT INJECTION</span>
            </span>
          ) : isSceneB ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
              Scene B · OVERSPENDING
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              Scene A · LEGITIMATE
            </span>
          )}
        </div>
      </div>

      {/* Hero Focus: Big Amount (28-36px) */}
      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-sans font-semibold">
            请求支付金额 (Amount)
          </div>
          <div
            className={`text-3xl sm:text-4xl font-black mt-0.5 tracking-tight ${
              isSceneC
                ? 'text-white'
                : isSceneB
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {intent.amount} <span className="text-lg font-bold text-slate-400">AVAX</span>
          </div>
        </div>

        <div className="text-right">
          {isSceneC ? (
            <div className="text-xs text-emerald-400 font-bold flex items-center justify-end space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓ Within limit (单笔金额合规)</span>
            </div>
          ) : isSceneB ? (
            <div className="text-xs text-amber-400 font-bold flex items-center justify-end space-x-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>✕ Exceeds limit (超 0.003 AVAX 硬顶)</span>
            </div>
          ) : (
            <div className="text-xs text-emerald-400 font-bold flex items-center justify-end space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓ Compliant (完全合规)</span>
            </div>
          )}
          <div className="text-[11px] text-slate-500 mt-1">AvaxGuard 链上拦截预检</div>
        </div>
      </div>

      {/* Scene C Dramatic Contrast Banner */}
      {isSceneC && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center space-x-2 text-rose-300 text-xs">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <div className="leading-tight">
            <strong>注入攻击对照：</strong>金额 <span className="text-emerald-400 font-bold">0.001 AVAX</span> 在预算内，但收款方属于攻击者地址，将被链上<strong>商户白名单</strong>规则强制拦截！
          </div>
        </div>
      )}

      {/* Service and Merchant Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Service */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 flex items-center space-x-1 font-sans mb-1">
            <FileText className="w-3 h-3 text-slate-400" />
            <span>Target Service (目标服务)</span>
          </div>
          <div className="text-slate-200 font-semibold text-xs truncate">
            {intent.serviceName}
          </div>
        </div>

        {/* Merchant */}
        <div
          className={`p-2.5 rounded-lg border ${
            isSceneC
              ? 'bg-rose-950/40 border-rose-500/60'
              : 'bg-slate-950/60 border border-slate-800/80'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider text-slate-400 flex items-center justify-between font-sans mb-1">
            <span>Target Merchant (收款商户)</span>
            {isSceneC ? (
              <span className="text-[10px] font-bold text-rose-400 flex items-center space-x-0.5">
                <XCircle className="w-3 h-3" />
                <span>✕ Not in allowlist</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-400">
                ✓ Whitelisted
              </span>
            )}
          </div>
          <div className={`font-bold text-xs truncate ${isSceneC ? 'text-rose-400' : 'text-slate-200'}`}>
            {isSceneC ? 'Simulated Attacker (未授权攻击者)' : intent.merchantAlias}
          </div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
            {intent.merchant}
          </div>
        </div>
      </div>

      {/* Deterministic Request ID */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
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

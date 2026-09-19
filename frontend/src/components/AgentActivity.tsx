import React, { useState } from 'react'
import { Bot, Play, Terminal, Database } from 'lucide-react'
import type { SpendIntent } from './SpendIntentCard'
import { SpendIntentCard } from './SpendIntentCard'
import { PolicyTrace } from './PolicyTrace'
import type { BlockReason } from '../config/avalanche'
import { DEMO_ADDRESSES } from '../config/avalanche'
import type { FulfillmentResult } from '../services/merchant'

interface AgentActivityProps {
  isExecuting: boolean
  currentIntent: SpendIntent | null
  executionLogs: string[]
  checksPassed: number | null
  verdict: BlockReason | null
  agentAuthorized: boolean
  merchantResult: FulfillmentResult | null
  onTriggerScene: (scene: 'A' | 'B' | 'C') => Promise<void>
}

const PROSPECTIVE_INTENTS: Record<'A' | 'B' | 'C', SpendIntent> = {
  A: {
    requestId: '0x3a89e1... (待提交 Fuji 链上签名)',
    serviceName: 'Avalanche 实时高频订单薄深度 API (L2 Orderbook)',
    merchant: DEMO_ADDRESSES.MERCHANT,
    merchantAlias: `已授权白名单商户 (${DEMO_ADDRESSES.MERCHANT.slice(0, 6)}...${DEMO_ADDRESSES.MERCHANT.slice(-4)})`,
    amount: '0.002',
    taskDescription: '获取 AVAX 实时订单薄流动性深度与链上支撑位数据。',
    sceneType: 'A'
  },
  B: {
    requestId: '0x9f182c... (待提交 Fuji 链上签名)',
    serviceName: '机构级高频深度分析数据集 (独家专享)',
    merchant: DEMO_ADDRESSES.MERCHANT,
    merchantAlias: `已授权白名单商户 (${DEMO_ADDRESSES.MERCHANT.slice(0, 6)}...${DEMO_ADDRESSES.MERCHANT.slice(-4)})`,
    amount: '0.010',
    taskDescription: '尝试高额采购深度情报数据，触发单笔最大额度 (Max / Tx) 链上硬拦截。',
    sceneType: 'B'
  },
  C: {
    requestId: '0xce7740... (待提交 Fuji 链上签名)',
    serviceName: 'Prompt Injection 恶意提示词诱导转账',
    merchant: DEMO_ADDRESSES.ATTACKER,
    merchantAlias: `未授权攻击者收款地址 (${DEMO_ADDRESSES.ATTACKER.slice(0, 6)}...${DEMO_ADDRESSES.ATTACKER.slice(-4)})`,
    amount: '0.001',
    taskDescription: '模拟 Agent 受到注入攻击企图将微量资金转移至非白名单恶意地址。',
    sceneType: 'C'
  }
}

export const AgentActivity: React.FC<AgentActivityProps> = ({
  isExecuting,
  currentIntent,
  executionLogs,
  checksPassed,
  verdict,
  agentAuthorized,
  merchantResult,
  onTriggerScene
}) => {
  const [activeScene, setActiveScene] = useState<'A' | 'B' | 'C'>('A')

  // Use real intent if it matches active scene, otherwise use prospective scene intent
  const displayedIntent =
    currentIntent && currentIntent.sceneType === activeScene
      ? currentIntent
      : PROSPECTIVE_INTENTS[activeScene]

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-red-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Agent 自主操作流 (Agent Autonomous Stream)
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">Autonomous Intent Engine</span>
      </div>

      {/* 1. Scene Selector (Distinct Demo Tabs) */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
          选择自主演示场景 (Select Demo Scenario):
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Tab A */}
          <button
            type="button"
            onClick={() => setActiveScene('A')}
            className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
              activeScene === 'A'
                ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-950/70 ring-2 ring-emerald-500/60'
                : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Scene A · 合规采购</span>
              <span className="text-[10px] font-mono font-extrabold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                0.002 AVAX
              </span>
            </div>
            <div className="inline-flex items-center space-x-1 text-[9px] font-mono font-extrabold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 w-fit">
              <span>● EXPECTED: APPROVED</span>
            </div>
            <div className="text-[10px] text-slate-300 leading-tight">
              LLM 正常请求合规天气数据 API
            </div>
          </button>

          {/* Tab B */}
          <button
            type="button"
            onClick={() => setActiveScene('B')}
            className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
              activeScene === 'B'
                ? 'border-amber-500 bg-amber-950/40 shadow-lg shadow-amber-950/70 ring-2 ring-amber-500/60'
                : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Scene B · 超限拦截</span>
              <span className="text-[10px] font-mono font-extrabold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                0.010 AVAX
              </span>
            </div>
            <div className="inline-flex items-center space-x-1 text-[9px] font-mono font-extrabold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 w-fit">
              <span>▲ EXPECTED: BLOCKED</span>
            </div>
            <div className="text-[10px] text-slate-300 leading-tight">
              超出单笔 0.003 AVAX 硬顶限制
            </div>
          </button>

          {/* Tab C */}
          <button
            type="button"
            onClick={() => setActiveScene('C')}
            className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
              activeScene === 'C'
                ? 'border-rose-500 bg-rose-950/50 shadow-lg shadow-rose-950/80 ring-2 ring-rose-500/70'
                : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Scene C · 注入拦截</span>
              <span className="text-[10px] font-mono font-extrabold text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30">
                0.001 AVAX
              </span>
            </div>
            <div className="inline-flex items-center space-x-1 text-[9px] font-mono font-extrabold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30 w-fit">
              <span>✕ EXPECTED: MALICIOUS BLOCKED</span>
            </div>
            <div className="text-[10px] text-slate-300 leading-tight">
              黑客注入非白名单转账地址
            </div>
          </button>
        </div>
      </div>

      {/* 2. Spend Intent Card */}
      <SpendIntentCard intent={displayedIntent} />

      {/* Action Trigger Button: Positioned cleanly between Intent and Policy Trace */}
      <button
        onClick={() => onTriggerScene(activeScene)}
        disabled={isExecuting}
        className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white transition shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer ${
          activeScene === 'A'
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/50'
            : activeScene === 'B'
            ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 shadow-amber-950/50'
            : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-500 hover:from-rose-500 hover:to-red-500 shadow-red-950/50'
        }`}
      >
        {isExecuting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Agent 正在 Avalanche 链上评估意图并执行...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-white" />
            <span>
              {activeScene === 'A' && '执行 Scene A：合规支付 Demo (Execute Compliant Spend)'}
              {activeScene === 'B' && '执行 Scene B：超额拦截 Demo (Test Over-Limit Block)'}
              {activeScene === 'C' && '执行 Scene C：防注入拦截 Demo (Test Prompt Injection Defense)'}
            </span>
          </>
        )}
      </button>

      {/* 3 & 4. Policy Decision Trace (Contains Final Verdict) */}
      <PolicyTrace
        isEvaluating={isExecuting}
        checksPassed={checksPassed}
        verdict={verdict}
        agentAuthorized={agentAuthorized}
        sceneType={displayedIntent?.sceneType}
      />

      {/* Fulfilled Data Showcase (Scene A only) */}
      {merchantResult?.success && merchantResult.dataset && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 font-mono text-xs space-y-1.5">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs">
            <Database className="w-4 h-4" />
            <span>支付已在链上验证：商户端成功交付付费高价值数据集</span>
          </div>
          <div className="text-slate-200 text-xs">
            标的资产: <span className="text-white font-bold">{merchantResult.dataset.asset}</span>
          </div>
          <div className="text-slate-300 text-[11px]">
            {merchantResult.dataset.sentimentIndicator}
          </div>
          <div className="text-[11px] text-emerald-300 bg-slate-950/90 p-2 rounded border border-emerald-500/20">
            {merchantResult.dataset.institutionalFlows}
          </div>
        </div>
      )}

      {/* 5. Agent Activity Console (Terminal Reasoning Logs) */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col font-mono text-xs max-h-40 overflow-y-auto">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px] text-slate-400">
          <span className="flex items-center space-x-1">
            <Terminal className="w-3 h-3 text-red-400" />
            <span>AGENT_REASONING_CONSOLE (推理日志控制台)</span>
          </span>
          <span>{executionLogs.length} events</span>
        </div>
        <div className="space-y-1 text-[11px] text-slate-300">
          {executionLogs.length === 0 ? (
            <div className="text-slate-600 py-3 text-center">
              Agent 已就绪。选择上方场景后点击按钮，观察链上护栏动态执行。
            </div>
          ) : (
            executionLogs.map((log, i) => (
              <div key={i} className="leading-tight">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { Bot, Play, Terminal, Database } from 'lucide-react'
import type { SpendIntent } from './SpendIntentCard'
import { SpendIntentCard } from './SpendIntentCard'
import { PolicyTrace } from './PolicyTrace'
import type { BlockReason } from '../config/avalanche'
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

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-red-400" />
          <h2 className="text-base font-bold text-white tracking-tight">Agent Autonomous Stream</h2>
        </div>
        <span className="text-xs font-mono text-slate-400">Autonomous Intent Engine</span>
      </div>

      {/* Scenario Selector */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Select Autonomous Demo Scenario:
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveScene('A')}
            className={`p-2.5 rounded-xl text-left border transition text-xs font-mono cursor-pointer ${
              activeScene === 'A'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold">Scene A</div>
            <div className="text-[10px] truncate text-slate-300">Legitimate (0.002)</div>
            <div className="text-[9px] text-emerald-400 mt-0.5">Expect: APPROVED</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveScene('B')}
            className={`p-2.5 rounded-xl text-left border transition text-xs font-mono cursor-pointer ${
              activeScene === 'B'
                ? 'border-rose-500 bg-rose-500/10 text-rose-300'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold">Scene B</div>
            <div className="text-[10px] truncate text-slate-300">Over-Limit (0.010)</div>
            <div className="text-[9px] text-rose-400 mt-0.5">Expect: PER_TX_BLOCKED</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveScene('C')}
            className={`p-2.5 rounded-xl text-left border transition text-xs font-mono cursor-pointer ${
              activeScene === 'C'
                ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold">Scene C</div>
            <div className="text-[10px] truncate text-slate-300">Prompt Injection</div>
            <div className="text-[9px] text-amber-400 mt-0.5">Expect: MERCHANT_BLOCKED</div>
          </button>
        </div>
      </div>

      {/* Trigger Button */}
      <button
        onClick={() => onTriggerScene(activeScene)}
        disabled={isExecuting}
        className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 transition shadow-lg shadow-red-600/30 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
      >
        {isExecuting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Agent Evaluating Intent on Avalanche...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-white" />
            <span>
              {activeScene === 'A' && 'Run Scene A: Form Intent & Settle Legitimate Data'}
              {activeScene === 'B' && 'Run Scene B: Test Over-Limit Hard Ceiling Block'}
              {activeScene === 'C' && 'Run Scene C: Test Prompt Injection Merchant Defense'}
            </span>
          </>
        )}
      </button>

      {/* Spend Intent Spec Card */}
      <SpendIntentCard intent={currentIntent} />

      {/* On-Chain Policy Decision Trace (Real Bitmask) */}
      <PolicyTrace
        isEvaluating={isExecuting}
        checksPassed={checksPassed}
        verdict={verdict}
        agentAuthorized={agentAuthorized}
      />

      {/* Realtime Terminal Log */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col font-mono text-xs max-h-44 overflow-y-auto">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px] text-slate-400">
          <span className="flex items-center space-x-1">
            <Terminal className="w-3 h-3 text-red-400" />
            <span>AGENT_REASONING_CONSOLE</span>
          </span>
          <span>{executionLogs.length} events</span>
        </div>
        <div className="space-y-1 text-[11px] text-slate-300">
          {executionLogs.length === 0 ? (
            <div className="text-slate-600 py-3 text-center">
              Agent ready. Select a scenario above to test on-chain guardrails.
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

      {/* Fulfilled Data Showcase (Scene A only) */}
      {merchantResult?.success && merchantResult.dataset && (
        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 font-mono text-xs space-y-1.5">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px]">
            <Database className="w-3.5 h-3.5" />
            <span>Release Protected Premium Dataset After Payment Verification</span>
          </div>
          <div className="text-slate-200 text-[11px]">
            Asset: <span className="text-white font-bold">{merchantResult.dataset.asset}</span>
          </div>
          <div className="text-slate-300 text-[10px]">
            {merchantResult.dataset.sentimentIndicator}
          </div>
          <div className="text-[10px] text-emerald-300 bg-slate-950/80 p-2 rounded border border-emerald-500/20">
            {merchantResult.dataset.institutionalFlows}
          </div>
        </div>
      )}
    </div>
  )
}

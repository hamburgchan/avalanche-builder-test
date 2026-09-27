import React, { useMemo } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Ban,
  CheckCircle2,
  XCircle,
  Loader2,
  Minus,
  ExternalLink,
  PlusCircle,
  AlertCircle,
  Fuel,
  Info
} from 'lucide-react'
import type { PolicyState } from './PolicyConsole'
import { BlockReason, BLOCK_REASON_TEXT } from '../config/avalanche'
import type { DemoExecution } from '../types/demo'
import { siteConfig } from '../config/site.config'

interface AvaFencePanelProps {
  currentExecution: DemoExecution
  policy: PolicyState | null
  account: string | null
  contractAddress: string
  isContractDeployed: boolean
  isDeployingContract: boolean
  deployError?: string | null
  hasCompromisedPolicy?: boolean
  isRevokingCompromised?: boolean
  agentAddress: string
  agentBalance: string
  isFundingAgent?: boolean
  isCreatingPolicy: boolean
  isRevokingPolicy: boolean
  agentAuthorized: boolean
  onDeployContract: () => Promise<void>
  onBindCustomContract?: (addr: string) => Promise<void>
  onFundAgent?: () => Promise<void>
  onRevokeCompromisedPolicy?: () => Promise<void>
  onCreatePolicy: (budget: string, maxTx: string, daily: string, durationSec: number) => Promise<void>
  onRevokePolicy: () => Promise<void>
  onResetAgent: () => void
  isSimulation?: boolean
}

const ORDERED_CHECKS = [
  { id: 0, label: 'Scoped Agent Authorized', zh: '代理身份授权' },
  { id: 1, label: 'Policy Active', zh: '策略激活状态' },
  { id: 2, label: 'Not Expired', zh: '有效期检查' },
  { id: 3, label: 'Request Fresh', zh: '防重放 Nonce' },
  { id: 4, label: 'Recipient Authorized', zh: '收款方白名单' },
  { id: 5, label: 'Per Tx Limit Check', zh: '单笔限额硬顶' },
  { id: 6, label: 'Daily Limit Check', zh: '单日支出限额' },
  { id: 7, label: 'Budget Available Check', zh: '剩余预算充足' }
]

export const AvaxGuardPanel: React.FC<AvaFencePanelProps> = ({
  currentExecution,
  policy,
  account,
  contractAddress,
  hasCompromisedPolicy,
  isRevokingCompromised,
  agentAddress,
  agentBalance,
  isFundingAgent = false,
  isCreatingPolicy,
  isRevokingPolicy,
  agentAuthorized,
  onFundAgent,
  onRevokeCompromisedPolicy,
  onCreatePolicy,
  onRevokePolicy,
  isSimulation = false
}) => {
  const {
    scenario,
    stage,
    revealStep,
    checksPassed,
    previewVerdict,
    verdict,
    verdictMismatch,
    txHash,
    blockNumber,
    gasUsed,
    acceptanceLatencyMs,
    latencySource,
    networkGasCost,
    spendIntent
  } = currentExecution

  const isEvaluating = stage === 'POLICY_EVALUATING' || stage === 'POLICY_VISUALIZING'
  const isIdle = stage === 'IDLE'

  // Policy preset params
  const budgetInput = '0.02'
  const maxTxInput = '0.003'
  const dailyInput = '0.01'

  const isExpired = policy ? Date.now() / 1000 > policy.expiry : false
  const timeLeftMinutes = policy ? Math.max(0, Math.floor((policy.expiry - Date.now() / 1000) / 60)) : 0
  const agentGasLow = parseFloat(agentBalance || '0') < 0.002

  const firstFailIndex = useMemo(() => {
    if (isIdle || checksPassed === null) return -1
    if (!agentAuthorized) return 0
    for (let bit = 0; bit < 7; bit++) {
      if ((checksPassed & (1 << bit)) === 0) {
        return bit + 1
      }
    }
    return -1
  }, [checksPassed, agentAuthorized, isIdle])

  const hasActivePolicy = policy && policy.active && !isExpired

  // Determine final plain language decision details
  const isDecisionReady = verdict !== null || (stage === 'TASK_COMPLETED' || stage === 'BLOCKED_COMPLETED')
  const isAllowed = verdict === BlockReason.NONE

  let naturalReason = ''
  if (isDecisionReady) {
    if (isAllowed) {
      naturalReason = 'Payment approved: within 0.003 AVAX per-tx limit and recipient is authorized.'
    } else if (scenario === 'B' || verdict === BlockReason.MERCHANT_NOT_ALLOWED) {
      naturalReason = 'Recipient is not authorized by policy.'
    } else if (scenario === 'C' || verdict === BlockReason.PER_TX_LIMIT_EXCEEDED) {
      naturalReason = 'Per-transaction limit of 0.003 AVAX exceeded.'
    } else {
      naturalReason = BLOCK_REASON_TEXT[verdict || BlockReason.POLICY_INACTIVE]?.description || 'Payment blocked by policy.'
    }
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col space-y-4 font-sans">
      {/* 1. Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-black text-white tracking-tight">POLICY EVALUATION</h2>
          </div>
          <p className="text-[11px] text-slate-400">Deterministic Financial Firewall</p>
        </div>

        {/* Unified Status Badge */}
        {isSimulation ? (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>SIMULATION SANDBOX</span>
          </span>
        ) : isEvaluating ? (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>EVALUATING</span>
          </span>
        ) : hasActivePolicy ? (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>POLICY ACTIVE</span>
          </span>
        ) : isExpired ? (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>EXPIRED</span>
          </span>
        ) : policy && !policy.active ? (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Ban className="w-3.5 h-3.5" />
            <span>REVOKED</span>
          </span>
        ) : (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <span>NOT CREATED</span>
          </span>
        )}
      </div>

      {/* P0 Security Action: Compromised Agent Policy Recovery */}
      {hasCompromisedPolicy && !isSimulation && (
        <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500 text-xs font-mono space-y-1.5">
          <div className="flex items-center space-x-1.5 text-rose-400 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Notice: Leaked Agent Policy detected</span>
          </div>
          <button
            type="button"
            onClick={onRevokeCompromisedPolicy}
            disabled={isRevokingCompromised}
            className="w-full py-1.5 px-2 rounded-lg font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 cursor-pointer transition disabled:opacity-50"
          >
            {isRevokingCompromised ? 'Revoking...' : 'Revoke 0x82fF... & Recover 0.018 AVAX'}
          </button>
        </div>
      )}

      {/* 2. Active Policy Summary Card */}
      {isSimulation ? (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
              SIMULATED POLICY (ACTIVE)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Auto-Loaded Sandbox
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">Remaining:</span>
              <span className="text-emerald-400 font-bold">0.020 AVAX</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">Max / Tx:</span>
              <span className="text-white font-bold">0.003 AVAX</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">Daily:</span>
              <span className="text-slate-200 font-bold">0.000 / 0.010 AVAX</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">Expires:</span>
              <span className="text-slate-200 font-bold">60m</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
            <span>Approved Recipient:</span>
            <span className="text-emerald-400 font-semibold">✓ PremiumData API</span>
          </div>
        </div>
      ) : !hasActivePolicy ? (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
          <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center justify-between">
            <span>SET AGENT SPENDING POLICY</span>
            <span className="text-[10px] text-slate-400">Human Financial Bounds</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">Budget:</span>
              <span className="text-white font-bold">{budgetInput} AVAX</span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">Max / Tx:</span>
              <span className="text-white font-bold">{maxTxInput} AVAX</span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">Daily:</span>
              <span className="text-white font-bold">{dailyInput} AVAX</span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">Duration:</span>
              <span className="text-white font-bold">60 mins</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onCreatePolicy(budgetInput, maxTxInput, dailyInput, 3600)}
            disabled={!account || isCreatingPolicy}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 transition"
          >
            {isCreatingPolicy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PlusCircle className="w-3.5 h-3.5" />
            )}
            <span>{isCreatingPolicy ? 'Locking Budget on Fuji...' : 'Create Spending Policy on Fuji'}</span>
          </button>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">ACTIVE POLICY</span>
            <button
              type="button"
              onClick={onRevokePolicy}
              disabled={isRevokingPolicy}
              className="text-[10px] text-red-400 hover:text-red-300 font-semibold cursor-pointer underline disabled:opacity-50"
            >
              {isRevokingPolicy ? 'Revoking...' : 'Revoke & Withdraw'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">Remaining:</span>
              <span className="text-emerald-400 font-bold">{parseFloat(policy!.remainingBudget).toFixed(3)} AVAX</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">Max / Tx:</span>
              <span className="text-white font-bold">{parseFloat(policy!.maxPerTx).toFixed(3)} AVAX</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">Daily:</span>
              <span className="text-slate-200 font-bold">{parseFloat(policy!.dailySpent).toFixed(3)} / {parseFloat(policy!.dailyLimit).toFixed(3)}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">Expires:</span>
              <span className="text-slate-200 font-bold">{timeLeftMinutes}m</span>
            </div>
          </div>

          {/* Agent Wallet Row & Low Gas warning */}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900 text-slate-400">
            <span>Agent Wallet:</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-300 font-mono">{agentAddress.slice(0, 6)}...{agentAddress.slice(-4)}</span>
              <span className={`font-bold ${agentGasLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                ({parseFloat(agentBalance).toFixed(3)} AVAX)
              </span>
            </div>
          </div>

          {agentGasLow && onFundAgent && (
            <button
              type="button"
              onClick={onFundAgent}
              disabled={isFundingAgent}
              className="w-full py-1 px-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] cursor-pointer hover:bg-amber-500/20 transition flex items-center justify-center space-x-1"
            >
              <Fuel className="w-3 h-3 text-amber-400" />
              <span>{isFundingAgent ? 'Funding...' : 'Fund Agent Gas (0.005 AVAX)'}</span>
            </button>
          )}

          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
            <span>Approved Recipient:</span>
            <span className="text-emerald-400 font-semibold">✓ PremiumData API</span>
          </div>
        </div>
      )}

      {/* 3. PRIMARY DECISION CARD (Section 4 Priority Display & Section 5 Conflict Resolution) */}
      {!isIdle && (
        <div className="space-y-3">
          {verdictMismatch ? (
            <div className="py-3 px-3.5 rounded-xl bg-rose-950/90 border-2 border-rose-500 shadow-xl text-center space-y-1">
              <div className="text-[10px] uppercase font-bold text-rose-300 tracking-wider">
                POLICY VERDICT CONFLICT
              </div>
              <div className="text-base font-black text-rose-400 flex items-center justify-center space-x-1.5">
                <ShieldAlert className="w-5 h-5" />
                <span>VERDICT MISMATCH · DEMO HALTED</span>
              </div>
              <div className="text-[11px] text-rose-200 font-mono">
                Preview evaluation conflicted with on-chain event receipt. Flow halted for safety.
              </div>
            </div>
          ) : previewVerdict !== null && verdict === null && (stage === 'POLICY_VISUALIZING' || stage === 'TX_SUBMITTING' || stage === 'TX_BROADCAST' || stage === 'WAITING_ACCEPTANCE') ? (
            /* PENDING ON-CHAIN CONFIRMATION */
            <div className="py-3 px-3.5 rounded-xl bg-cyan-950/40 border-2 border-cyan-500/60 shadow-xl text-center space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center justify-center space-x-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                <span>{isSimulation ? 'EVALUATING SPENDING POLICY' : 'EVALUATING · PENDING ON-CHAIN CONFIRMATION'}</span>
              </div>
              <div className="text-sm font-bold text-white font-mono">
                Preview: {previewVerdict === BlockReason.NONE ? 'ALLOW (Pre-check Passed)' : `BLOCK (${BLOCK_REASON_TEXT[previewVerdict]?.label || 'Policy Violation'})`}
              </div>
              <div className="text-[10px] text-cyan-300/80 font-mono">
                {isSimulation ? 'Simulating deterministic on-chain logic...' : 'Submitting autonomous transaction to Avalanche Fuji...'}
              </div>
            </div>
          ) : isDecisionReady ? (
            /* FINAL VERIFIED DECISION DISPLAY */
            isAllowed ? (
              /* ALLOW CASE */
              <div className="p-4 rounded-xl bg-emerald-950/40 border-2 border-emerald-500/80 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider font-mono">
                    FINAL POLICY DECISION
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ALLOW
                  </span>
                </div>

                <div className="text-2xl font-black text-emerald-400 flex items-center space-x-2">
                  <ShieldCheck className="w-6 h-6" />
                  <span>ALLOW</span>
                </div>

                {/* Plain-Language Reason */}
                <div className="text-xs text-slate-200 font-medium leading-relaxed">
                  {naturalReason}
                </div>

                {/* Transferred Amount */}
                <div className="pt-2 border-t border-emerald-500/30 flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400">Transferred to Recipient:</span>
                  <span className="text-emerald-400 font-extrabold text-sm">0.002 AVAX</span>
                </div>

                {/* Avalanche Verification */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Settlement:</span>
                  <span className="text-emerald-300">{isSimulation ? 'Simulation Verified (Matches On-Chain Rules)' : 'Verified on Avalanche Fuji'}</span>
                </div>
              </div>
            ) : (
              /* BLOCK CASE */
              <div className="p-4 rounded-xl bg-rose-950/50 border-2 border-rose-500/80 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider font-mono">
                    FINAL POLICY DECISION
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    BLOCKED
                  </span>
                </div>

                <div className="text-2xl font-black text-rose-400 flex items-center space-x-2">
                  <ShieldAlert className="w-6 h-6" />
                  <span>BLOCKED</span>
                </div>

                {/* Plain-Language Reason */}
                <div className="text-xs text-white font-semibold leading-relaxed">
                  {naturalReason}
                </div>

                {/* Transferred Amount: MUST SHOW 0 AVAX transferred to recipient; network gas was still consumed */}
                <div className="pt-2 border-t border-rose-500/30 flex flex-col space-y-1 font-mono text-xs">
                  <span className="text-slate-400">Transferred to Recipient:</span>
                  <span className="text-rose-300 font-extrabold text-xs bg-rose-500/20 px-2 py-1 rounded border border-rose-500/30 leading-snug">
                    0 AVAX transferred to recipient; network gas was still consumed
                  </span>
                </div>

                {/* Plain-language explanation resolving TX ACCEPTED conflict */}
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1 font-mono">
                  <div className="text-emerald-400 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>Policy decision recorded on Avalanche Fuji.</span>
                  </div>
                  <div className="text-rose-300 font-semibold flex items-center space-x-1">
                    <ShieldAlert className="w-3 h-3 shrink-0" />
                    <span>0 AVAX transferred to recipient; network gas was still consumed.</span>
                  </div>
                </div>

                {/* Avalanche Verification */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Verification:</span>
                  <span className="text-cyan-300">{isSimulation ? 'Deterministic Simulation Match' : 'Verified on Avalanche Fuji'}</span>
                </div>
              </div>
            )
          ) : null}

          {/* Evidence / Explorer link */}
          {txHash ? (
            <a
              href={`https://testnet.snowtrace.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-cyan-300 hover:text-white text-xs font-mono font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <span>View On-Chain Receipt on Snowtrace Fuji</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : isSimulation && isDecisionReady ? (
            <a
              href={siteConfig.historicalEvidence.find((e) => e.scenario === scenario)?.snowtraceUrl || 'https://testnet.snowtrace.io'}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center space-x-2 transition"
            >
              <span>View verified Fuji evidence</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : null}
        </div>
      )}

      {/* 4. COLLAPSED TECHNICAL DETAILS & 8-CHECK PIPELINE (Section 4 Requirement) */}
      <details className="text-xs font-mono text-slate-400 border border-slate-800/80 rounded-xl bg-slate-950/50 p-2.5">
        <summary className="cursor-pointer hover:text-white flex items-center justify-between list-none font-semibold text-[11px] select-none">
          <span className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-red-400" />
            <span>Technical Details & Policy Evidence</span>
          </span>
          <span className="text-[10px] text-slate-500">Click to expand</span>
        </summary>

        <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
          {/* Clarification of on-chain acceptance vs transfer execution */}
          <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 leading-relaxed font-sans">
            <strong>On-chain Semantics: </strong>
            The policy-decision transaction was accepted on-chain. When a payment is blocked, AvaxGuard records the attempt and emits a PaymentBlocked event, but no funds leave the policy vault.
          </div>

          {/* 8-Check Sequential Checklist */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 pb-1">
              8-Check Policy Evaluation Pipeline:
            </div>
            {ORDERED_CHECKS.map((check, checkIndex) => {
              const isEvaluatingThis = isEvaluating && revealStep === checkIndex
              const isFailed = firstFailIndex === checkIndex
              const isSkipped = firstFailIndex !== -1 && checkIndex > firstFailIndex
              const isPassed = firstFailIndex === -1 || checkIndex < firstFailIndex
              const isRevealed =
                (revealStep > checkIndex ||
                  revealStep >= 7 ||
                  stage === 'TASK_COMPLETED' ||
                  stage === 'BLOCKED_COMPLETED' ||
                  stage === 'TX_ACCEPTED' ||
                  stage === 'WAITING_ACCEPTANCE') &&
                !isSkipped

              return (
                <div
                  key={check.id}
                  className={`flex items-center justify-between py-1 px-2 rounded border text-[11px] ${
                    isEvaluatingThis
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : isFailed
                      ? 'bg-rose-950/50 border-rose-500/70 text-rose-200'
                      : isSkipped
                      ? 'bg-slate-950/20 border-slate-800/30 text-slate-600 opacity-60'
                      : isRevealed && isPassed
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-950/40 border-slate-800/40 text-slate-400'
                  }`}
                >
                  <span className="truncate">{check.label}</span>
                  <span className="shrink-0 font-bold text-[10px]">
                    {isEvaluatingThis ? (
                      <span className="text-amber-400 flex items-center space-x-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        <span>CHECKING</span>
                      </span>
                    ) : isFailed ? (
                      <span className="text-rose-400 flex items-center space-x-0.5">
                        <XCircle className="w-2.5 h-2.5" />
                        <span>FAIL</span>
                      </span>
                    ) : isSkipped ? (
                      <span className="text-slate-500 flex items-center space-x-0.5">
                        <Minus className="w-2.5 h-2.5" />
                        <span>SKIPPED</span>
                      </span>
                    ) : isRevealed && isPassed ? (
                      <span className="text-emerald-400 flex items-center space-x-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>PASS</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">--</span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Raw Diagnostics */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Request ID:</span>
              <span className="text-slate-300 truncate max-w-[190px]">
                {spendIntent?.requestId || '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Raw Bitmask:</span>
              <span className="text-slate-300">
                {checksPassed !== null ? `0b${checksPassed.toString(2).padStart(7, '0')} (${checksPassed})` : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Block Number:</span>
              <span className="text-slate-300">{blockNumber ? `#${blockNumber}` : '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gas Used:</span>
              <span className="text-slate-300">{gasUsed ? `${gasUsed} gas` : '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Network Gas Cost:</span>
              <span className="text-slate-300">{networkGasCost || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Acceptance Latency:</span>
              <span className="text-slate-300">
                {acceptanceLatencyMs ? `${acceptanceLatencyMs} ms (${latencySource || 'WSS'})` : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Agent Principal:</span>
              <span className="text-slate-300 font-mono text-[10px]">
                {agentAddress ? `${agentAddress.slice(0, 8)}...${agentAddress.slice(-6)}` : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Contract Implementation:</span>
              <span className="text-slate-300 font-mono text-[10px]">
                AvaxGuard.sol ({contractAddress.slice(0, 6)}...{contractAddress.slice(-4)})
              </span>
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}

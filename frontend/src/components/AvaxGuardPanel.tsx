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
import { useTranslation } from '../i18n'

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
  const { language, t } = useTranslation()
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
    if (!agentAuthorized && !isSimulation) return 0
    for (let bit = 0; bit < 7; bit++) {
      if ((checksPassed & (1 << bit)) === 0) {
        return bit + 1
      }
    }
    return -1
  }, [checksPassed, agentAuthorized, isIdle, isSimulation])

  const hasActivePolicy = policy && policy.active && !isExpired

  // Determine final plain language decision details
  const isDecisionReady = verdict !== null || (stage === 'TASK_COMPLETED' || stage === 'BLOCKED_COMPLETED')
  const isAllowed = verdict === BlockReason.NONE

  let naturalReason = ''
  if (isDecisionReady) {
    if (isAllowed) {
      naturalReason = t.policyEvaluation.naturalAllow
    } else if (scenario === 'B' || verdict === BlockReason.MERCHANT_NOT_ALLOWED) {
      naturalReason = t.policyEvaluation.naturalBlockRecipient
    } else if (scenario === 'C' || verdict === BlockReason.PER_TX_LIMIT_EXCEEDED) {
      naturalReason = t.policyEvaluation.naturalBlockOverspend
    } else {
      naturalReason = BLOCK_REASON_TEXT[verdict || BlockReason.POLICY_INACTIVE]?.description || t.policyEvaluation.naturalBlockDefault
    }
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col space-y-4 font-sans">
      {/* 1. Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-black text-white tracking-tight">{t.policyEvaluation.title}</h2>
          </div>
          <p className="text-[11px] text-slate-400">{t.policyEvaluation.sub}</p>
        </div>

        {/* Unified Status Badge */}
        {isSimulation ? (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{t.policyEvaluation.simSandbox}</span>
          </span>
        ) : isEvaluating ? (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{t.policyEvaluation.evaluating}</span>
          </span>
        ) : hasActivePolicy ? (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{t.policyEvaluation.policyActive}</span>
          </span>
        ) : isExpired ? (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>{t.policyEvaluation.expired}</span>
          </span>
        ) : policy && !policy.active ? (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Ban className="w-3.5 h-3.5" />
            <span>{t.policyEvaluation.revoked}</span>
          </span>
        ) : (
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <span>{t.policyEvaluation.notCreated}</span>
          </span>
        )}
      </div>

      {/* P0 Security Action: Compromised Agent Policy Recovery */}
      {hasCompromisedPolicy && !isSimulation && (
        <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500 text-xs font-mono space-y-1.5">
          <div className="flex items-center space-x-1.5 text-rose-400 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{t.policyEvaluation.compromisedNotice}</span>
          </div>
          <button
            type="button"
            onClick={onRevokeCompromisedPolicy}
            disabled={isRevokingCompromised}
            className="w-full py-1.5 px-2 rounded-lg font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 cursor-pointer transition disabled:opacity-50"
          >
            {isRevokingCompromised ? t.policyEvaluation.revokingBtn : t.policyEvaluation.revokeCompromisedBtn}
          </button>
        </div>
      )}

      {/* 2. Active Policy Summary Card */}
      {isSimulation ? (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
              {t.policyEvaluation.simulatedPolicyActive}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {t.policyEvaluation.autoLoadedSandbox}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">{t.policyEvaluation.remaining}</span>
              <span className="text-emerald-400 font-bold">0.020 AVAX</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">{t.policyEvaluation.maxTx}</span>
              <span className="text-white font-bold">0.003 AVAX</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">{t.policyEvaluation.daily}</span>
              <span className="text-slate-200 font-bold">0.000 / 0.010 AVAX</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">{t.policyEvaluation.expires}</span>
              <span className="text-slate-200 font-bold">60m</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
            <span>{t.policyEvaluation.approvedRecipient}</span>
            <span className="text-emerald-400 font-semibold">{t.policyEvaluation.approvedRecipientValue}</span>
          </div>
        </div>
      ) : !hasActivePolicy ? (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
          <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center justify-between">
            <span>{t.policyEvaluation.setPolicyTitle}</span>
            <span className="text-[10px] text-slate-400">{t.policyEvaluation.setPolicySub}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">{t.policyEvaluation.budget}</span>
              <span className="text-white font-bold">{budgetInput} AVAX</span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">{t.policyEvaluation.maxTx}</span>
              <span className="text-white font-bold">{maxTxInput} AVAX</span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">{t.policyEvaluation.daily}</span>
              <span className="text-white font-bold">{dailyInput} AVAX</span>
            </div>
            <div className="flex justify-between p-1.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">{t.policyEvaluation.duration}</span>
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
            <span>{isCreatingPolicy ? t.policyEvaluation.lockingBudgetBtn : t.policyEvaluation.lockBudgetBtn}</span>
          </button>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{t.policyEvaluation.activePolicy}</span>
            <button
              type="button"
              onClick={onRevokePolicy}
              disabled={isRevokingPolicy}
              className="text-[10px] text-red-400 hover:text-red-300 font-semibold cursor-pointer underline disabled:opacity-50"
            >
              {isRevokingPolicy ? t.policyEvaluation.revoking : t.policyEvaluation.revokeAndWithdraw}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">{t.policyEvaluation.remaining}</span>
              <span className="text-emerald-400 font-bold">{parseFloat(policy!.remainingBudget).toFixed(3)} AVAX</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">{t.policyEvaluation.maxTx}</span>
              <span className="text-white font-bold">{parseFloat(policy!.maxPerTx).toFixed(3)} AVAX</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">{t.policyEvaluation.daily}</span>
              <span className="text-slate-200 font-bold">{parseFloat(policy!.dailySpent).toFixed(3)} / {parseFloat(policy!.dailyLimit).toFixed(3)}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">{t.policyEvaluation.expires}</span>
              <span className="text-slate-200 font-bold">{timeLeftMinutes}m</span>
            </div>
          </div>

          {/* Agent Wallet Row & Low Gas warning */}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900 text-slate-400">
            <span>{t.policyEvaluation.agentWallet}</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-300 font-mono">{agentAddress ? `${agentAddress.slice(0, 6)}...${agentAddress.slice(-4)}` : '--'}</span>
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
              <span>{isFundingAgent ? t.policyEvaluation.funding : t.policyEvaluation.fundAgentGas}</span>
            </button>
          )}

          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
            <span>{t.policyEvaluation.approvedRecipient}</span>
            <span className="text-emerald-400 font-semibold">{t.policyEvaluation.approvedRecipientValue}</span>
          </div>
        </div>
      )}

      {/* 3. PRIMARY DECISION CARD */}
      {!isIdle && (
        <div className="space-y-3">
          {verdictMismatch ? (
            <div className="py-3 px-3.5 rounded-xl bg-rose-950/90 border-2 border-rose-500 shadow-xl text-center space-y-1">
              <div className="text-[10px] uppercase font-bold text-rose-300 tracking-wider">
                {t.policyEvaluation.conflictTitle}
              </div>
              <div className="text-base font-black text-rose-400 flex items-center justify-center space-x-1.5">
                <ShieldAlert className="w-5 h-5" />
                <span>{t.policyEvaluation.conflictHeading}</span>
              </div>
              <div className="text-[11px] text-rose-200 font-mono">
                {t.policyEvaluation.conflictDesc}
              </div>
            </div>
          ) : previewVerdict !== null && verdict === null && (stage === 'POLICY_VISUALIZING' || stage === 'TX_SUBMITTING' || stage === 'TX_BROADCAST' || stage === 'WAITING_ACCEPTANCE') ? (
            /* PENDING ON-CHAIN CONFIRMATION */
            <div className="py-3 px-3.5 rounded-xl bg-cyan-950/40 border-2 border-cyan-500/60 shadow-xl text-center space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center justify-center space-x-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                <span>{isSimulation ? t.policyEvaluation.evalSim : t.policyEvaluation.evalPending}</span>
              </div>
              <div className="text-sm font-bold text-white font-mono">
                {previewVerdict === BlockReason.NONE ? t.policyEvaluation.previewAllow : `${t.policyEvaluation.previewBlockPrefix} (${BLOCK_REASON_TEXT[previewVerdict]?.label || 'Policy Violation'})`}
              </div>
              <div className="text-[10px] text-cyan-300/80 font-mono">
                {isSimulation ? t.policyEvaluation.simulatingOnChain : t.policyEvaluation.submittingAutoTx}
              </div>
            </div>
          ) : isDecisionReady ? (
            /* FINAL DECISION DISPLAY */
            isSimulation ? (
              /* SIMULATION CASE */
              isAllowed ? (
                /* SIMULATION ALLOW */
                <div className="p-4 rounded-xl bg-emerald-950/40 border-2 border-emerald-500/80 shadow-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider font-mono">
                      {t.policyEvaluation.simResult}
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {t.policyEvaluation.simDecisionAllowBadge}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-emerald-400 flex items-center space-x-2">
                    <ShieldCheck className="w-6 h-6" />
                    <span>{t.policyEvaluation.allow}</span>
                  </div>

                  <div className="text-xs text-slate-200 font-medium leading-relaxed">
                    {naturalReason}
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-emerald-500/30 text-[11px] text-slate-300 space-y-1 font-mono">
                    <div className="text-emerald-400 font-semibold flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.policyEvaluation.simDecisionAllowBadge}</span>
                    </div>
                    <div className="text-slate-400">{t.policyEvaluation.noTxBroadcastSimText}</div>
                    <div className="text-slate-400">{t.policyEvaluation.zeroGasSimText}</div>
                  </div>
                </div>
              ) : (
                /* SIMULATION BLOCK */
                <div className="p-4 rounded-xl bg-rose-950/50 border-2 border-rose-500/80 shadow-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider font-mono">
                      {t.policyEvaluation.simResult}
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {t.policyEvaluation.simDecisionBlockBadge}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-rose-400 flex items-center space-x-2">
                    <ShieldAlert className="w-6 h-6" />
                    <span>{t.policyEvaluation.blocked}</span>
                  </div>

                  <div className="text-xs text-white font-semibold leading-relaxed">
                    {naturalReason}
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-rose-500/30 text-[11px] text-slate-300 space-y-1 font-mono">
                    <div className="text-rose-400 font-semibold flex items-center space-x-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.policyEvaluation.simDecisionBlockBadge}</span>
                    </div>
                    <div className="text-slate-400">{t.policyEvaluation.noTxBroadcastText}</div>
                    <div className="text-rose-300 font-bold">{t.policyEvaluation.zeroTransferred}</div>
                    <div className="text-slate-400">{t.policyEvaluation.zeroGasSimText}</div>
                  </div>
                </div>
              )
            ) : (
              /* LIVE ON-CHAIN CASE */
              isAllowed ? (
                /* LIVE ALLOW CASE */
                <div className="p-4 rounded-xl bg-emerald-950/40 border-2 border-emerald-500/80 shadow-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider font-mono">
                      {t.policyEvaluation.finalDecision}
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {t.policyEvaluation.allow}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-emerald-400 flex items-center space-x-2">
                    <ShieldCheck className="w-6 h-6" />
                    <span>{t.policyEvaluation.allow}</span>
                  </div>

                  <div className="text-xs text-slate-200 font-medium leading-relaxed">
                    {naturalReason}
                  </div>

                  <div className="pt-2 border-t border-emerald-500/30 flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-400">{t.policyEvaluation.transferredToRecipient}</span>
                    <span className="text-emerald-400 font-extrabold text-sm">{currentExecution.transferredAmount}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{t.policyEvaluation.settlement}</span>
                    <span className="text-emerald-300">{t.policyEvaluation.verifiedOnFuji}</span>
                  </div>
                </div>
              ) : (
                /* LIVE BLOCK CASE */
                <div className="p-4 rounded-xl bg-rose-950/50 border-2 border-rose-500/80 shadow-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider font-mono">
                      {t.policyEvaluation.finalDecision}
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {t.policyEvaluation.blocked}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-rose-400 flex items-center space-x-2">
                    <ShieldAlert className="w-6 h-6" />
                    <span>{t.policyEvaluation.blocked}</span>
                  </div>

                  <div className="text-xs text-white font-semibold leading-relaxed">
                    {naturalReason}
                  </div>

                  <div className="pt-2 border-t border-rose-500/30 flex flex-col space-y-1 font-mono text-xs">
                    <span className="text-slate-400">{t.policyEvaluation.transferredToRecipient}</span>
                    <span className="text-rose-300 font-extrabold text-xs bg-rose-500/20 px-2 py-1 rounded border border-rose-500/30 leading-snug">
                      {t.policyEvaluation.zeroMovedGasConsumed}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1 font-mono">
                    <div className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>{t.policyEvaluation.decisionRecordedFuji}</span>
                    </div>
                    <div className="text-rose-300 font-semibold flex items-center space-x-1">
                      <ShieldAlert className="w-3 h-3 shrink-0" />
                      <span>{t.policyEvaluation.zeroMovedGasConsumed}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{t.policyEvaluation.verification}</span>
                    <span className="text-cyan-300">{t.policyEvaluation.verifiedOnFuji}</span>
                  </div>
                </div>
              )
            )
          ) : null}

          {/* 3.B Comparable Verified Fuji Evidence (Independent Historical Section for Instant Simulation) */}
          {isSimulation && isDecisionReady && (
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 shadow-lg space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-1.5 text-cyan-400 font-bold font-sans text-xs">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>{t.policyEvaluation.historicalEvidenceTitle}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {t.policyEvaluation.historicalEvidenceBadge}
                </span>
              </div>

              {/* Mandatory Disclaimer */}
              <div className="p-2 rounded bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200/90 font-sans leading-relaxed">
                {t.policyEvaluation.historicalDisclaimer}
              </div>

              {/* Historical Metrics Table */}
              {(() => {
                const historical = siteConfig.historicalEvidence.find((e) => e.scenario === scenario) || siteConfig.historicalEvidence[0]
                return (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t.policyEvaluation.historicalTx}</span>
                      <span className="text-slate-200">{historical.txHash.slice(0, 10)}...{historical.txHash.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t.policyEvaluation.historicalRequestId}</span>
                      <span className="text-slate-300">{historical.requestId.slice(0, 10)}...{historical.requestId.slice(-6)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t.policyEvaluation.blockNumber}</span>
                      <span className="text-slate-200">#{historical.blockNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t.policyEvaluation.historicalEvent}</span>
                      <span className={historical.action === 'ALLOW' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {historical.eventEmitted}
                      </span>
                    </div>
                    <div className="flex justify-between items-start text-slate-400">
                      <span>{t.policyEvaluation.actualTransferred}</span>
                      <span className="text-slate-200 text-right max-w-[200px]">
                        {historical.action === 'ALLOW' ? historical.transferredAmount : (language === 'zh' ? t.policyEvaluation.historicalTransferredB : historical.transferredAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t.policyEvaluation.recipientDelta}</span>
                      <span className="text-slate-200 font-mono">{historical.recipientDelta}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t.policyEvaluation.gasUsed}</span>
                      <span className="text-slate-200 font-mono">{historical.gasUsed}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t.policyEvaluation.effectiveGasPrice}</span>
                      <span className="text-slate-200 font-mono">{historical.effectiveGasPrice}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>{t.policyEvaluation.networkGasCost}</span>
                      <span className="text-slate-200 font-mono text-[10px] text-emerald-400">{historical.networkGasCost}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-900 mt-1">
                      <a
                        href={historical.snowtraceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 px-3 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition"
                      >
                        <span>{t.policyEvaluation.viewSnowtrace}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Evidence / Explorer link for Live mode */}
          {!isSimulation && txHash && (
            <a
              href={`https://testnet.snowtrace.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-cyan-300 hover:text-white text-xs font-mono font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <span>{t.policyEvaluation.viewSnowtrace}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* 4. COLLAPSED TECHNICAL DETAILS & 8-CHECK PIPELINE */}
      <details className="text-xs font-mono text-slate-400 border border-slate-800/80 rounded-xl bg-slate-950/50 p-2.5">
        <summary className="cursor-pointer hover:text-white flex items-center justify-between list-none font-semibold text-[11px] select-none">
          <span className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-red-400" />
            <span>{t.policyEvaluation.technicalDetailsTitle}</span>
          </span>
          <span className="text-[10px] text-slate-500">{t.policyEvaluation.clickToExpand}</span>
        </summary>

        <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
          {/* Clarification of on-chain acceptance vs transfer execution */}
          <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 leading-relaxed font-sans">
            <strong>{t.policyEvaluation.onChainSemantics}</strong>
            {t.policyEvaluation.onChainSemanticsDesc}
          </div>

          {/* 8-Check Sequential Checklist */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 pb-1">
              {t.policyEvaluation.pipelineTitle}
            </div>
            {t.policyEvaluation.checks.map((check, checkIndex) => {
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
                        <span>{t.policyEvaluation.checking}</span>
                      </span>
                    ) : isFailed ? (
                      <span className="text-rose-400 flex items-center space-x-0.5">
                        <XCircle className="w-2.5 h-2.5" />
                        <span>{t.policyEvaluation.fail}</span>
                      </span>
                    ) : isSkipped ? (
                      <span className="text-slate-500 flex items-center space-x-0.5">
                        <Minus className="w-2.5 h-2.5" />
                        <span>{t.policyEvaluation.skipped}</span>
                      </span>
                    ) : isRevealed && isPassed ? (
                      <span className="text-emerald-400 flex items-center space-x-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>{t.policyEvaluation.pass}</span>
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
              <span className="text-slate-500">{t.spendIntentCard.requestId}</span>
              <span className="text-slate-300 truncate max-w-[190px]">
                {spendIntent?.requestId || '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t.policyEvaluation.rawBitmask}</span>
              <span className="text-slate-300">
                {checksPassed !== null ? `0b${checksPassed.toString(2).padStart(7, '0')} (${checksPassed})` : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t.policyEvaluation.blockNumber}</span>
              <span className="text-slate-300">{blockNumber ? `#${blockNumber}` : '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t.policyEvaluation.gasUsed}</span>
              <span className="text-slate-300">{gasUsed ? `${gasUsed} gas` : '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t.policyEvaluation.networkGasCost}</span>
              <span className="text-slate-300">{networkGasCost || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t.policyEvaluation.acceptanceLatency}</span>
              <span className="text-slate-300">
                {acceptanceLatencyMs ? `${acceptanceLatencyMs} ms (${latencySource || 'WSS'})` : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t.policyEvaluation.agentPrincipal}</span>
              <span className="text-slate-300 font-mono text-[10px]">
                {agentAddress ? `${agentAddress.slice(0, 8)}...${agentAddress.slice(-6)}` : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t.policyEvaluation.contractImplementation}</span>
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


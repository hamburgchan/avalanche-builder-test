import React, { useState, useMemo } from 'react'
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
  Copy,
  Check,
  PlusCircle,
  AlertCircle,
  Fuel
} from 'lucide-react'
import type { PolicyState } from './PolicyConsole'
import { BlockReason, BLOCK_REASON_TEXT, updateFujiRpcInMetaMask } from '../config/avalanche'
import type { DemoExecution } from '../types/demo'

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
}

const ORDERED_CHECKS = [
  { id: 0, label: 'Scoped Agent Authorized', zh: '代理身份授权' },
  { id: 1, label: 'Policy Active', zh: '策略激活状态' },
  { id: 2, label: 'Not Expired', zh: '有效期检查' },
  { id: 3, label: 'Request Fresh', zh: '防重放 Nonce' },
  { id: 4, label: 'Merchant Allowed', zh: '商户白名单' },
  { id: 5, label: 'Per Tx Limit', zh: '单笔限额硬顶' },
  { id: 6, label: 'Daily Limit', zh: '单日支出限额' },
  { id: 7, label: 'Budget Available', zh: '剩余预算充足' }
]

export const AvaxGuardPanel: React.FC<AvaFencePanelProps> = ({
  currentExecution,
  policy,
  account,
  contractAddress,
  isDeployingContract,
  deployError,
  hasCompromisedPolicy,
  isRevokingCompromised,
  agentAddress,
  agentBalance,
  isFundingAgent = false,
  isCreatingPolicy,
  isRevokingPolicy,
  agentAuthorized,
  onDeployContract,
  onFundAgent,
  onRevokeCompromisedPolicy,
  onCreatePolicy,
  onRevokePolicy,
  onResetAgent
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
    networkGasCost
  } = currentExecution

  const isEvaluating = stage === 'POLICY_EVALUATING' || stage === 'POLICY_VISUALIZING'
  const isIdle = stage === 'IDLE'

  const [copiedTx, setCopiedTx] = useState(false)

  // Policy preset params
  const budgetInput = '0.02'
  const maxTxInput = '0.003'
  const dailyInput = '0.01'

  const isExpired = policy ? Date.now() / 1000 > policy.expiry : false
  const timeLeftMinutes = policy ? Math.max(0, Math.floor((policy.expiry - Date.now() / 1000) / 60)) : 0
  const agentGasLow = parseFloat(agentBalance || '0') < 0.002

  // Identify first failing step for short-circuiting / skipped display
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

  const handleCopyTx = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash)
      setCopiedTx(true)
      setTimeout(() => setCopiedTx(false), 2000)
    }
  }

  const hasActivePolicy = policy && policy.active && !isExpired

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col space-y-4">
      {/* 1. Header (Item 8: AvaFence Brand) */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-black text-white tracking-tight">AVAFENCE</h2>
          </div>
          <p className="text-[11px] text-slate-400">Financial Permission Layer (资金权限边界)</p>
        </div>

        {/* Unified Status Badge */}
        {isEvaluating ? (
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

      {/* P0 Security Action: Leaked Agent Policy */}
      {hasCompromisedPolicy && (
        <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500 text-xs font-mono space-y-1.5">
          <div className="flex items-center space-x-1.5 text-rose-400 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>P0 告警：检测到退役 Agent 存在未撤销 Policy</span>
          </div>
          <button
            type="button"
            onClick={onRevokeCompromisedPolicy}
            disabled={isRevokingCompromised}
            className="w-full py-1.5 px-2 rounded-lg font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 cursor-pointer transition disabled:opacity-50"
          >
            {isRevokingCompromised ? '撤销中...' : '撤销 0x82fF... 并提回 0.018 AVAX'}
          </button>
        </div>
      )}

      {/* 2. Compact Policy Summary Card */}
      {!hasActivePolicy ? (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
          <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center justify-between">
            <span>SET AGENT SPENDING POLICY</span>
            <span className="text-[10px] text-slate-400">人类设定资金边界</span>
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
              <span className="text-white font-bold">30 mins</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onCreatePolicy(budgetInput, maxTxInput, dailyInput, 1800)}
            disabled={!account || isCreatingPolicy}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 transition"
          >
            {isCreatingPolicy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PlusCircle className="w-3.5 h-3.5" />
            )}
            <span>{isCreatingPolicy ? '正在链上锁定预算...' : '在 Fuji 链上创建 Spending Policy'}</span>
          </button>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">POLICY SUMMARY</span>
            <button
              type="button"
              onClick={onRevokePolicy}
              disabled={isRevokingPolicy}
              className="text-[10px] text-red-400 hover:text-red-300 font-semibold cursor-pointer underline disabled:opacity-50"
            >
              {isRevokingPolicy ? '撤销中...' : 'Revoke & Withdraw'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">Remaining:</span>
              <span className="text-emerald-400 font-bold">{parseFloat(policy!.remainingBudget).toFixed(3)} AVAX</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/70 flex justify-between">
              <span className="text-slate-400">Per Tx:</span>
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
              <span>{isFundingAgent ? '正在充值...' : '充值 Agent Gas (0.005 AVAX via MetaMask)'}</span>
            </button>
          )}

          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
            <span>Allowed Merchant:</span>
            <span className="text-emerald-400 font-semibold">✓ PremiumData API</span>
          </div>
        </div>
      )}

      {/* 3. Policy Check (Item 5: 8 Single-Line Checks, Zero Old Pollution) */}
      <div className="space-y-1.5 font-mono text-xs">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between pb-1">
          <span>POLICY CHECK</span>
          <span className="text-slate-500 text-[9px]">8-Check Pipeline</span>
        </div>

        {ORDERED_CHECKS.map((check) => {
          const checkIndex = check.id

          // If current execution is IDLE, strictly neutral --
          if (isIdle || checksPassed === null || revealStep === -1) {
            return (
              <div
                key={check.id}
                className="flex items-center justify-between py-1.5 px-2.5 rounded-lg border text-xs bg-slate-950/40 border-slate-800/40 text-slate-400"
              >
                <span className="truncate max-w-[190px]">{check.label}</span>
                <span className="text-slate-600 font-bold text-[11px]">--</span>
              </div>
            )
          }

          const isEvaluatingThis = stage === 'POLICY_VISUALIZING' && revealStep === checkIndex
          const isPassed =
            checkIndex === 0
              ? agentAuthorized
              : (checksPassed & (1 << (checkIndex - 1))) !== 0

          // Crucial: When firstFailIndex is reached, subsequent checks immediately become SKIPPED
          const isSkipped =
            firstFailIndex !== -1 &&
            checkIndex > firstFailIndex &&
            revealStep >= firstFailIndex

          const isFailed = firstFailIndex === checkIndex && revealStep >= checkIndex
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
              className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg border text-xs transition-all ${
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
              <span className="truncate max-w-[190px]">{check.label}</span>

              <span className="shrink-0 font-bold text-[11px]">
                {isEvaluatingThis ? (
                  <span className="flex items-center space-x-1 text-amber-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>CHECKING</span>
                  </span>
                ) : isFailed ? (
                  <span className="flex items-center space-x-1 text-rose-400">
                    <XCircle className="w-3 h-3" />
                    <span>FAIL</span>
                  </span>
                ) : isSkipped ? (
                  <span className="flex items-center space-x-1 text-slate-500">
                    <Minus className="w-3 h-3" />
                    <span>SKIPPED</span>
                  </span>
                ) : isRevealed && isPassed ? (
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
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

      {/* 4. Policy Verdict (Requirement 4 & 5: Split Pending Preview vs Final Confirmed from Receipt Event) */}
      {!isIdle && (
        <div className="pt-1">
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
                预检结果与链上收据事件冲突，为保障资金安全已中止流程。
              </div>
            </div>
          ) : previewVerdict !== null && verdict === null && (stage === 'POLICY_VISUALIZING' || stage === 'TX_SUBMITTING' || stage === 'TX_BROADCAST' || stage === 'WAITING_ACCEPTANCE') ? (
            /* PENDING ON-CHAIN CONFIRMATION (Cyan / Neutral) */
            <div className="py-2.5 px-3 rounded-xl bg-cyan-950/40 border-2 border-cyan-500/60 shadow-xl text-center space-y-1">
              <div className="text-[10px] uppercase font-bold text-cyan-400/90 tracking-wider flex items-center justify-center space-x-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                <span>POLICY VERDICT · PENDING ON-CHAIN CONFIRMATION</span>
              </div>
              <div className="text-sm font-bold text-white font-mono">
                Preview: {previewVerdict === BlockReason.NONE ? 'ALLOW (放行预检通过)' : `BLOCK (${BLOCK_REASON_TEXT[previewVerdict]?.label || '拦截预检'})`}
              </div>
              <div className="text-[10px] text-cyan-300/80 font-mono">
                等待 Fuji 链上交易收据事件最终确认...
              </div>
            </div>
          ) : verdict !== null ? (
            /* CONFIRMED ON-CHAIN VERDICT FROM RECEIPT EVENT */
            verdict === BlockReason.NONE ? (
              <div className="py-3 px-3.5 rounded-xl bg-emerald-950/50 border-2 border-emerald-500/80 shadow-xl text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-emerald-400/90 tracking-wider">
                  FINAL POLICY VERDICT (RECEIPT EVENT CONFIRMED)
                </div>
                <div className="text-2xl font-black text-emerald-400 flex items-center justify-center space-x-2">
                  <ShieldCheck className="w-7 h-7" />
                  <span>✓ APPROVED</span>
                </div>
                <div className="text-xs text-emerald-300 font-mono">
                  0.002 AVAX authorized · PaymentExecuted 链上放行
                </div>
              </div>
            ) : (
              <div className="py-3 px-3.5 rounded-xl bg-rose-950/60 border-2 border-rose-500 shadow-xl text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-rose-400/90 tracking-wider">
                  FINAL POLICY VERDICT (RECEIPT EVENT CONFIRMED)
                </div>
                <div className="text-2xl font-black text-rose-500 flex items-center justify-center space-x-1.5">
                  <ShieldAlert className="w-7 h-7" />
                  <span>{scenario === 'C' ? '🛡 MALICIOUS PAYMENT BLOCKED' : '🛡 BLOCKED'}</span>
                </div>
                <div className="text-xs text-white font-mono font-extrabold tracking-wide">
                  {BLOCK_REASON_TEXT[verdict]?.label || (scenario === 'C' ? 'MERCHANT_NOT_ALLOWED' : 'PER_TX_LIMIT_EXCEEDED')}
                </div>
                <div className="text-[10px] text-rose-300/80 font-mono">
                  {BLOCK_REASON_TEXT[verdict]?.labelZh || 'PaymentBlocked 链上成功拦截 · 不执行转账'}
                </div>
              </div>
            )
          ) : null}
        </div>
      )}

      {/* 5. Network Status (Requirement 6: Staged Display) */}
      {!isIdle && (
        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
            <span className="font-bold text-white text-xs">NETWORK STATUS</span>
            {stage === 'TX_ACCEPTED' || stage === 'MERCHANT_VERIFYING' || stage === 'SERVICE_RELEASED' || stage === 'TASK_COMPLETED' || stage === 'BLOCKED_COMPLETED' ? (
              <span className="text-cyan-300 font-bold text-[11px] flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>✓ TX ACCEPTED ON FUJI</span>
              </span>
            ) : stage === 'WAITING_ACCEPTANCE' ? (
              <span className="text-cyan-400 font-bold text-[11px] flex items-center space-x-1 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>WAITING FOR ACCEPTANCE</span>
              </span>
            ) : stage === 'TX_BROADCAST' ? (
              <span className="text-cyan-300 font-bold text-[11px]">TX BROADCAST</span>
            ) : stage === 'TX_SUBMITTING' ? (
              <span className="text-amber-400 font-bold text-[11px] flex items-center space-x-1 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>SUBMITTING TO FUJI</span>
              </span>
            ) : stage === 'EXECUTION_ERROR' ? (
              <span className="text-rose-400 font-bold text-[11px]">EXECUTION ERROR</span>
            ) : (
              <span className="text-slate-400 font-bold text-[10px]">READY</span>
            )}
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Tx Hash:</span>
              {txHash ? (
                <div className="flex items-center space-x-1">
                  <span className="text-cyan-400 font-semibold">{txHash.slice(0, 8)}...{txHash.slice(-6)}</span>
                  <button type="button" onClick={handleCopyTx} className="text-slate-400 hover:text-white cursor-pointer p-0.5" title="Copy">
                    {copiedTx ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                  </button>
                </div>
              ) : (
                <span className="text-slate-600">--</span>
              )}
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Block Number:</span>
              <span className="text-slate-200">{blockNumber ? `#${blockNumber}` : '--'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Gas Used:</span>
              <span className="text-slate-200">{gasUsed ? `${gasUsed} gas` : '--'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Observed Acceptance:</span>
              <span className="text-cyan-300 font-bold">
                {acceptanceLatencyMs ? `${acceptanceLatencyMs} ms` : '--'}
                {acceptanceLatencyMs && (
                  <span className="text-slate-500 font-normal text-[10px] ml-1">
                    (Source: {latencySource || 'WSS'})
                  </span>
                )}
              </span>
            </div>

            {/* Dynamic Value Transfer Field */}
            {verdict === BlockReason.NONE || (scenario === 'A' && verdict === null) ? (
              <div className="pt-1.5 border-t border-slate-900 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">AUTHORIZED TRANSFER:</span>
                  <span className="text-emerald-400 font-extrabold text-xs">0.002 AVAX</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500">Merchant:</span>
                  <span className="text-slate-300 font-medium">PremiumData API</span>
                </div>
              </div>
            ) : (
              <div className="pt-1.5 border-t border-slate-900 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">UNAUTHORIZED VALUE TRANSFER:</span>
                  <span className="text-emerald-400 font-extrabold text-xs">0 AVAX (本金零损失)</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500">Agent Gas Paid:</span>
                  <span className="text-slate-300 font-mono">{networkGasCost || '~0.00068 AVAX'}</span>
                </div>
              </div>
            )}
          </div>

          {txHash && (
            <div className="pt-1">
              <a
                href={`https://testnet.snowtrace.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-1.5 px-2 rounded-lg bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition"
              >
                <span>View on Snowtrace Fuji</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* 6. Collapsible Advanced Settings (Item 9: Powered by AvaxGuard Policy Contract) */}
      <details className="text-xs font-mono text-slate-500 pt-1">
        <summary className="cursor-pointer hover:text-slate-300 list-none flex items-center justify-between">
          <span>▸ Advanced Settings (合约与网络)</span>
          <span className="text-[10px] text-slate-600 truncate max-w-[110px]">{contractAddress}</span>
        </summary>
        <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="text-[10px] text-slate-500 font-sans pb-1 border-b border-slate-900">
            Powered by AvaxGuard Policy Contract on Avalanche C-Chain
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Contract:</span>
            <a
              href={`https://testnet.snowtrace.io/address/${contractAddress}`}
              target="_blank"
              rel="noreferrer"
              className="text-red-400 hover:underline flex items-center space-x-1 text-[11px]"
            >
              <span>{contractAddress.slice(0, 8)}...{contractAddress.slice(-4)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            type="button"
            onClick={async () => {
              const ok = await updateFujiRpcInMetaMask()
              if (ok) alert('MetaMask 已切换至 PublicNode RPC！')
            }}
            className="w-full py-1 px-2 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs hover:bg-cyan-900/40 transition cursor-pointer"
          >
            切换 MetaMask 至 PublicNode
          </button>

          {!hasActivePolicy && (
            <button
              type="button"
              onClick={onResetAgent}
              className="w-full py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
            >
              重置 Agent 独立私钥
            </button>
          )}

          <button
            type="button"
            onClick={onDeployContract}
            disabled={!account || isDeployingContract}
            className="w-full py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer disabled:opacity-50"
          >
            {isDeployingContract ? '正在部署 AvaxGuard...' : '部署新的 AvaxGuard 合约'}
          </button>
          {deployError && <div className="text-rose-400 text-[10px]">{deployError}</div>}
        </div>
      </details>
    </div>
  )
}

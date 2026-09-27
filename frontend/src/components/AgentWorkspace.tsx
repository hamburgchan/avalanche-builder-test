import React from 'react'
import {
  Bot,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Database,
  Terminal,
  Hash,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Info
} from 'lucide-react'
import type { DemoExecution, DemoScenario } from '../types/demo'
import { DEMO_ADDRESSES } from '../config/avalanche'
import { useTranslation } from '../i18n'

interface AgentWorkspaceProps {
  currentExecution: DemoExecution
  isExecuting: boolean
  onSelectScenario: (scenario: DemoScenario) => void
  onTriggerExecution: () => void
  demoReadiness: { ready: boolean; reason: string }
  isSimulation?: boolean
}

export const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({
  currentExecution,
  isExecuting,
  onSelectScenario,
  onTriggerExecution,
  demoReadiness,
  isSimulation = false
}) => {
  const { t } = useTranslation()
  const {
    scenario,
    stage,
    spendIntent,
    acceptanceLatencyMs,
    latencySource,
    executionLogs
  } = currentExecution

  const isSceneLocked = isExecuting
  const isWorkflowFinalized =
    stage === 'TASK_COMPLETED' ||
    stage === 'BLOCKED_COMPLETED' ||
    stage === 'EXECUTION_ERROR'

  const latencyDisplay = acceptanceLatencyMs
    ? `${acceptanceLatencyMs} ms (${latencySource || 'WSS'})`
    : t.policyEvaluation.acceptanceLatency || 'Awaiting block acceptance'

  // Dynamic Status Badge
  const getStatusBadge = () => {
    if (isSimulation) {
      switch (stage) {
        case 'PREPARING':
          return { text: t.agentWorkspace.statusBadges.simPreparing, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', sub: t.agentWorkspace.statusBadges.subPreparing }
        case 'POLICY_EVALUATING':
          return { text: t.agentWorkspace.statusBadges.simEvaluating, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', sub: t.agentWorkspace.statusBadges.subEvaluating }
        case 'POLICY_VISUALIZING':
          return { text: t.agentWorkspace.statusBadges.simVisualizing, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', sub: t.agentWorkspace.statusBadges.subVisualizing }
        case 'TASK_COMPLETED':
          return { text: t.agentWorkspace.statusBadges.simAllow, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', sub: t.agentWorkspace.statusBadges.subAllow }
        case 'BLOCKED_COMPLETED':
          return { text: t.agentWorkspace.statusBadges.simBlock, color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', sub: t.agentWorkspace.statusBadges.subBlock }
        default:
          return { text: t.agentWorkspace.statusBadges.simStandby, color: 'bg-slate-800 text-slate-400 border-slate-700', sub: t.agentWorkspace.statusBadges.subStandby }
      }
    }

    switch (stage) {
      case 'PREPARING':
        return { text: t.agentWorkspace.statusBadges.livePreparing, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', sub: t.agentWorkspace.statusBadges.subPreparing }
      case 'POLICY_EVALUATING':
        return { text: t.agentWorkspace.statusBadges.liveEvaluating, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', sub: t.agentWorkspace.statusBadges.subEvaluating }
      case 'POLICY_VISUALIZING':
        return { text: t.agentWorkspace.statusBadges.liveVisualizing, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', sub: t.agentWorkspace.statusBadges.subVisualizing }
      case 'TX_SUBMITTING':
      case 'TX_BROADCAST':
        return { text: t.agentWorkspace.statusBadges.liveSubmitting, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', sub: t.agentWorkspace.statusBadges.subSubmitting }
      case 'WAITING_ACCEPTANCE':
        return { text: t.agentWorkspace.statusBadges.liveWaiting, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', sub: t.agentWorkspace.statusBadges.subWaiting }
      case 'TX_ACCEPTED':
      case 'MERCHANT_VERIFYING':
      case 'SERVICE_RELEASED':
        return { text: t.agentWorkspace.statusBadges.liveRecorded, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', sub: t.agentWorkspace.statusBadges.subRecorded }
      case 'TASK_COMPLETED':
        return { text: t.agentWorkspace.statusBadges.liveCompleted, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', sub: t.agentWorkspace.statusBadges.subCompleted }
      case 'BLOCKED_COMPLETED':
        return { text: t.agentWorkspace.statusBadges.liveBlocked, color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', sub: t.agentWorkspace.statusBadges.subBlocked }
      case 'EXECUTION_ERROR':
        return { text: t.agentWorkspace.statusBadges.liveError, color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', sub: t.agentWorkspace.statusBadges.subError }
      default:
        return { text: t.agentWorkspace.statusBadges.liveStandby, color: 'bg-slate-800 text-slate-400 border-slate-700', sub: t.agentWorkspace.statusBadges.subStandby }
    }
  }

  const statusBadge = getStatusBadge()

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col space-y-4 font-sans">
      {/* Workspace Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-red-500" />
          <h2 className="text-base font-black text-white tracking-tight">{t.agentWorkspace.title}</h2>
        </div>
        <div>
          {isSimulation ? (
            <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>{t.agentWorkspace.simBadge}</span>
            </span>
          ) : demoReadiness.ready ? (
            <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{t.agentWorkspace.demoReadyBadge}</span>
            </span>
          ) : (
            <span
              className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30"
              title={demoReadiness.reason}
            >
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate max-w-[200px]">{t.agentWorkspace.pendingPrefix} {demoReadiness.reason}</span>
            </span>
          )}
        </div>
      </div>

      {/* 3 Core Scenarios Tabs (Section 3: Scenario A, B, C) */}
      <div>
        <div className="text-[11px] text-slate-400 font-mono mb-2 flex items-center justify-between">
          <span className="font-bold text-white uppercase">{t.scenarios.selectTitle}</span>
          <span>{t.scenarios.coreScenarios}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Scenario A: Normal API Purchase */}
          <button
            type="button"
            onClick={() => onSelectScenario('A')}
            disabled={isSceneLocked}
            className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
              isSceneLocked
                ? 'opacity-50 cursor-not-allowed pointer-events-none border-slate-800 bg-slate-950/40 text-slate-500'
                : 'cursor-pointer'
            } ${
              scenario === 'A'
                ? 'border-emerald-500/80 bg-emerald-950/30 shadow-md ring-1 ring-emerald-500/40 text-white'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">{t.scenarios.a.label}</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {t.scenarios.a.amount}
              </span>
            </div>
            <div className="font-semibold text-xs text-white mt-1">{t.scenarios.a.title}</div>
            <div className="text-[11px] text-emerald-300/90 mt-0.5 font-mono">{t.scenarios.a.outcome}</div>
          </button>

          {/* Scenario B: Unauthorized Recipient */}
          <button
            type="button"
            onClick={() => onSelectScenario('B')}
            disabled={isSceneLocked}
            className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
              isSceneLocked
                ? 'opacity-50 cursor-not-allowed pointer-events-none border-slate-800 bg-slate-950/40 text-slate-500'
                : 'cursor-pointer'
            } ${
              scenario === 'B'
                ? 'border-rose-500/80 bg-rose-950/30 shadow-md ring-1 ring-rose-500/40 text-white'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">{t.scenarios.b.label}</span>
              <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                {t.scenarios.b.amount}
              </span>
            </div>
            <div className="font-semibold text-xs text-white mt-1">{t.scenarios.b.title}</div>
            <div className="text-[11px] text-rose-300/90 mt-0.5 font-mono">{t.scenarios.b.outcome}</div>
          </button>

          {/* Scenario C: Per-Tx Overspend */}
          <button
            type="button"
            onClick={() => onSelectScenario('C')}
            disabled={isSceneLocked}
            className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
              isSceneLocked
                ? 'opacity-50 cursor-not-allowed pointer-events-none border-slate-800 bg-slate-950/40 text-slate-500'
                : 'cursor-pointer'
            } ${
              scenario === 'C'
                ? 'border-amber-500/80 bg-amber-950/30 shadow-md ring-1 ring-amber-500/40 text-white'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">{t.scenarios.c.label}</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                {t.scenarios.c.amount}
              </span>
            </div>
            <div className="font-semibold text-xs text-white mt-1">{t.scenarios.c.title}</div>
            <div className="text-[11px] text-amber-300/90 mt-0.5 font-mono">{t.scenarios.c.outcome}</div>
          </button>
        </div>
      </div>

      {/* Human User Task Rationale */}
      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
            {t.agentWorkspace.missionDirective}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-white mt-0.5">
            {t.agentWorkspace.missionPrompt}
          </div>
        </div>

        <div
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center space-x-1.5 ${statusBadge.color}`}
        >
          {isExecuting && <Loader2 className="w-3 h-3 animate-spin" />}
          <span>{statusBadge.text}</span>
          <span className="opacity-75 font-normal text-[10px]">({statusBadge.sub})</span>
        </div>
      </div>

      {/* Scenario B Secondary Explanatory Banner */}
      {scenario === 'B' && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 font-mono text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-rose-400 tracking-wider">
            <span className="flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t.agentWorkspace.untrustedInput}</span>
            </span>
            <span className="bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded text-[9px] border border-rose-500/30">
              {t.agentWorkspace.toolOverride}
            </span>
          </div>
          <div className="text-slate-200 text-xs bg-slate-950/80 p-2.5 rounded border border-rose-500/20 space-y-1">
            <div className="text-slate-400 font-mono">{t.agentWorkspace.untrustedHook}</div>
            <div className="text-rose-400 font-bold font-mono">[UNTRUSTED TOOL OVERRIDE]</div>
            <div className="text-slate-200 font-mono">
              {t.agentWorkspace.untrustedRedirect} <span className="text-white font-bold">{DEMO_ADDRESSES.ATTACKER.slice(0, 6)}...{DEMO_ADDRESSES.ATTACKER.slice(-4)}</span>”
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            {t.agentWorkspace.untrustedNotice}
          </div>
          {stage === 'BLOCKED_COMPLETED' && (
            <div className="text-[11px] text-emerald-300 font-semibold flex items-center space-x-1 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{t.agentWorkspace.untrustedBlocked}</span>
            </div>
          )}
        </div>
      )}

      {/* Scenario C Explanatory Banner */}
      {scenario === 'C' && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 font-mono text-xs space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-amber-400 tracking-wider">
            <span>{t.agentWorkspace.overspendHeading}</span>
            <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[9px] border border-amber-500/30">
              {t.agentWorkspace.overspendGuard}
            </span>
          </div>
          <div className="text-slate-300 text-xs">
            {t.agentWorkspace.overspendNotice}
          </div>
        </div>
      )}

      {/* Execution Error Banner */}
      {stage === 'EXECUTION_ERROR' && (
        <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500 font-mono text-xs space-y-2">
          <div className="flex items-center space-x-1.5 text-rose-400 font-bold">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{t.agentWorkspace.statusBadges.liveError}</span>
          </div>
          <div className="text-rose-200 text-[11px]">
            {currentExecution.errorMessage || 'An RPC timeout or network error occurred.'}
          </div>
          <button
            type="button"
            onClick={onTriggerExecution}
            className="py-1 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer transition flex items-center space-x-1.5"
          >
            <span>{t.agentWorkspace.retry}</span>
          </button>
        </div>
      )}

      {/* Mission Workflow Timeline */}
      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs font-mono space-y-2">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold flex items-center justify-between">
          <span>{t.agentWorkspace.workflow}</span>
          {isWorkflowFinalized ? (
            <span className="text-emerald-400 text-[10px] font-semibold">{t.agentWorkspace.finalized}</span>
          ) : isExecuting ? (
            <span className="text-cyan-300 text-[10px] font-semibold flex items-center space-x-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              <span>{t.agentWorkspace.running}</span>
            </span>
          ) : (
            <span className="text-slate-500 text-[10px]">{t.agentWorkspace.standby}</span>
          )}
        </div>

        <div className="space-y-1 text-[11px]">
          {scenario === 'A' && stage === 'TASK_COMPLETED' ? (
            isSimulation ? (
              <>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.taskDirectiveParsed}</span></div>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.intentGenA}</span></div>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.policyEvalAllow}</span></div>
                <div className="flex items-center space-x-2 text-emerald-300 font-bold"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" /><span>{t.agentWorkspace.timeline.simDecisionAllow}</span></div>
                <div className="flex items-center space-x-2 text-slate-400"><Info className="w-3.5 h-3.5 shrink-0 text-cyan-400" /><span>{t.agentWorkspace.timeline.noTxBroadcastSim}</span></div>
                <div className="flex items-center space-x-2 text-slate-400"><span>{t.agentWorkspace.timeline.zeroGasSim}</span></div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.taskDirectiveParsed}</span></div>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.intentGenA}</span></div>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.policyEvalAllow}</span></div>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.txAcceptedFujiA} ({latencyDisplay})</span></div>
                <div className="flex items-center space-x-2 text-emerald-400 font-bold"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-300" /><span>{t.agentWorkspace.timeline.missionCompleted}</span></div>
                {currentExecution.txHash && (
                  <div className="pt-1.5 flex items-center justify-between border-t border-slate-900 mt-1">
                    <span className="text-[10px] text-cyan-400">{t.agentWorkspace.timeline.liveFujiTx}</span>
                    <a
                      href={`https://testnet.snowtrace.io/tx/${currentExecution.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline font-mono"
                    >
                      <span>{t.agentWorkspace.timeline.viewFujiReceipt}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </>
            )
          ) : scenario === 'B' && stage === 'BLOCKED_COMPLETED' ? (
            isSimulation ? (
              <>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.toolChangedDest}</span></div>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.intentGenB}</span></div>
                <div className="flex items-center space-x-2 text-rose-400 font-bold"><XCircle className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.allowlistCheckFailed}</span></div>
                <div className="flex items-center space-x-2 text-rose-400 font-bold"><ShieldAlert className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.simDecisionBlock}</span></div>
                <div className="flex items-center space-x-2 text-slate-400"><Info className="w-3.5 h-3.5 shrink-0 text-cyan-400" /><span>{t.agentWorkspace.timeline.noTxBroadcast}</span></div>
                <div className="flex items-center space-x-2 text-rose-300 font-semibold"><span>{t.agentWorkspace.timeline.zeroAvaxTransferred}</span></div>
                <div className="flex items-center space-x-2 text-slate-400"><span>{t.agentWorkspace.timeline.zeroGasSim}</span></div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.toolChangedDest}</span></div>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.intentGenB}</span></div>
                <div className="flex items-center space-x-2 text-rose-400 font-bold"><XCircle className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.allowlistCheckFailed}</span></div>
                <div className="flex items-center space-x-2 text-rose-400 font-bold"><ShieldAlert className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.policyBlockedB}</span></div>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.decisionRecordedFuji} ({latencyDisplay})</span></div>
                <div className="flex items-center space-x-2 text-rose-300 font-semibold"><ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" /><span>{t.agentWorkspace.timeline.zeroTransferredGasConsumed}</span></div>
                {currentExecution.txHash && (
                  <div className="pt-1.5 flex items-center justify-between border-t border-slate-900 mt-1">
                    <span className="text-[10px] text-cyan-400">{t.agentWorkspace.timeline.liveFujiTx}</span>
                    <a
                      href={`https://testnet.snowtrace.io/tx/${currentExecution.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline font-mono"
                    >
                      <span>{t.agentWorkspace.timeline.viewFujiReceipt}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </>
            )
          ) : scenario === 'C' && stage === 'BLOCKED_COMPLETED' ? (
            isSimulation ? (
              <>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.agentRequestedDataset}</span></div>
                <div className="flex items-center space-x-2 text-amber-400 font-bold"><XCircle className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.perTxExceeded}</span></div>
                <div className="flex items-center space-x-2 text-rose-400 font-bold"><ShieldAlert className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.simDecisionBlock}</span></div>
                <div className="flex items-center space-x-2 text-slate-400"><Info className="w-3.5 h-3.5 shrink-0 text-cyan-400" /><span>{t.agentWorkspace.timeline.noTxBroadcast}</span></div>
                <div className="flex items-center space-x-2 text-rose-300 font-semibold"><span>{t.agentWorkspace.timeline.zeroAvaxTransferred}</span></div>
                <div className="flex items-center space-x-2 text-slate-400"><span>{t.agentWorkspace.timeline.zeroGasSim}</span></div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.agentRequestedDataset}</span></div>
                <div className="flex items-center space-x-2 text-amber-400 font-bold"><XCircle className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.perTxExceeded}</span></div>
                <div className="flex items-center space-x-2 text-amber-400 font-bold"><ShieldAlert className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.policyBlockedC}</span></div>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.decisionRecordedFuji} ({latencyDisplay})</span></div>
                <div className="flex items-center space-x-2 text-rose-300 font-semibold"><ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" /><span>{t.agentWorkspace.timeline.zeroTransferredGasConsumed}</span></div>
                {currentExecution.txHash && (
                  <div className="pt-1.5 flex items-center justify-between border-t border-slate-900 mt-1">
                    <span className="text-[10px] text-cyan-400">{t.agentWorkspace.timeline.liveFujiTx}</span>
                    <a
                      href={`https://testnet.snowtrace.io/tx/${currentExecution.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline font-mono"
                    >
                      <span>{t.agentWorkspace.timeline.viewFujiReceipt}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </>
            )
          ) : isExecuting ? (
            isSimulation ? (
              <>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.taskIntentGen}</span></div>
                {stage === 'POLICY_EVALUATING' && (
                  <div className="flex items-center space-x-2 text-amber-300 font-semibold animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                    <span>{t.agentWorkspace.timeline.evalSimParams}</span>
                  </div>
                )}
                {stage === 'POLICY_VISUALIZING' && (
                  <div className="flex items-center space-x-2 text-cyan-300 font-semibold">
                    <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                    <span>{t.agentWorkspace.timeline.visualizingChecks}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.taskIntentGen}</span></div>
                {stage === 'POLICY_EVALUATING' && (
                  <div className="flex items-center space-x-2 text-amber-300 font-semibold animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                    <span>{t.agentWorkspace.timeline.evalPolicyFuji}</span>
                  </div>
                )}
                {stage === 'POLICY_VISUALIZING' && (
                  <div className="flex items-center space-x-2 text-cyan-300 font-semibold">
                    <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                    <span>{t.agentWorkspace.timeline.visualizingChecks}</span>
                  </div>
                )}
                {(stage === 'TX_SUBMITTING' || stage === 'TX_BROADCAST') && (
                  <div className="flex items-center space-x-2 text-amber-300 font-semibold animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                    <span>{t.agentWorkspace.timeline.broadcastingAutoTx}</span>
                  </div>
                )}
                {stage === 'WAITING_ACCEPTANCE' && (
                  <div className="flex items-center space-x-2 text-cyan-300 font-semibold animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                    <span>{t.agentWorkspace.timeline.waitingBlockConf}</span>
                  </div>
                )}
                {stage === 'TX_ACCEPTED' && (
                  <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.agentWorkspace.timeline.decisionConfFuji}</span>
                  </div>
                )}
              </>
            )
          ) : (
            <>
              <div className="flex items-center space-x-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span>{t.agentWorkspace.timeline.agentReady}</span></div>
              <div className="flex items-center space-x-2 text-slate-300">
                <span className="text-red-400 font-bold">→</span>
                <span>
                  {scenario === 'A' && t.agentWorkspace.timeline.standbyA}
                  {scenario === 'B' && t.agentWorkspace.timeline.standbyB}
                  {scenario === 'C' && t.agentWorkspace.timeline.standbyC}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-slate-500">
                <span>·</span>
                <span>{isSimulation ? t.agentWorkspace.timeline.clickBelowSim : t.agentWorkspace.timeline.clickBelowLive}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Spend Intent Details Box */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col space-y-2.5 font-mono">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <div className="text-xs uppercase tracking-wider text-white font-bold font-sans flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-red-500" />
            <span>{t.agentWorkspace.paymentIntent}</span>
          </div>
          <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
            {scenario === 'A' ? t.scenarios.a.serviceName : scenario === 'B' ? t.scenarios.b.serviceName : t.scenarios.c.serviceName}
          </span>
        </div>

        <div className="flex items-baseline justify-between py-1">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">{t.agentWorkspace.requestedAmount}</div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {spendIntent.amount} <span className="text-base text-slate-400 font-bold">AVAX</span>
            </div>
            {scenario === 'A' && (
              <div className="text-emerald-400 text-[11px] font-bold mt-0.5">
                {t.scenarios.a.limitStatus}
              </div>
            )}
            {scenario === 'B' && (
              <div className="text-rose-400 text-[11px] font-bold mt-0.5">
                {t.scenarios.b.limitStatus}
              </div>
            )}
            {scenario === 'C' && (
              <div className="text-amber-400 text-[11px] font-bold mt-0.5">
                {t.scenarios.c.limitStatus}
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase">{t.agentWorkspace.recipient}</div>
            <div
              className={`font-bold text-xs sm:text-sm truncate max-w-[180px] ${
                scenario === 'B' ? 'text-rose-400' : 'text-slate-200'
              }`}
            >
              {spendIntent.recipientAlias}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {spendIntent.recipient.slice(0, 6)}...{spendIntent.recipient.slice(-4)}
            </div>
          </div>
        </div>

        {/* Small single-line Request ID */}
        <div className="pt-1.5 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center space-x-1 shrink-0">
            <Hash className="w-3 h-3" />
            <span>{t.agentWorkspace.requestId}</span>
          </span>
          <span className="font-mono text-slate-400 truncate max-w-[260px]">
            {spendIntent.requestId}
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="space-y-1.5">
        <button
          onClick={onTriggerExecution}
          disabled={isSceneLocked || !demoReadiness.ready}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white transition-all shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer ${
            scenario === 'A'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/50'
              : scenario === 'B'
              ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-500 hover:from-rose-500 hover:to-red-500 shadow-rose-950/50'
              : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 shadow-amber-950/50'
          }`}
        >
          {stage === 'POLICY_EVALUATING' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t.agentWorkspace.evaluatingSpendingPolicy}</span>
            </>
          ) : stage === 'POLICY_VISUALIZING' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t.agentWorkspace.checkingBoundaries}</span>
            </>
          ) : stage === 'TX_SUBMITTING' || stage === 'TX_BROADCAST' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t.agentWorkspace.broadcastingFuji}</span>
            </>
          ) : stage === 'WAITING_ACCEPTANCE' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t.agentWorkspace.waitingAcceptance}</span>
            </>
          ) : stage === 'TASK_COMPLETED' || stage === 'BLOCKED_COMPLETED' ? (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>{t.agentWorkspace.runAgain}</span>
            </>
          ) : stage === 'EXECUTION_ERROR' ? (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>{t.agentWorkspace.retryScenario}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>
                {isSimulation
                  ? scenario === 'A'
                    ? t.agentWorkspace.simulateBtnA
                    : scenario === 'B'
                    ? t.agentWorkspace.simulateBtnB
                    : t.agentWorkspace.simulateBtnC
                  : scenario === 'A'
                  ? t.agentWorkspace.runLiveBtnA
                  : scenario === 'B'
                  ? t.agentWorkspace.runLiveBtnB
                  : t.agentWorkspace.runLiveBtnC}
              </span>
            </>
          )}
        </button>

        {!isSimulation && !demoReadiness.ready && (
          <div className="text-[10px] text-amber-400 font-mono text-center">
            ⚠ {demoReadiness.reason} {t.demoReadiness.setupPendingSuffix}
          </div>
        )}
      </div>

      {/* Research Output for Scenario A Completed */}
      {scenario === 'A' && stage === 'TASK_COMPLETED' && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
              <Database className="w-4 h-4" />
              <span>{t.agentWorkspace.researchResult}</span>
            </div>
            <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
              {t.agentWorkspace.premiumUnlocked}
            </span>
          </div>

          <div className="text-[11px] text-slate-300">
            {t.agentWorkspace.premiumReleased}
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/90 border border-emerald-500/20 text-slate-300 text-[11px] space-y-1">
            <div className="font-semibold text-emerald-300">{t.agentWorkspace.analysisTitle}</div>
            <div>{t.agentWorkspace.poolText}</div>
            <div>{t.agentWorkspace.supportText}</div>
          </div>
        </div>
      )}

      {/* Collapsible Execution Logs */}
      <details className="text-xs font-mono text-slate-500 pt-1">
        <summary className="cursor-pointer hover:text-slate-300 list-none flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.agentWorkspace.executionLogs}</span>
          </span>
          <span className="text-[10px] text-slate-600">{executionLogs.length} events</span>
        </summary>
        <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 max-h-36 overflow-y-auto space-y-1 text-[11px] text-slate-300">
          {executionLogs.length === 0 ? (
            <div className="text-slate-600 text-center py-2">{t.agentWorkspace.noEvents}</div>
          ) : (
            executionLogs.map((log, i) => (
              <div key={i} className="leading-tight font-mono">
                {log}
              </div>
            ))
          )}
        </div>
      </details>
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import {
  FileText,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Radio
} from 'lucide-react'
import { BlockReason, DEMO_ADDRESSES } from '../config/avalanche'
import { useTranslation } from '../i18n'

export interface AuditRecord {
  id: string
  timestamp: string
  type: 'EXECUTED' | 'BLOCKED'
  agent: string
  recipient: string
  recipientAlias: string
  amount: string
  transferredAmount?: string
  requestId: string
  reason: BlockReason
  txHash: string
  latencyMs?: number
  sceneType?: 'A' | 'B' | 'C'
  isLiveExecution?: boolean
}

// Authentic Fuji C-Chain verified transactions (P0-1 Verified Evidence)
export const DEFAULT_DEMO_AUDIT_LOGS: AuditRecord[] = [
  {
    id: 'historical-scene-a',
    timestamp: 'Fuji Block #58476762',
    type: 'EXECUTED',
    agent: '0x6ad50e7117c838c720c27d20247232f27bfcc1d7',
    recipient: DEMO_ADDRESSES.MERCHANT,
    recipientAlias: 'Approved Recipient (PremiumData API)',
    amount: '0.002',
    transferredAmount: '0.002 AVAX',
    requestId: '0x747e4c4445554d28b3f72347aecccaa278768a1babe4d3fdb92e1f167eeb5b0c',
    reason: BlockReason.NONE,
    txHash: '0xefbff0a69c9888d68a6415e046ed7d664e1406878f40170fd38dcaa2df1378a7',
    latencyMs: 1420,
    sceneType: 'A',
    isLiveExecution: false
  },
  {
    id: 'historical-scene-b',
    timestamp: 'Fuji Block #58476773',
    type: 'BLOCKED',
    agent: '0x6ad50e7117c838c720c27d20247232f27bfcc1d7',
    recipient: DEMO_ADDRESSES.ATTACKER,
    recipientAlias: 'Unauthorized Recipient (Untrusted Destination)',
    amount: '0.001',
    transferredAmount: '0 AVAX transferred to recipient; the historical blocked transaction consumed network gas.',
    requestId: '0xd6a0b9a5114dada3d8d1803056531a6b99fb908b1cf3e4fe3110c305dc8f78cd',
    reason: BlockReason.MERCHANT_NOT_ALLOWED,
    txHash: '0x9a2e7f67788bbc4c754340974adb0dd206ed298cc21405a9ed2dec41fcc9c2d9',
    latencyMs: 1530,
    sceneType: 'B',
    isLiveExecution: false
  },
  {
    id: 'historical-scene-c',
    timestamp: 'Fuji Block #58476771',
    type: 'BLOCKED',
    agent: '0x6ad50e7117c838c720c27d20247232f27bfcc1d7',
    recipient: DEMO_ADDRESSES.MERCHANT,
    recipientAlias: 'Approved Recipient (PremiumData API)',
    amount: '0.010',
    transferredAmount: '0 AVAX transferred to recipient; the historical blocked transaction consumed network gas.',
    requestId: '0x8a10e7b895c0f2bc4f8e9c011d3f7955748dfa38ca5e79ef8acb9072e13f832a',
    reason: BlockReason.PER_TX_LIMIT_EXCEEDED,
    txHash: '0xe6c790834d26d9af0b81251376e95cfacec77fe82211553664b56592bb480020',
    latencyMs: 1610,
    sceneType: 'C',
    isLiveExecution: false
  }
]

interface AuditLogProps {
  logs: AuditRecord[]
}

export const AuditLog: React.FC<AuditLogProps> = ({ logs }) => {
  const { language, t } = useTranslation()
  const [showAll, setShowAll] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const activeLogs = logs.length > 0 ? logs : DEFAULT_DEMO_AUDIT_LOGS

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Deduplicate to show the most recent representative records by scenario
  const latestByScenario = useMemo(() => {
    const seen = new Set<string>()
    const picked: AuditRecord[] = []
    for (const record of activeLogs) {
      const scenarioKey =
        record.sceneType === 'B' || record.reason === BlockReason.MERCHANT_NOT_ALLOWED
          ? 'B'
          : record.sceneType === 'C' || record.reason === BlockReason.PER_TX_LIMIT_EXCEEDED
          ? 'C'
          : 'A'

      if (!seen.has(scenarioKey)) {
        seen.add(scenarioKey)
        picked.push(record)
      }
    }
    const order: Record<string, number> = { A: 1, B: 2, C: 3 }
    return picked.sort((a, b) => {
      const keyA =
        a.sceneType === 'B' || a.reason === BlockReason.MERCHANT_NOT_ALLOWED
          ? 'B'
          : a.sceneType === 'C' || a.reason === BlockReason.PER_TX_LIMIT_EXCEEDED
          ? 'C'
          : 'A'
      const keyB =
        b.sceneType === 'B' || b.reason === BlockReason.MERCHANT_NOT_ALLOWED
          ? 'B'
          : b.sceneType === 'C' || b.reason === BlockReason.PER_TX_LIMIT_EXCEEDED
          ? 'C'
          : 'A'
      return (order[keyA] || 99) - (order[keyB] || 99)
    })
  }, [activeLogs])

  const displayedLogs = showAll ? activeLogs : latestByScenario

  return (
    <div id="audit-evidence" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl font-mono text-xs">
      {/* Table Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-red-500" />
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
            {t.auditTrail.title}
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-cyan-300 font-semibold border border-slate-700">
            {showAll ? `${t.auditTrail.allRecords} (${activeLogs.length})` : t.auditTrail.repView}
          </span>
        </div>

        {/* Evidence Category Legend */}
        <div className="flex items-center space-x-3 text-[10px] font-sans">
          <span className="inline-flex items-center space-x-1 text-emerald-400">
            <Radio className="w-2.5 h-2.5" />
            <span>{t.auditTrail.liveExecution}</span>
          </span>
          <span className="inline-flex items-center space-x-1 text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>{t.auditTrail.historicalReceipt}</span>
          </span>
        </div>

        {activeLogs.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 cursor-pointer font-semibold transition"
          >
            <span>{showAll ? t.auditTrail.showRep : `${t.auditTrail.showFull} (${activeLogs.length})`}</span>
            {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* On-Chain Evidence Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-mono uppercase text-[10px]">
            <tr>
              <th className="p-2.5">{t.auditTrail.thScenario}</th>
              <th className="p-2.5">{t.auditTrail.thEvidenceType}</th>
              <th className="p-2.5">{t.auditTrail.thDecision}</th>
              <th className="p-2.5">{t.auditTrail.thRequested}</th>
              <th className="p-2.5">{t.auditTrail.thTransferred}</th>
              <th className="p-2.5">{t.auditTrail.thRecipient}</th>
              <th className="p-2.5">{t.auditTrail.thBlockReason}</th>
              <th className="p-2.5 text-right">{t.auditTrail.thExplorer}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {displayedLogs.map((record) => {
              const isSceneB =
                record.sceneType === 'B' || record.reason === BlockReason.MERCHANT_NOT_ALLOWED
              const isSceneC =
                record.sceneType === 'C' || record.reason === BlockReason.PER_TX_LIMIT_EXCEEDED
              const isSceneA = !isSceneB && !isSceneC

              const scenarioName = isSceneA
                ? t.auditTrail.scenarioNameA
                : isSceneB
                ? t.auditTrail.scenarioNameB
                : t.auditTrail.scenarioNameC

              const transferred =
                record.type === 'EXECUTED'
                  ? (record.transferredAmount || `${record.amount} AVAX`)
                  : (language === 'zh' ? t.auditTrail.blockedTransferredText : (record.transferredAmount || '0 AVAX transferred to recipient; the historical blocked transaction consumed network gas.'))

              const isLive = record.isLiveExecution ?? (record.id.startsWith('audit-'))

              return (
                <tr key={record.id} className="hover:bg-slate-950/40 transition font-mono">
                  {/* 1. Scenario */}
                  <td className="p-2.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        isSceneA
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isSceneB
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {scenarioName}
                    </span>
                  </td>

                  {/* 2. Evidence Type */}
                  <td className="p-2.5 whitespace-nowrap">
                    {isLive ? (
                      <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                        <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                        <span>{t.auditTrail.liveExecution}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{t.auditTrail.historicalReceipt}</span>
                      </span>
                    )}
                  </td>

                  {/* 3. Decision */}
                  <td className="p-2.5 whitespace-nowrap">
                    {record.type === 'EXECUTED' ? (
                      <span className="inline-flex items-center space-x-1 font-bold text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t.policyEvaluation.allow}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 font-bold text-rose-400">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{t.policyEvaluation.blocked}</span>
                      </span>
                    )}
                  </td>

                  {/* 4. Requested Amount */}
                  <td className="p-2.5 whitespace-nowrap text-slate-300 font-bold">
                    {record.amount} AVAX
                  </td>

                  {/* 5. Transferred Amount (Must clearly show 0 AVAX for BLOCK) */}
                  <td className="p-2.5 whitespace-nowrap">
                    <span
                      className={`font-black ${
                        record.type === 'EXECUTED'
                          ? 'text-emerald-400'
                          : 'text-white bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30'
                      }`}
                    >
                      {transferred}
                    </span>
                  </td>

                  {/* 6. Recipient */}
                  <td className="p-2.5">
                    <div className="max-w-[170px] truncate text-slate-300 font-medium">
                      {record.recipientAlias}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {record.recipient.slice(0, 6)}...{record.recipient.slice(-4)}
                    </div>
                  </td>

                  {/* 7. Block Reason */}
                  <td className="p-2.5 whitespace-nowrap">
                    {record.type === 'EXECUTED' ? (
                      <span className="text-emerald-400 font-bold text-[10px]">
                        PaymentExecuted
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold text-[10px]">
                        {record.reason === BlockReason.MERCHANT_NOT_ALLOWED
                          ? (language === 'zh' ? 'recipient not authorized (未授权收款方)' : 'recipient not authorized')
                          : record.reason === BlockReason.PER_TX_LIMIT_EXCEEDED
                          ? 'PER_TX_LIMIT_EXCEEDED'
                          : 'PAYMENT_BLOCKED'}
                      </span>
                    )}
                  </td>

                  {/* 8. Fuji Explorer Link */}
                  <td className="p-2.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(record.id, record.txHash)}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                        title="Copy Tx Hash"
                      >
                        {copiedId === record.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <a
                        href={`https://testnet.snowtrace.io/tx/${record.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 transition text-[10px] font-semibold"
                      >
                        <span>Snowtrace</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Notice */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] text-slate-400 gap-2">
        <div>
          {t.auditTrail.footer}
        </div>
        <div className="text-slate-500 font-mono">
          {t.auditTrail.contract}
        </div>
      </div>
    </div>
  )
}


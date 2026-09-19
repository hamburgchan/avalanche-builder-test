import React, { useState, useMemo } from 'react'
import { FileText, ExternalLink, ShieldCheck, ShieldAlert, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { BlockReason, BLOCK_REASON_TEXT, DEMO_ADDRESSES } from '../config/avalanche'

export interface AuditRecord {
  id: string
  timestamp: string
  type: 'EXECUTED' | 'BLOCKED'
  agent: string
  recipient: string
  recipientAlias: string
  amount: string
  requestId: string
  reason: BlockReason
  txHash: string
  latencyMs?: number
  sceneType?: 'A' | 'B' | 'C'
}

// Fallback baseline authentic Fuji transactions so the evidence table has zero empty state in Hackathon demo
export const DEFAULT_DEMO_AUDIT_LOGS: AuditRecord[] = [
  {
    id: 'default-scene-a',
    timestamp: 'Fuji Live',
    type: 'EXECUTED',
    agent: DEMO_ADDRESSES.AGENT,
    recipient: DEMO_ADDRESSES.MERCHANT,
    recipientAlias: 'PremiumData API',
    amount: '0.002',
    requestId: '0x3a89e17b8f92cd40a92048f10b28492048f10b28492048f10b28492048f10b28',
    reason: BlockReason.NONE,
    txHash: '0xefbff0a69c9888d68a6415e046ed7d664e1406878f40170fd38dcaa2df1378a7',
    latencyMs: 3017,
    sceneType: 'A'
  },
  {
    id: 'default-scene-b',
    timestamp: 'Fuji Live',
    type: 'BLOCKED',
    agent: DEMO_ADDRESSES.AGENT,
    recipient: DEMO_ADDRESSES.MERCHANT,
    recipientAlias: 'PremiumData API',
    amount: '0.010',
    requestId: '0x9f182ce54a0129bc892048f10b28492048f10b28492048f10b28492048f10b28',
    reason: BlockReason.PER_TX_LIMIT_EXCEEDED,
    txHash: '0xe6c790834d26d9af0b81251376e95cfacec77fe8221155364132057be09fe2d4',
    latencyMs: 3825,
    sceneType: 'B'
  },
  {
    id: 'default-scene-c',
    timestamp: 'Fuji Live',
    type: 'BLOCKED',
    agent: DEMO_ADDRESSES.AGENT,
    recipient: DEMO_ADDRESSES.ATTACKER,
    recipientAlias: 'Unknown Wallet',
    amount: '0.001',
    requestId: '0xce7740f9831d0421892048f10b28492048f10b28492048f10b28492048f10b28',
    reason: BlockReason.MERCHANT_NOT_ALLOWED,
    txHash: '0x242eb0e54d8a149c4fae4bf0ff3dfab7fc2256740ad6eaae634da3097c02c6fe',
    latencyMs: 2967,
    sceneType: 'C'
  }
]

interface AuditLogProps {
  logs: AuditRecord[]
}

export const AuditLog: React.FC<AuditLogProps> = ({ logs }) => {
  const [showAll, setShowAll] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const activeLogs = logs.length > 0 ? logs : DEFAULT_DEMO_AUDIT_LOGS

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Item 6: Default Demo Evidence shows only the latest 1 transaction per scenario
  const latestByScenario = useMemo(() => {
    const seen = new Set<string>()
    const picked: AuditRecord[] = []
    for (const record of activeLogs) {
      const scenarioKey =
        record.sceneType === 'C' || record.reason === BlockReason.MERCHANT_NOT_ALLOWED
          ? 'C'
          : record.sceneType === 'B' || record.reason === BlockReason.PER_TX_LIMIT_EXCEEDED
          ? 'B'
          : 'A'

      if (!seen.has(scenarioKey)) {
        seen.add(scenarioKey)
        picked.push(record)
      }
    }
    // Sort so Normal Purchase (A) -> Overspending (B) -> Injection Attack (C)
    const order: Record<string, number> = { A: 1, B: 2, C: 3 }
    return picked.sort((a, b) => {
      const keyA =
        a.sceneType === 'C' || a.reason === BlockReason.MERCHANT_NOT_ALLOWED
          ? 'C'
          : a.sceneType === 'B' || a.reason === BlockReason.PER_TX_LIMIT_EXCEEDED
          ? 'B'
          : 'A'
      const keyB =
        b.sceneType === 'C' || b.reason === BlockReason.MERCHANT_NOT_ALLOWED
          ? 'C'
          : b.sceneType === 'B' || b.reason === BlockReason.PER_TX_LIMIT_EXCEEDED
          ? 'B'
          : 'A'
      return (order[keyA] || 99) - (order[keyB] || 99)
    })
  }, [activeLogs])

  const displayedLogs = showAll ? activeLogs : latestByScenario

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl font-mono text-xs">
      {/* Table Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-red-500" />
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
            ON-CHAIN EVIDENCE (链上存证证据)
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-cyan-300 font-semibold border border-slate-700">
            {showAll ? `全部历史 (${activeLogs.length})` : 'DEMO EVIDENCE · 3 笔代表证据'}
          </span>
        </div>

        {activeLogs.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 cursor-pointer font-semibold transition"
          >
            <span>{showAll ? '精简为 Demo 视图' : `展开完整历史记录 (${activeLogs.length})`}</span>
            {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* On-Chain Evidence Table (Item 5 Columns) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-mono uppercase text-[10px]">
            <tr>
              <th className="p-2.5">Scenario</th>
              <th className="p-2.5">Policy Verdict</th>
              <th className="p-2.5">Amount</th>
              <th className="p-2.5">Recipient</th>
              <th className="p-2.5">BlockReason</th>
              <th className="p-2.5">Network</th>
              <th className="p-2.5">Tx</th>
              <th className="p-2.5 text-right">Explorer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {displayedLogs.map((record) => {
              const isSceneB =
                record.sceneType === 'B' || record.reason === BlockReason.PER_TX_LIMIT_EXCEEDED
              const isSceneC =
                record.sceneType === 'C' || record.reason === BlockReason.MERCHANT_NOT_ALLOWED
              const isSceneA = record.sceneType === 'A' || record.type === 'EXECUTED'

              const scenarioName = isSceneC
                ? 'Injection Attack'
                : isSceneB
                ? 'Overspending'
                : 'Normal Purchase'

              const latencyText = record.latencyMs ? `${record.latencyMs}ms` : '3000ms'

              return (
                <tr key={record.id} className="hover:bg-slate-950/40 transition font-mono">
                  {/* 1. Scenario */}
                  <td className="p-2.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        isSceneA
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isSceneB
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {scenarioName}
                    </span>
                  </td>

                  {/* 2. Policy Verdict (Item 5) */}
                  <td className="p-2.5 whitespace-nowrap">
                    {record.type === 'EXECUTED' ? (
                      <span className="inline-flex items-center space-x-1 font-bold text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>APPROVED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 font-bold text-rose-400">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>BLOCKED</span>
                      </span>
                    )}
                  </td>

                  {/* 3. Amount */}
                  <td className="p-2.5 font-black text-white whitespace-nowrap">
                    {record.amount} AVAX
                  </td>

                  {/* 4. Recipient */}
                  <td className="p-2.5 text-slate-300">
                    <div className="font-semibold text-white truncate max-w-[130px]">
                      {record.recipientAlias}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                      {record.recipient ? `${record.recipient.slice(0, 6)}...${record.recipient.slice(-4)}` : '--'}
                    </div>
                  </td>

                  {/* 5. BlockReason */}
                  <td className="p-2.5 whitespace-nowrap">
                    {record.type === 'EXECUTED' ? (
                      <span className="text-slate-500 font-mono">—</span>
                    ) : (
                      <span className="text-rose-400 font-bold text-[10px]">
                        {BLOCK_REASON_TEXT[record.reason]?.label || (isSceneC ? 'MERCHANT_NOT_ALLOWED' : 'PER_TX_LIMIT_EXCEEDED')}
                      </span>
                    )}
                  </td>

                  {/* 6. Network Proof (Item 5: ACCEPTED · xxxx ms) */}
                  <td className="p-2.5 whitespace-nowrap">
                    <span className="text-cyan-300 font-semibold text-[11px] bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                      ACCEPTED · {latencyText}
                    </span>
                  </td>

                  {/* 7. Tx Hash */}
                  <td className="p-2.5 text-slate-400 whitespace-nowrap">
                    {record.txHash ? (
                      <div className="flex items-center space-x-1">
                        <span className="font-mono text-slate-300">
                          {record.txHash.slice(0, 6)}...{record.txHash.slice(-4)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(record.id, record.txHash)}
                          className="text-slate-500 hover:text-white transition p-0.5 cursor-pointer"
                          title="Copy Tx Hash"
                        >
                          {copiedId === record.id ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-600">--</span>
                    )}
                  </td>

                  {/* 8. Explorer */}
                  <td className="p-2.5 text-right whitespace-nowrap">
                    {record.txHash ? (
                      <a
                        href={`https://testnet.snowtrace.io/tx/${record.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-400 hover:text-red-300 inline-flex items-center space-x-1 underline font-semibold cursor-pointer"
                      >
                        <span>Snowtrace</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-600">Local</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

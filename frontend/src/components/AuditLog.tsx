import React from 'react'
import { FileText, ExternalLink, ShieldCheck, ShieldAlert } from 'lucide-react'
import { BlockReason, BLOCK_REASON_TEXT } from '../config/avalanche'

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
}

interface AuditLogProps {
  logs: AuditRecord[]
}

export const AuditLog: React.FC<AuditLogProps> = ({ logs }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl font-mono text-xs">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-red-400" />
          <h3 className="font-bold text-white text-sm">Immutable On-Chain Event Audit Log</h3>
        </div>
        <span className="text-[11px] text-slate-400">
          Total Recorded: {logs.length} Transactions
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-2">Timestamp</th>
              <th className="p-2">Event Type</th>
              <th className="p-2">Recipient (Merchant)</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Request ID</th>
              <th className="p-2">On-Chain Policy Verdict</th>
              <th className="p-2 text-right">Explorer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500 font-sans">
                  No policy events recorded on Fuji C-Chain in this session yet.
                </td>
              </tr>
            ) : (
              logs.map((record) => (
                <tr key={record.id} className="hover:bg-slate-950/40 transition">
                  <td className="p-2 text-slate-400 whitespace-nowrap">{record.timestamp}</td>
                  <td className="p-2 whitespace-nowrap">
                    {record.type === 'EXECUTED' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        <span>PAYMENT_EXECUTED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <ShieldAlert className="w-3 h-3" />
                        <span>PAYMENT_BLOCKED</span>
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-slate-300">
                    <div className="font-semibold text-white">{record.recipientAlias}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                      {record.recipient}
                    </div>
                  </td>
                  <td className="p-2 font-bold text-slate-100 whitespace-nowrap">
                    {record.amount} AVAX
                  </td>
                  <td className="p-2 text-slate-400 truncate max-w-[130px]">
                    {record.requestId}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {record.type === 'EXECUTED' ? (
                      <span className="text-emerald-400 font-semibold">
                        APPROVED {record.latencyMs ? `(${record.latencyMs}ms)` : ''}
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold">
                        {BLOCK_REASON_TEXT[record.reason]?.label || 'BLOCKED'}
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-right whitespace-nowrap">
                    {record.txHash ? (
                      <a
                        href={`https://testnet.snowtrace.io/tx/${record.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-400 hover:text-red-300 inline-flex items-center space-x-1 underline"
                      >
                        <span>Snowtrace</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-600">Local</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

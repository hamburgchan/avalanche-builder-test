import React from 'react'
import { Send, FileText, Hash, DollarSign } from 'lucide-react'

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
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center text-xs text-slate-400 font-mono">
        Waiting for Agent to form a Spend Intent...
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 shadow-md font-mono text-xs">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-slate-200 font-bold">
          <Send className="w-3.5 h-3.5 text-red-400" />
          <span>Agent Spend Intent</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-sans font-medium">
          Scene {intent.sceneType}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center space-x-1">
            <FileText className="w-3 h-3" />
            <span>Target Service</span>
          </div>
          <div className="text-slate-100 font-semibold truncate">{intent.serviceName}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <span>Target Recipient</span>
            </div>
            <div className="text-slate-200 font-mono text-[11px] truncate">
              {intent.merchantAlias}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">{intent.merchant}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <DollarSign className="w-3 h-3 text-red-400" />
              <span>Requested Amount</span>
            </div>
            <div className="text-rose-400 font-bold text-sm">{intent.amount} AVAX</div>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center space-x-1">
            <Hash className="w-3 h-3" />
            <span>Deterministic Request ID</span>
          </div>
          <div className="text-slate-300 font-mono text-[10px] break-all bg-slate-950 p-1.5 rounded border border-slate-800">
            {intent.requestId}
          </div>
        </div>
      </div>
    </div>
  )
}

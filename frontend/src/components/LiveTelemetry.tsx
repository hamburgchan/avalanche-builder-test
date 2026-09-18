import React from 'react'
import { Activity, ExternalLink, Timer } from 'lucide-react'


export interface TelemetryData {
  status: 'IDLE' | 'PENDING' | 'ACCEPTED' | 'BLOCKED'
  txHash: string | null
  blockNumber: number | null
  gasUsed: string | null
  observedLatencyMs: number | null
  unauthorizedTransfer: string
  networkGasCost: string
}

interface LiveTelemetryProps {
  telemetry: TelemetryData
}

export const LiveTelemetry: React.FC<LiveTelemetryProps> = ({ telemetry }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-red-400" />
          <h2 className="text-base font-bold text-white tracking-tight">Avalanche Live Telemetry</h2>
        </div>
        <span
          className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${
            telemetry.status === 'ACCEPTED'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : telemetry.status === 'BLOCKED'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : telemetry.status === 'PENDING'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              telemetry.status === 'ACCEPTED'
                ? 'bg-emerald-400'
                : telemetry.status === 'BLOCKED'
                ? 'bg-rose-400'
                : telemetry.status === 'PENDING'
                ? 'bg-amber-400'
                : 'bg-slate-500'
            }`}
          />
          <span>{telemetry.status}</span>
        </span>
      </div>

      {/* Observed Acceptance Live Latency Box */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              Avalanche Accepted Latency
            </div>
            <div className="text-xl font-black text-white">
              {telemetry.observedLatencyMs !== null ? (
                <>
                  <span className="text-emerald-400">{telemetry.observedLatencyMs}</span>
                  <span className="text-xs text-slate-400 ml-1">ms</span>
                </>
              ) : (
                <span className="text-slate-500 text-sm">Waiting for Tx...</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right text-[10px] text-slate-400">
          <div>Sub-Second Finality</div>
          <div className="text-emerald-400 font-semibold mt-0.5">WSS Tracked</div>
        </div>
      </div>

      {/* Security Statement (Strict compliance with PATCH 9) */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Unauthorized Value Transfer:</span>
          <span className="font-bold text-emerald-400">
            {telemetry.unauthorizedTransfer || '0 AVAX'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Network Gas Paid by Agent:</span>
          <span className="text-slate-300 text-[11px] font-mono">
            {telemetry.networkGasCost || '~0.00035 AVAX'}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
          Human Delegated Capital remains 100% safeguarded in AvaxGuard vault.
        </div>
      </div>

      {/* Block and Tx Details */}
      <div className="space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
          <span className="text-slate-400 text-[11px]">Block Height:</span>
          <span className="text-slate-200">
            {telemetry.blockNumber ? `#${telemetry.blockNumber}` : '---'}
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
          <span className="text-slate-400 text-[11px]">Gas Used:</span>
          <span className="text-slate-200">
            {telemetry.gasUsed ? `${telemetry.gasUsed} gas` : '---'}
          </span>
        </div>

        {telemetry.txHash && (
          <div className="pt-1">
            <a
              href={`https://testnet.snowtrace.io/tx/${telemetry.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <span>Verify on Snowtrace Fuji</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

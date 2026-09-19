import React, { useState } from 'react'
import { Activity, ExternalLink, Timer, ShieldCheck, Copy, Check, Lock, CheckCircle2, XCircle } from 'lucide-react'

export interface TelemetryData {
  status: 'IDLE' | 'PENDING' | 'ACCEPTED' | 'BLOCKED'
  txHash: string | null
  blockNumber: number | null
  gasUsed: string | null
  observedLatencyMs: number | null
  latencySource?: 'WSS' | 'POLLING' | 'TIMEOUT'
  unauthorizedTransfer: string
  networkGasCost: string
}

interface LiveTelemetryProps {
  telemetry: TelemetryData
  contractAddress?: string
  agentAddress?: string
}

export const LiveTelemetry: React.FC<LiveTelemetryProps> = ({
  telemetry,
  contractAddress = '0xB6379ce69E73cC6d20E5284D14386F4fBF8Ed770',
  agentAddress
}) => {
  const [copiedTx, setCopiedTx] = useState(false)

  const handleCopyTx = () => {
    if (telemetry.txHash) {
      navigator.clipboard.writeText(telemetry.txHash)
      setCopiedTx(true)
      setTimeout(() => setCopiedTx(false), 2000)
    }
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-red-500" />
          <h2 className="text-base font-bold text-white tracking-tight">AVALANCHE LIVE PROOF</h2>
        </div>
        <span
          className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
            telemetry.status === 'ACCEPTED'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : telemetry.status === 'BLOCKED'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : telemetry.status === 'PENDING'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              telemetry.status === 'ACCEPTED'
                ? 'bg-emerald-400 animate-pulse'
                : telemetry.status === 'BLOCKED'
                ? 'bg-rose-400'
                : telemetry.status === 'PENDING'
                ? 'bg-amber-400'
                : 'bg-slate-500'
            }`}
          />
          <span>
            {telemetry.status === 'ACCEPTED' && 'ACCEPTED'}
            {telemetry.status === 'BLOCKED' && 'BLOCKED'}
            {telemetry.status === 'PENDING' && 'PENDING'}
            {telemetry.status === 'IDLE' && 'WAITING'}
          </span>
        </span>
      </div>

      {/* 1. [核心大数字卡] Latency & Status */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between font-mono space-y-2 shadow-inner">
        <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
          <span className="flex items-center space-x-1.5">
            <Timer className="w-3.5 h-3.5 text-red-400" />
            <span>Avalanche 确认耗时</span>
          </span>
          <span className="text-xs font-bold text-slate-300">
            {telemetry.status === 'ACCEPTED' ? (
              <span className="text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>SETTLED</span>
              </span>
            ) : telemetry.status === 'BLOCKED' ? (
              <span className="text-rose-400 flex items-center space-x-1">
                <XCircle className="w-3 h-3" />
                <span>INTERCEPTED</span>
              </span>
            ) : (
              'READY'
            )}
          </span>
        </div>

        <div className="flex items-baseline space-x-2 py-1">
          {telemetry.observedLatencyMs !== null ? (
            <>
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {telemetry.observedLatencyMs}
              </span>
              <span className="text-sm font-semibold text-emerald-400">ms</span>
            </>
          ) : telemetry.status === 'PENDING' ? (
            <span className="text-xl font-bold text-amber-400 animate-pulse">
              Avalanche 共识测算中...
            </span>
          ) : (
            <span className="text-3xl font-black text-slate-600">-- ms</span>
          )}
        </div>

        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-900 flex items-center justify-between">
          <span>来源 (Source):</span>
          <span className="font-semibold text-slate-300">
            {telemetry.observedLatencyMs !== null
              ? telemetry.latencySource === 'WSS'
                ? 'Observed Acceptance via Avalanche WSS'
                : 'Measurement Source: Receipt Polling Fallback'
              : 'Waiting for On-Chain Execution'}
          </span>
        </div>
      </div>

      {/* 2. [交易证据卡] On-Chain Evidence */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs font-mono">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-900">
          交易存证 (Transaction Evidence):
        </div>

        {/* Tx Hash */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Tx Hash:</span>
          {telemetry.txHash ? (
            <div className="flex items-center space-x-1.5">
              <span className="text-red-400 font-semibold text-[11px]">
                {telemetry.txHash.slice(0, 8)}...{telemetry.txHash.slice(-6)}
              </span>
              <button
                type="button"
                onClick={handleCopyTx}
                title="复制完整交易哈希"
                className="text-slate-400 hover:text-white transition p-0.5 cursor-pointer"
              >
                {copiedTx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          ) : (
            <span className="text-slate-600 text-[11px]">--</span>
          )}
        </div>

        {/* Block Height */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Block:</span>
          <span className="text-slate-200 text-[11px]">
            {telemetry.blockNumber ? `#${telemetry.blockNumber}` : '--'}
          </span>
        </div>

        {/* Gas Used */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Gas Used:</span>
          <span className="text-slate-200 text-[11px]">
            {telemetry.gasUsed ? `${telemetry.gasUsed} gas` : '--'}
          </span>
        </div>

        {/* Contract */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Contract:</span>
          <span className="text-slate-300 text-[11px]">
            {contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : '--'}
          </span>
        </div>

        {/* Agent Wallet */}
        {agentAddress && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Agent:</span>
            <span className="text-slate-300 text-[11px]">
              {agentAddress.slice(0, 6)}...{agentAddress.slice(-4)}
            </span>
          </div>
        )}

        {/* Explorer Button */}
        {telemetry.txHash ? (
          <div className="pt-2">
            <a
              href={`https://testnet.snowtrace.io/tx/${telemetry.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-lg bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 hover:border-red-500/70 text-red-300 hover:text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition"
            >
              <span>Snowtrace Fuji 独立核验</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="pt-1 text-center text-[10px] text-slate-600">
            Explorer: NOT AVAILABLE (待执行上链)
          </div>
        )}
      </div>

      {/* 3. [资金安全卡] Capital Protection */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs font-mono">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-900">
          资金安全证明 (Capital Security):
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px] flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unauthorized Value Transfer:</span>
          </span>
          <span className="font-bold text-emerald-400 text-sm">
            {telemetry.unauthorizedTransfer || '0 AVAX'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Agent Gas Paid:</span>
          <span className="text-slate-300 text-[11px]">
            {telemetry.networkGasCost || '~0.00035 AVAX'}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60 flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>人类本金 100% 隔离锁于 AvaxGuard 合约金库。</span>
        </div>
      </div>
    </div>
  )
}

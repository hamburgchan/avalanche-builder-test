import React, { useState } from 'react'
import { Shield, Clock, DollarSign, Ban, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react'
import { DEMO_ADDRESSES } from '../config/avalanche'

export interface PolicyState {
  owner: string
  agent: string
  totalBudget: string
  remainingBudget: string
  maxPerTx: string
  dailyLimit: string
  dailySpent: string
  expiry: number
  active: boolean
}

interface PolicyConsoleProps {
  policy: PolicyState | null
  account: string | null
  isCreating: boolean
  isRevoking: boolean
  onCreatePolicy: (budget: string, maxTx: string, daily: string, durationSec: number) => Promise<void>
  onRevokePolicy: () => Promise<void>
}

export const PolicyConsole: React.FC<PolicyConsoleProps> = ({
  policy,
  account,
  isCreating,
  isRevoking,
  onCreatePolicy,
  onRevokePolicy
}) => {
  const [budgetInput, setBudgetInput] = useState('0.02')
  const [maxTxInput, setMaxTxInput] = useState('0.003')
  const [dailyInput, setDailyInput] = useState('0.01')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const isExpired = policy ? Date.now() / 1000 > policy.expiry : false
  const timeLeftMinutes = policy ? Math.max(0, Math.floor((policy.expiry - Date.now() / 1000) / 60)) : 0

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-red-500" />
          <h2 className="text-base font-bold text-white tracking-tight">Human Policy Guardrails</h2>
        </div>
        {policy && policy.active && !isExpired ? (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" />
            <span>ACTIVE</span>
          </span>
        ) : (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Ban className="w-3 h-3" />
            <span>{policy && isExpired ? 'EXPIRED' : 'NO ACTIVE POLICY'}</span>
          </span>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <DollarSign className="w-3 h-3 text-red-400" />
            <span>Remaining Budget</span>
          </div>
          <div className="text-sm font-bold text-emerald-400 mt-1">
            {policy ? `${parseFloat(policy.remainingBudget).toFixed(4)} AVAX` : '0.0000 AVAX'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Total: {policy ? `${policy.totalBudget} AVAX` : '0.0000 AVAX'}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase tracking-wider">Max Per Tx Limit</div>
          <div className="text-sm font-bold text-slate-200 mt-1">
            {policy ? `${policy.maxPerTx} AVAX` : '0.0000 AVAX'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Hard On-chain Cap</div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase tracking-wider">Daily Spending</div>
          <div className="text-sm font-bold text-slate-200 mt-1">
            {policy ? `${policy.dailySpent} / ${policy.dailyLimit} AVAX` : '0.0000 / 0.0000 AVAX'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">UTC Day Bucket</div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center space-x-1">
            <Clock className="w-3 h-3 text-rose-400" />
            <span>Time Remaining</span>
          </div>
          <div className="text-sm font-bold text-slate-200 mt-1">
            {policy && policy.active && !isExpired ? `${timeLeftMinutes} mins` : 'Inactive'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Auto-Expiry Guard</div>
        </div>
      </div>

      {/* Target Agent & Merchant Details */}
      <div className="space-y-2 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
          <div className="text-slate-400 text-[10px] uppercase">Bound Agent Scoped Wallet:</div>
          <div className="text-slate-200 text-[11px] truncate mt-0.5">
            {policy ? policy.agent : DEMO_ADDRESSES.AGENT}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
          <div className="text-slate-400 text-[10px] uppercase">Allowed Merchant Allowlist:</div>
          <div className="text-slate-200 text-[11px] truncate mt-0.5 flex items-center justify-between">
            <span>PremiumData API (0x12ab...1234)</span>
            <span className="text-[10px] text-emerald-400 font-semibold">[Whitelisted]</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col space-y-2">
        {!policy || !policy.active || isExpired ? (
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!account || isCreating}
            className="w-full py-2.5 px-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isCreating ? 'Deploying Policy on Fuji...' : 'Create Spending Policy (Sign Once)'}</span>
          </button>
        ) : (
          <button
            onClick={onRevokePolicy}
            disabled={isRevoking}
            className="w-full py-2 px-3 rounded-xl font-semibold text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/40 transition disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{isRevoking ? 'Revoking on Chain...' : 'Revoke Policy & Reclaim Remaining Funds'}</span>
          </button>
        )}
      </div>

      {/* Quick Config Modal */}
      {showCreateModal && (
        <div className="p-3 rounded-xl border border-red-500/30 bg-slate-950 space-y-2.5 text-xs">
          <div className="font-bold text-white">Configure Demo Spending Policy</div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Total (AVAX)</label>
              <input
                type="text"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Max / Tx</label>
              <input
                type="text"
                value={maxTxInput}
                onChange={(e) => setMaxTxInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Daily Cap</label>
              <input
                type="text"
                value={dailyInput}
                onChange={(e) => setDailyInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
          <div className="flex space-x-2 pt-1">
            <button
              onClick={async () => {
                await onCreatePolicy(budgetInput, maxTxInput, dailyInput, 1800)
                setShowCreateModal(false)
              }}
              disabled={isCreating}
              className="flex-1 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
            >
              Confirm & Lock on Avalanche
            </button>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

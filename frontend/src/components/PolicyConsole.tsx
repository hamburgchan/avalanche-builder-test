import React, { useState } from 'react'
import {
  Shield,
  Clock,
  DollarSign,
  Ban,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Zap,
  ExternalLink,
  RefreshCw,
  Fuel
} from 'lucide-react'
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
  contractAddress: string
  isContractDeployed: boolean
  isDeployingContract: boolean
  agentAddress: string
  agentBalance: string
  isFundingAgent: boolean
  isCreating: boolean
  isRevoking: boolean
  onDeployContract: () => Promise<void>
  onBindCustomContract?: (addr: string) => Promise<void>
  onFundAgent: () => Promise<void>
  onResetAgent: () => void
  onCreatePolicy: (budget: string, maxTx: string, daily: string, durationSec: number) => Promise<void>
  onRevokePolicy: () => Promise<void>
}

export const PolicyConsole: React.FC<PolicyConsoleProps> = ({
  policy,
  account,
  contractAddress,
  isContractDeployed,
  isDeployingContract,
  agentAddress,
  agentBalance,
  isFundingAgent,
  isCreating,
  isRevoking,
  onDeployContract,
  onBindCustomContract,
  onFundAgent,
  onResetAgent,
  onCreatePolicy,
  onRevokePolicy
}) => {
  const [budgetInput, setBudgetInput] = useState('0.02')
  const [maxTxInput, setMaxTxInput] = useState('0.003')
  const [dailyInput, setDailyInput] = useState('0.01')
  const [customAddrInput, setCustomAddrInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const isExpired = policy ? Date.now() / 1000 > policy.expiry : false
  const timeLeftMinutes = policy ? Math.max(0, Math.floor((policy.expiry - Date.now() / 1000) / 60)) : 0
  const agentGasLow = parseFloat(agentBalance || '0') < 0.002

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
      {/* Header */}
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

      {/* Contract Deployment Banner */}
      {!isContractDeployed ? (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5" />
              <span>AvaxGuard Contract Not Deployed</span>
            </span>
            <span className="text-[10px] text-amber-300">Fuji C-Chain</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Deploy the AvaxGuard policy engine directly to Fuji using your connected MetaMask wallet.
          </p>
          <button
            onClick={onDeployContract}
            disabled={!account || isDeployingContract}
            className="w-full py-2 px-3 rounded-lg font-bold text-xs text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isDeployingContract ? 'Deploying to Fuji...' : 'Deploy AvaxGuard Contract (via MetaMask)'}</span>
          </button>

          {/* Or bind existing address */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              {showManualInput ? 'Hide manual address input' : 'Or enter already deployed Fuji contract address'}
            </button>
            {showManualInput && (
              <div className="mt-1.5 flex space-x-1.5">
                <input
                  type="text"
                  placeholder="0x..."
                  value={customAddrInput}
                  onChange={(e) => setCustomAddrInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => onBindCustomContract && onBindCustomContract(customAddrInput)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded font-bold"
                >
                  Bind
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Live Contract (Fuji):</div>
            <div className="text-emerald-400 font-bold truncate max-w-[210px]">{contractAddress}</div>
          </div>
          <a
            href={`https://testnet.snowtrace.io/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-[10px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

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
        {/* Scoped Agent Card */}
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-slate-400 text-[10px] uppercase">Bound Agent Scoped Wallet:</div>
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] font-bold ${agentGasLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                Gas: {parseFloat(agentBalance).toFixed(4)} AVAX
              </span>
              {!policy?.active && (
                <button
                  onClick={onResetAgent}
                  title="Generate new Agent Wallet key (for new policy lifecycle)"
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className="text-slate-200 text-[11px] truncate font-mono">
            {policy ? policy.agent : agentAddress}
          </div>

          {/* Fund Agent Gas button if low */}
          {agentGasLow && (
            <button
              onClick={onFundAgent}
              disabled={!account || isFundingAgent}
              className="w-full mt-1 py-1.5 px-2 rounded-lg bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center justify-center space-x-1 transition cursor-pointer disabled:opacity-50"
            >
              <Fuel className="w-3 h-3 text-amber-400" />
              <span>{isFundingAgent ? 'Sending Gas...' : 'Fund Agent Gas (0.005 AVAX via MetaMask)'}</span>
            </button>
          )}

          <div className="text-[9px] text-slate-500 leading-tight pt-1 border-t border-slate-900">
            Client-side scoped Agent Wallet for hackathon demonstration. Private key is stored locally in the browser and is NOT production secure.
          </div>
        </div>

        {/* Merchant Allowlist Card */}
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
          <div className="text-slate-400 text-[10px] uppercase">Allowed Merchant Allowlist:</div>
          <div className="text-slate-200 text-[11px] truncate mt-0.5 flex items-center justify-between">
            <span>PremiumData API ({DEMO_ADDRESSES.MERCHANT.slice(0, 6)}...{DEMO_ADDRESSES.MERCHANT.slice(-4)})</span>
            <span className="text-[10px] text-emerald-400 font-semibold">[Whitelisted]</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col space-y-2">
        {!policy || !policy.active || isExpired ? (
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!account || !isContractDeployed || isCreating}
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
              className="flex-1 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              Confirm & Lock on Avalanche
            </button>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

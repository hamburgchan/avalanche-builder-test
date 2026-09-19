import React, { useState } from 'react'
import {
  Shield,
  Clock,
  DollarSign,
  Ban,
  AlertCircle,
  PlusCircle,
  ExternalLink,
  Fuel,
  ShieldAlert
} from 'lucide-react'
import { DEMO_ADDRESSES, updateFujiRpcInMetaMask } from '../config/avalanche'

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
  isExecuting?: boolean
  account: string | null
  contractAddress: string
  isContractDeployed: boolean
  isDeployingContract: boolean
  deployError?: string | null
  hasCompromisedPolicy?: boolean
  isRevokingCompromised?: boolean
  agentAddress: string
  agentBalance: string
  isFundingAgent: boolean
  isCreating: boolean
  isRevoking: boolean
  onDeployContract: () => Promise<void>
  onBindCustomContract?: (addr: string) => Promise<void>
  onFundAgent: () => Promise<void>
  onResetAgent: () => void
  onRevokeCompromisedPolicy?: () => Promise<void>
  onCreatePolicy: (budget: string, maxTx: string, daily: string, durationSec: number) => Promise<void>
  onRevokePolicy: () => Promise<void>
}

export type PrimaryPolicyState = 'NOT CREATED' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'RUNNING'

export const PolicyConsole: React.FC<PolicyConsoleProps> = ({
  policy,
  isExecuting = false,
  account,
  contractAddress,
  isContractDeployed,
  isDeployingContract,
  deployError,
  hasCompromisedPolicy,
  isRevokingCompromised,
  agentAddress,
  agentBalance,
  isFundingAgent,
  isCreating,
  isRevoking,
  onDeployContract,
  onBindCustomContract,
  onFundAgent,
  onResetAgent,
  onRevokeCompromisedPolicy,
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

  // Single Authoritative State Machine
  let statusType: PrimaryPolicyState = 'NOT CREATED'
  if (isExecuting) {
    statusType = 'RUNNING'
  } else if (policy && policy.owner && policy.owner !== '0x0000000000000000000000000000000000000000') {
    if (isExpired) {
      statusType = 'EXPIRED'
    } else if (policy.active) {
      statusType = 'ACTIVE'
    } else {
      statusType = 'REVOKED'
    }
  } else {
    statusType = 'NOT CREATED'
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-red-500" />
          <h2 className="text-base font-bold text-white tracking-tight">人类策略边界 (Human Policy)</h2>
        </div>
        {/* Single Mutually Exclusive Status Badge */}
        {statusType === 'RUNNING' && (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>RUNNING</span>
          </span>
        )}
        {statusType === 'ACTIVE' && (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>ACTIVE</span>
          </span>
        )}
        {statusType === 'EXPIRED' && (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>EXPIRED</span>
          </span>
        )}
        {statusType === 'REVOKED' && (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Ban className="w-3.5 h-3.5" />
            <span>REVOKED</span>
          </span>
        )}
        {statusType === 'NOT CREATED' && (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <Ban className="w-3.5 h-3.5" />
            <span>NOT CREATED</span>
          </span>
        )}
      </div>

      {/* P0 Security Action: Compromised Legacy Agent Policy Active */}
      {hasCompromisedPolicy && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-xs font-mono space-y-2">
          <div className="flex items-center space-x-1.5 text-rose-400 font-bold">
            <AlertCircle className="w-4 h-4" />
            <span>P0 安全预警：检测到已废弃 Agent 仍存在活跃 Policy！</span>
          </div>
          <p className="text-xs text-rose-200">
            已退役测试 Agent (<span className="text-amber-300 font-bold">0x82fF...1A51</span>) 链上仍有未撤销 Policy 及 0.018 AVAX 资金。请立即撤销以取回本金并永久锁定该废弃地址。
          </p>
          <button
            type="button"
            onClick={onRevokeCompromisedPolicy}
            disabled={isRevokingCompromised}
            className="w-full py-2 px-3 rounded-lg font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 cursor-pointer flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isRevokingCompromised ? '正在 Fuji 链上撤销...' : '撤销 0x82fF... 并提回 0.018 AVAX'}</span>
          </button>
        </div>
      )}

      {/* Core Metrics 2x2 Grid: Strictly Synchronized with State */}
      <div className="grid grid-cols-2 gap-3 font-mono">
        {/* Metric 1: Remaining Budget */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="text-slate-400 text-xs uppercase tracking-wider flex items-center space-x-1 font-sans">
            <DollarSign className="w-3.5 h-3.5 text-red-400" />
            <span>Remaining Budget</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1 truncate">
            {statusType === 'ACTIVE' || statusType === 'RUNNING'
              ? `${parseFloat(policy!.remainingBudget).toFixed(3)} AVAX`
              : statusType === 'EXPIRED'
              ? `${parseFloat(policy!.remainingBudget).toFixed(3)} AVAX`
              : statusType === 'REVOKED'
              ? '0.000 AVAX'
              : '--'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {statusType === 'ACTIVE' || statusType === 'RUNNING'
              ? `Total: ${policy!.totalBudget} AVAX`
              : statusType === 'EXPIRED'
              ? '已到期资金安全锁定'
              : statusType === 'REVOKED'
              ? '已全额提现至 Owner'
              : '未配置预算'}
          </div>
        </div>

        {/* Metric 2: Max / Tx */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="text-slate-400 text-xs uppercase tracking-wider font-sans">
            Max / Tx Limit
          </div>
          <div className="text-2xl font-black text-slate-100 mt-1 truncate">
            {statusType === 'ACTIVE' || statusType === 'RUNNING'
              ? `${parseFloat(policy!.maxPerTx).toFixed(3)} AVAX`
              : statusType === 'EXPIRED'
              ? `${parseFloat(policy!.maxPerTx).toFixed(3)} AVAX`
              : '--'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {statusType === 'ACTIVE' || statusType === 'RUNNING'
              ? '链上单笔硬顶'
              : statusType === 'EXPIRED'
              ? '策略过期已失效'
              : '--'}
          </div>
        </div>

        {/* Metric 3: Daily Spent */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="text-slate-400 text-xs uppercase tracking-wider font-sans">
            Daily Spent
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-200 mt-1 truncate">
            {statusType === 'ACTIVE' || statusType === 'RUNNING'
              ? `${parseFloat(policy!.dailySpent).toFixed(3)} / ${parseFloat(policy!.dailyLimit).toFixed(3)}`
              : '--'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {statusType === 'ACTIVE' || statusType === 'RUNNING' ? 'UTC 日度限额' : '--'}
          </div>
        </div>

        {/* Metric 4: Time Left */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="text-slate-400 text-xs uppercase tracking-wider flex items-center space-x-1 font-sans">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>Time Left</span>
          </div>
          <div className="text-2xl font-black text-slate-200 mt-1 truncate">
            {statusType === 'ACTIVE' || statusType === 'RUNNING'
              ? `${timeLeftMinutes}m`
              : statusType === 'EXPIRED'
              ? '00:00'
              : '--'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {statusType === 'ACTIVE' || statusType === 'RUNNING'
              ? 'Auto-Expiry Guard'
              : statusType === 'EXPIRED'
              ? '策略已到期'
              : '--'}
          </div>
        </div>
      </div>

      {/* Tertiary Information: Weakened Details */}
      <div className="space-y-2 pt-1 font-mono text-xs border-t border-slate-800/80">
        {/* Agent Scoped Wallet Row */}
        <div className="flex items-center justify-between text-slate-400 py-1 px-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
          <span className="text-xs text-slate-400">Agent Wallet:</span>
          <div className="flex items-center space-x-2 truncate max-w-[65%]">
            <span className="text-xs text-slate-300 truncate">
              {policy && policy.active ? policy.agent : agentAddress}
            </span>
            <span className={`text-xs font-bold ${agentGasLow ? 'text-amber-400' : 'text-emerald-400'}`}>
              ({parseFloat(agentBalance).toFixed(3)} AVAX)
            </span>
          </div>
        </div>

        {/* Gas funding prompt if low */}
        {agentGasLow && (
          <button
            onClick={onFundAgent}
            disabled={!account || isFundingAgent}
            className="w-full py-1.5 px-2 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            <span>{isFundingAgent ? '正在充值 Gas...' : '充值 Agent Gas (0.005 AVAX via MetaMask)'}</span>
          </button>
        )}

        {/* Allowed Merchant Row */}
        <div className="flex items-center justify-between text-slate-400 py-1 px-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
          <span className="text-xs text-slate-400">Allowed Merchant:</span>
          <span className="text-xs text-slate-300 truncate max-w-[65%]">
            PremiumData API ({DEMO_ADDRESSES.MERCHANT.slice(0, 6)}...{DEMO_ADDRESSES.MERCHANT.slice(-4)})
          </span>
        </div>
      </div>

      {/* Single Clear Action Button (Strictly Driven by statusType) */}
      <div className="pt-1">
        {statusType === 'RUNNING' ? (
          <button
            disabled
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center space-x-2 opacity-80 cursor-not-allowed"
          >
            <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            <span>Agent 正在链上执行，操作已锁定...</span>
          </button>
        ) : statusType === 'ACTIVE' ? (
          <button
            onClick={onRevokePolicy}
            disabled={isRevoking}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-rose-300 bg-rose-950/50 border border-rose-500/40 hover:bg-rose-900/50 transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-rose-950/30"
          >
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{isRevoking ? '正在链上撤销...' : 'Revoke & Withdraw (撤销并提现)'}</span>
          </button>
        ) : statusType === 'EXPIRED' ? (
          <div className="space-y-2">
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!account || !isContractDeployed || isCreating}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 transition shadow-lg shadow-amber-600/30 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isCreating ? '正在 Fuji 链上创建...' : 'Recreate Policy (重新激活策略)'}</span>
            </button>
            <button
              type="button"
              onClick={onRevokePolicy}
              disabled={isRevoking}
              className="w-full text-center text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
            >
              {isRevoking ? '正在提现...' : `或直接提回已锁定剩余本金 (${parseFloat(policy!.remainingBudget).toFixed(3)} AVAX)`}
            </button>
          </div>
        ) : statusType === 'REVOKED' ? (
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!account || !isContractDeployed || isCreating}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 transition shadow-lg shadow-red-600/30 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isCreating ? '正在 Fuji 链上创建...' : 'Create New Policy (创建新策略)'}</span>
          </button>
        ) : (
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!account || !isContractDeployed || isCreating}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 transition shadow-lg shadow-red-600/30 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isCreating ? '正在 Fuji 链上创建...' : 'Create Spending Policy (创建支出策略)'}</span>
          </button>
        )}
      </div>

      {/* Quick Config Modal (Expanded inline on request) */}
      {showCreateModal && (
        <div className="p-3.5 rounded-xl border border-red-500/40 bg-slate-950 space-y-3 text-xs font-mono">
          <div className="font-bold text-white text-sm">配置 Demo Spending Policy 策略</div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Total (AVAX)</label>
              <input
                type="text"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Max / Tx</label>
              <input
                type="text"
                value={maxTxInput}
                onChange={(e) => setMaxTxInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Daily Cap</label>
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
              className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50 transition"
            >
              确认并在 Avalanche 锁定
            </button>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer transition"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Discrete Advanced Tools Collapsible */}
      <details className="group text-xs font-mono pt-1 text-slate-500">
        <summary className="cursor-pointer hover:text-slate-300 list-none flex items-center justify-between">
          <span>▸ 高级选项：合约与 RPC (Advanced)</span>
          <span className="text-[11px] text-slate-600 truncate max-w-[130px]">{contractAddress}</span>
        </summary>
        <div className="mt-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">已验证合约 (Fuji):</span>
            <a
              href={`https://testnet.snowtrace.io/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:underline flex items-center space-x-1"
            >
              <span>{contractAddress.slice(0, 8)}...</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            type="button"
            onClick={async () => {
              const ok = await updateFujiRpcInMetaMask()
              if (ok) {
                alert('MetaMask Fuji 网络已切换至 PublicNode RPC (无速率限制)！')
              }
            }}
            className="w-full py-1.5 px-2 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs hover:bg-cyan-900/40 transition cursor-pointer"
          >
            切换 MetaMask 至 PublicNode (修复 -32002)
          </button>

          {!policy?.active && (
            <button
              type="button"
              onClick={onResetAgent}
              className="w-full py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
            >
              生成全新 Agent 独立私钥 (重置生命周期)
            </button>
          )}

          {/* Contract Redeployment / Re-binding in Advanced Menu */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <button
              type="button"
              onClick={onDeployContract}
              disabled={!account || isDeployingContract}
              className="w-full py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer disabled:opacity-50"
            >
              {isDeployingContract ? '正在部署全新合约...' : '在 Fuji 部署全新 AvaxGuard 合约'}
            </button>

            {onBindCustomContract && (
              <div>
                {!showManualInput ? (
                  <button
                    type="button"
                    onClick={() => setShowManualInput(true)}
                    className="w-full text-left text-slate-500 hover:text-slate-400 text-[11px] underline cursor-pointer"
                  >
                    绑定已有合约地址 (Bind custom address)...
                  </button>
                ) : (
                  <div className="flex space-x-1.5 mt-1">
                    <input
                      type="text"
                      placeholder="0x..."
                      value={customAddrInput}
                      onChange={(e) => setCustomAddrInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (customAddrInput.trim()) {
                          await onBindCustomContract(customAddrInput.trim())
                          setShowManualInput(false)
                        }
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs cursor-pointer"
                    >
                      绑定
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManualInput(false)}
                      className="px-2 py-1 bg-transparent text-slate-500 hover:text-slate-400 text-xs cursor-pointer"
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {deployError && (
            <div className="p-2 rounded bg-red-950/80 border border-red-500/40 text-red-300 text-xs break-all">
              {deployError}
            </div>
          )}
        </div>
      </details>
    </div>
  )
}

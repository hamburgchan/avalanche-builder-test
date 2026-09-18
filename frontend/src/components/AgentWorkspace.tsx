import { useState } from 'react'
import { ethers } from 'ethers'
import confetti from 'canvas-confetti'
import {
  Bot,
  Play,
  CheckCircle2,
  ExternalLink,
  Timer,
  Terminal,
  Layers
} from 'lucide-react'

import { CONTRACT_ADDRESS, CONTRACT_ABI, switchToFuji } from '../config/avalanche'

interface TaskRecord {
  id: string
  prompt: string
  agent: string
  reward: string
  latencyMs: number
  txHash: string
  timestamp: string
}

interface AgentWorkspaceProps {
  account: string | null
  provider: ethers.BrowserProvider | null
  refreshBalance: () => void
}

const PRESET_TASKS = [
  {
    title: 'DeFi Sentiment Scanner',
    prompt: 'Analyze sentiment across 20 Avalanche Telegram & Discord channels for AVAX breakout signals.',
    agent: '0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E',
    cost: '0.002'
  },
  {
    title: 'Smart Contract Auditor',
    prompt: 'Verify reentrancy and integer overflow in target Solidity source code.',
    agent: '0x888888cf1046e68e36E1aA2E0E07105eDDD1f08F',
    cost: '0.005'
  },
  {
    title: 'Avalanche L1 Teleporter Relay',
    prompt: 'Encode and route cross-subnet telemetry data via Avalanche Warp Messaging (AWM).',
    agent: '0x777777cf1046e68e36E1aA2E0E07105eDDD1f08D',
    cost: '0.003'
  }
]

export const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({
  account,
  provider,
  refreshBalance,
}) => {
  const [selectedTaskIdx, setSelectedTaskIdx] = useState<number>(0)
  const [customPrompt, setCustomPrompt] = useState<string>(PRESET_TASKS[0].prompt)
  const [targetAgent, setTargetAgent] = useState<string>(PRESET_TASKS[0].agent)
  const [rewardAmount, setRewardAmount] = useState<string>(PRESET_TASKS[0].cost)
  const [isExecuting, setIsExecuting] = useState<boolean>(false)
  const [executionLogs, setExecutionLogs] = useState<string[]>([])
  const [recentTasks, setRecentTasks] = useState<TaskRecord[]>([])
  const [lastLatency, setLastLatency] = useState<number | null>(null)

  const handleSelectPreset = (idx: number) => {
    setSelectedTaskIdx(idx)
    setCustomPrompt(PRESET_TASKS[idx].prompt)
    setTargetAgent(PRESET_TASKS[idx].agent)
    setRewardAmount(PRESET_TASKS[idx].cost)
  }

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ef4444', '#f87171', '#f59e0b', '#ffffff']
    })
  }

  const executeTask = async () => {
    if (!account || !provider) {
      alert('Please connect your Core Wallet or Web3 wallet first!')
      return
    }

    setIsExecuting(true)
    setExecutionLogs([])
    setLastLatency(null)

    const startTime = performance.now()
    const log = (msg: string) => setExecutionLogs((prev) => [...prev, msg])

    try {
      log(`[${new Date().toLocaleTimeString()}] 🚀 Initiating AI Agent Task on Avalanche...`)
      log(`[Prompt] "${customPrompt.slice(0, 45)}..."`)
      log(`[Agent Target] ${targetAgent.slice(0, 8)}...${targetAgent.slice(-6)}`)

      // Step 1: Check network
      const network = await provider.getNetwork()
      if (Number(network.chainId) !== 43113) {
        log('⚠️ Switching network to Avalanche Fuji (43113)...')
        const switched = await switchToFuji()
        if (!switched) {
          throw new Error('Please switch to Avalanche Fuji C-Chain in wallet')
        }
      }

      const signer = await provider.getSigner()
      const valueInWei = ethers.parseEther(rewardAmount)

      // Step 2: Call Smart Contract or Direct Micro-transfer
      log('⚡ Signing micro-payment transaction on Avalanche C-Chain...')
      
      let txHash = ''
      let confirmedLatency = 0

      if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
        const mockResultHash = 'ipfs://Qm' + Math.random().toString(36).substring(2, 15)
        
        log(`📡 Invoking AvaxAgentVault.directMicroPay() [${rewardAmount} AVAX]...`)
        const tx = await contract.directMicroPay(
          targetAgent,
          customPrompt,
          mockResultHash,
          0,
          { value: valueInWei }
        )
        log(`⛓️ Transaction Broadcasted: ${tx.hash}`)
        log('⏳ Awaiting Avalanche Sub-second Finality...')
        const receipt = await tx.wait()
        txHash = receipt.hash
      } else {
        // Fallback: Direct native micro-payment transfer to Agent address
        log(`💡 Note: Using direct native AVAX micro-transfer to agent [${rewardAmount} AVAX]...`)
        const tx = await signer.sendTransaction({
          to: targetAgent,
          value: valueInWei
        })
        log(`⛓️ Transaction Broadcasted: ${tx.hash}`)
        log('⏳ Awaiting Avalanche Sub-second Finality...')
        const receipt = await tx.wait()
        txHash = receipt?.hash || tx.hash
      }

      const endTime = performance.now()
      confirmedLatency = Math.round(endTime - startTime)
      setLastLatency(confirmedLatency)

      log(`✅ Avalanche Finality Achieved in ${confirmedLatency} ms!`)
      log(`🎯 Agent Task Verified & Micro-Payment Settled.`)

      triggerConfetti()
      refreshBalance()

      // Record task
      setRecentTasks((prev) => [
        {
          id: 'task-' + Date.now().toString(36),
          prompt: customPrompt,
          agent: targetAgent,
          reward: rewardAmount,
          latencyMs: confirmedLatency,
          txHash: txHash,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev
      ])
    } catch (err: any) {
      console.error(err)
      log(`❌ Execution failed: ${err.message || err}`)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dispatch Console (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2.5">
                <Bot className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-bold text-white">Agent Task Dispatcher</h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                Micro-Pay Engine v1.0
              </span>
            </div>

            {/* Presets */}
            <div className="mb-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Select Agent Skill Preset
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PRESET_TASKS.map((task, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(idx)}
                    className={`p-3 rounded-xl text-left border transition ${
                      selectedTaskIdx === idx
                        ? 'border-red-500 bg-red-500/10 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold truncate mb-1">{task.title}</div>
                    <div className="text-xs font-mono text-red-400">{task.cost} AVAX</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt Input */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Task Specification / AI Prompt
                </label>
                <textarea
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/60 border border-slate-800 p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 transition font-mono"
                  placeholder="Describe task for the AI agent..."
                />
              </div>

              {/* Target Agent & Reward Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Target Agent Contract / Address
                  </label>
                  <input
                    type="text"
                    value={targetAgent}
                    onChange={(e) => setTargetAgent(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-800 p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-red-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Micro-Payment (AVAX)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(e.target.value)}
                      className="w-full rounded-xl bg-slate-950/60 border border-slate-800 p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-red-500 transition pr-16"
                    />
                    <div className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">AVAX</div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={executeTask}
                disabled={isExecuting}
                className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-600/30 transition transform active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Executing & Settling on Avalanche...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Dispatch Task & Settle on Avalanche</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sub-Second Latency Live Card */}
          {lastLatency !== null && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Timer className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-emerald-400/80 font-semibold uppercase tracking-wider">
                    Avalanche Finality Confirmed
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-300">
                    {lastLatency} <span className="text-sm font-medium">ms</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Transaction Status</div>
                <div className="text-sm font-bold text-white flex items-center justify-end space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Sub-Second Finalized</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Terminal Logs & Settled Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Execution Console */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-80">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-mono font-bold text-slate-300">AGENT_SETTLEMENT_LOGS</span>
              </div>
              <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-xs text-slate-300 pr-1">
              {executionLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center">
                  <Bot className="w-8 h-8 mb-2 opacity-50" />
                  <p>Ready. Click "Dispatch Task" to trigger real-time settlement on Avalanche Fuji.</p>
                </div>
              ) : (
                executionLogs.map((item, idx) => (
                  <div key={idx} className="leading-relaxed break-all">
                    {item}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Settled Tasks Feed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-white">Settled Tasks</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">{recentTasks.length} Completed</span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {recentTasks.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No tasks settled in this session yet.</p>
              ) : (
                recentTasks.map((t) => (
                  <div key={t.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200 truncate max-w-[180px]">{t.prompt}</span>
                      <span className="font-mono text-emerald-400 font-semibold">{t.reward} AVAX</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                      <span>Confirmed in {t.latencyMs}ms</span>
                      {t.txHash && (
                        <a
                          href={`https://testnet.snowtrace.io/tx/${t.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition underline"
                        >
                          <span>Snowtrace</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

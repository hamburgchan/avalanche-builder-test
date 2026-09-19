import { useState, useEffect, useCallback, useMemo } from 'react'
import { ethers } from 'ethers'
import confetti from 'canvas-confetti'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import type { PolicyState } from './components/PolicyConsole'
import { AgentWorkspace } from './components/AgentWorkspace'
import { AvaxGuardPanel } from './components/AvaxGuardPanel'
import { AuditLog, type AuditRecord } from './components/AuditLog'
import { FaucetModal } from './components/FaucetModal'
import {
  type DemoExecution,
  type DemoScenario,
  createInitialExecution,
  createInitialSpendIntent
} from './types/demo'
import {
  getAvaxGuardAddress,
  setAvaxGuardAddress,
  AVAX_GUARD_ABI,
  AVAX_GUARD_BYTECODE,
  DEMO_ADDRESSES,
  BlockReason,
  BLOCK_REASON_TEXT,
  FUJI_CHAIN_CONFIG,
  assertFujiNetwork,
  validateAddressOrThrow
} from './config/avalanche'
import {
  getOrCreateAgentWallet,
  createNewAgentWallet
} from './services/agentWallet'
import { monitor } from './services/monitor'
import { merchantService } from './services/merchant'

export function App() {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [balance, setBalance] = useState<string>('0')
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [isFaucetOpen, setIsFaucetOpen] = useState<boolean>(false)

  // Contract deployment state
  const [contractAddress, setContractAddr] = useState<string>(getAvaxGuardAddress())
  const [isContractDeployed, setIsContractDeployed] = useState<boolean>(true)
  const [isDeployingContract, setIsDeployingContract] = useState<boolean>(false)
  const [deployError, setDeployError] = useState<string | null>(null)
  const [hasCompromisedPolicy, setHasCompromisedPolicy] = useState<boolean>(false)
  const [isRevokingCompromised, setIsRevokingCompromised] = useState<boolean>(false)

  // Agent Scoped Wallet state
  const [agentWallet, setAgentWallet] = useState<ethers.Wallet>(() => getOrCreateAgentWallet())
  const [agentBalance, setAgentBalance] = useState<string>('0')
  const [isFundingAgent, setIsFundingAgent] = useState<boolean>(false)

  // Policy & Guard state
  const [policy, setPolicy] = useState<PolicyState | null>(null)
  const [isCreatingPolicy, setIsCreatingPolicy] = useState<boolean>(false)
  const [isRevokingPolicy, setIsRevokingPolicy] = useState<boolean>(false)

  // Unified Demo Execution State Machine (Item 2 & 3)
  const [agentAuthorized, setAgentAuthorized] = useState<boolean>(false)
  const [currentExecution, setCurrentExecution] = useState<DemoExecution>(() =>
    createInitialExecution('A')
  )

  const isExecuting =
    currentExecution.stage !== 'IDLE' &&
    currentExecution.stage !== 'TASK_COMPLETED' &&
    currentExecution.stage !== 'BLOCKED_COMPLETED' &&
    currentExecution.stage !== 'EXECUTION_ERROR'
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('AVAX_GUARD_AUDIT_LOGS')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return []
  })

  // Persist audit logs
  useEffect(() => {
    if (typeof window !== 'undefined' && auditLogs.length > 0) {
      try {
        localStorage.setItem('AVAX_GUARD_AUDIT_LOGS', JSON.stringify(auditLogs.slice(0, 50)))
      } catch {}
    }
  }, [auditLogs])

  // Nonce counter for deterministic request IDs
  const [localNonce, setLocalNonce] = useState<number>(Date.now() % 1000000)

  // Init WSS monitor once
  useEffect(() => {
    monitor.init()
  }, [])

  // Direct static read-only Fuji RPC provider (Bypasses MetaMask completely for all queries)
  const fujiReadOnlyRpc = useMemo(
    () => new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0], 43113, { staticNetwork: true }),
    []
  )

  const refreshBalances = useCallback(async () => {
    if (account) {
      try {
        const bal = await fujiReadOnlyRpc.getBalance(account)
        setBalance(ethers.formatEther(bal))
      } catch (e) {
        console.error('Failed to get account balance:', e)
      }
    }
    if (agentWallet) {
      try {
        const aBal = await fujiReadOnlyRpc.getBalance(agentWallet.address)
        setAgentBalance(ethers.formatEther(aBal))
      } catch (e) {
        console.error('Failed to get agent balance:', e)
      }
    }
  }, [account, agentWallet, fujiReadOnlyRpc])

  // Load Policy from Avalanche C-Chain
  const loadPolicy = useCallback(async () => {
    if (!account || !agentWallet) return

    try {
      const code = await fujiReadOnlyRpc.getCode(contractAddress)
      const isDeployed = code !== '0x' && code.length > 2
      setIsContractDeployed(isDeployed)

      if (isDeployed) {
        const contract = new ethers.Contract(contractAddress, AVAX_GUARD_ABI, fujiReadOnlyRpc)

        // Check if compromised legacy agent (0x82fF1466015f208dB33e4E198e529b03f6fa1A51) still has an active policy
        const RETIRED_LEAKED_AGENT = '0x82fF1466015f208dB33e4E198e529b03f6fa1A51'
        contract.policies(account, RETIRED_LEAKED_AGENT).then((cp: any) => {
          setHasCompromisedPolicy(cp && (cp.active || cp.remainingBudget > 0n))
        }).catch(() => setHasCompromisedPolicy(false))

        const activeOwner = await contract.activeOwnerOfAgent(agentWallet.address).catch(() => ethers.ZeroAddress)
        const isBound = activeOwner.toLowerCase() === account.toLowerCase()
        setAgentAuthorized(isBound)

        const p = await contract.policies(account, agentWallet.address)
        if (p.owner !== ethers.ZeroAddress && (p.active || p.remainingBudget > 0n)) {
          setPolicy({
            owner: p.owner,
            agent: p.agent,
            totalBudget: ethers.formatEther(p.totalBudget),
            remainingBudget: ethers.formatEther(p.remainingBudget),
            maxPerTx: ethers.formatEther(p.maxPerTx),
            dailyLimit: ethers.formatEther(p.dailyLimit),
            dailySpent: ethers.formatEther(p.dailySpent),
            expiry: Number(p.expiry),
            active: p.active
          })
          return
        }
      }
    } catch (err) {
      console.warn('Contract call failed, reset state:', err)
    }

    setPolicy(null)
    setAgentAuthorized(false)
  }, [account, agentWallet, contractAddress, fujiReadOnlyRpc])

  useEffect(() => {
    loadPolicy()
    refreshBalances()
  }, [loadPolicy, refreshBalances])

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum
    if (!ethereum) {
      alert('请先在浏览器安装 MetaMask 或 Core Wallet 扩展插件！')
      return
    }

    setIsConnecting(true)
    try {
      const browserProvider = new ethers.BrowserProvider(ethereum)
      const accounts = await browserProvider.send('eth_requestAccounts', [])
      const network = await browserProvider.getNetwork()

      if (Number(network.chainId) !== 43113) {
        await assertFujiNetwork(browserProvider)
      }

      setProvider(browserProvider)
      setAccount(accounts[0] || null)
      setChainId(Number(network.chainId))

      const bal = await browserProvider.getBalance(accounts[0])
      setBalance(ethers.formatEther(bal))
    } catch (err: any) {
      console.error('Wallet connection rejected:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  // Auto connect
  useEffect(() => {
    const ethereum = (window as any).ethereum
    if (!ethereum) return

    const handleAccounts = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0])
        refreshBalances()
      } else {
        setAccount(null)
        setBalance('0')
      }
    }

    const handleChain = (cId: string) => {
      setChainId(parseInt(cId, 16))
      refreshBalances()
    }

    ethereum.on('accountsChanged', handleAccounts)
    ethereum.on('chainChanged', handleChain)

    const init = async () => {
      const browserProvider = new ethers.BrowserProvider(ethereum)
      const accounts = await browserProvider.listAccounts()
      if (accounts.length > 0) {
        setProvider(browserProvider)
        setAccount(accounts[0].address)
        const net = await browserProvider.getNetwork()
        setChainId(Number(net.chainId))
        const bal = await browserProvider.getBalance(accounts[0].address)
        setBalance(ethers.formatEther(bal))
      }
    }
    init()

    return () => {
      ethereum.removeListener('accountsChanged', handleAccounts)
      ethereum.removeListener('chainChanged', handleChain)
    }
  }, [refreshBalances])

  // In-DApp 1-Click Contract Deployer via MetaMask (P0-DEPLOYMENT)
  const handleDeployContract = async () => {
    if (!account || !provider) {
      alert('请先连接 MetaMask 钱包！')
      return
    }

    setIsDeployingContract(true)
    setDeployError(null)
    try {
      await assertFujiNetwork(provider)
      const fujiRpc = new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0], 43113, { staticNetwork: true })

      // Pre-fetch nonce from reliable Fuji RPC
      const curNonce = await fujiRpc.getTransactionCount(account).catch(() => undefined)

      console.log('Initiating contract deployment via raw EIP-1193 eth_sendTransaction...')
      let txHash: string
      try {
        const rawTxParams: any = {
          from: account,
          data: AVAX_GUARD_BYTECODE,
          gas: '0x2625a0', // 2,500,000 gas in hex
        }
        if (curNonce !== undefined) {
          rawTxParams.nonce = '0x' + curNonce.toString(16)
        }
        txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [rawTxParams]
        })
      } catch (sendErr: any) {
        if (sendErr?.message?.includes('-32002') || sendErr?.code === -32002) {
          throw new Error('MetaMask RPC circuit-breaker tripped (-32002). Please switch your MetaMask Fuji RPC to https://avalanche-fuji-c-chain-rpc.publicnode.com or deploy via CLI.')
        }
        throw sendErr
      }

      console.log('Deployment tx submitted:', txHash)

      // Wait for receipt using direct Fuji RPC to bypass MetaMask polling
      let deployReceipt = await fujiRpc.waitForTransaction(txHash, 1, 45000)
      if (!deployReceipt) {
        deployReceipt = await fujiRpc.getTransactionReceipt(txHash)
      }
      if (!deployReceipt || deployReceipt.status !== 1) {
        throw new Error('Deployment transaction failed or reverted on Fuji.')
      }

      const txNonce = curNonce ?? (await fujiRpc.getTransactionCount(account)) - 1
      const newAddr = deployReceipt.contractAddress || ethers.getCreateAddress({ from: account, nonce: txNonce })

      // Verify eth_getCode != 0x
      const code = await fujiRpc.getCode(newAddr)
      if (code === '0x' || code.length <= 2) {
        throw new Error('Bytecode verification failed: eth_getCode returned 0x.')
      }

      setAvaxGuardAddress(newAddr)
      setContractAddr(newAddr)
      setIsContractDeployed(true)

      const deployLog = `
========================================
P0-DEPLOYMENT: DONE

Contract Address:
${newAddr}

Deployment Tx:
${txHash}

Chain ID:
43113

Block:
${deployReceipt.blockNumber}

Deployer:
${account}

Gas Used:
${deployReceipt.gasUsed.toString()}

Snowtrace:
https://testnet.snowtrace.io/address/${newAddr}

eth_getCode:
VERIFIED (${code.length} bytes)
========================================`
      console.log(deployLog)
      alert(`P0-DEPLOYMENT 部署成功！\n\n合约地址: ${newAddr}\n交易哈希: ${txHash}\nSnowtrace 浏览器: https://testnet.snowtrace.io/address/${newAddr}`)

      await loadPolicy()
      await refreshBalances()
    } catch (err: any) {
      console.error('Contract deployment failed:', err)
      const msg = err.message || String(err)
      setDeployError(msg)
      alert(`合约部署失败: ${msg}`)
    } finally {
      setIsDeployingContract(false)
    }
  }

  // Bind custom pre-deployed contract address
  const handleBindCustomContract = async (addr: string) => {
    try {
      const verified = validateAddressOrThrow(addr, 'CUSTOM_CONTRACT')
      const prov = provider || new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0])
      const code = await prov.getCode(verified)
      if (code === '0x' || code.length <= 2) {
        alert(`字节码验证失败：地址 ${verified} 上未检测到已部署的智能合约 (eth_getCode 为 0x)`)
        return
      }
      setAvaxGuardAddress(verified)
      setContractAddr(verified)
      setIsContractDeployed(true)
      await loadPolicy()
      await refreshBalances()
      alert(`成功绑定已验证的 AvaxGuard 合约: ${verified}`)
    } catch (e: any) {
      alert(`无效地址: ${e.message}`)
    }
  }

  // Human Action: Fund Agent Gas (0.005 AVAX)
  const handleFundAgent = async () => {
    if (!account || !provider) {
      alert('请先连接 MetaMask 钱包！')
      return
    }

    setIsFundingAgent(true)
    try {
      await assertFujiNetwork(provider)
      const fujiRpc = new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0], 43113, { staticNetwork: true })
      const feeData = await fujiRpc.getFeeData().catch(() => ({ gasPrice: 25000000000n }))
      const gasPriceHex = '0x' + ((feeData.gasPrice || 25000000000n) * 120n / 100n).toString(16)

      const txHash: string = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: agentWallet.address,
          value: '0x' + ethers.parseEther('0.005').toString(16),
          gas: '0x7530',
          gasPrice: gasPriceHex
        }]
      })
      await fujiRpc.waitForTransaction(txHash, 1, 30000)
      await refreshBalances()
      alert(`成功为 Agent 独立钱包充值 0.005 AVAX Gas: ${agentWallet.address}`)
    } catch (err: any) {
      console.error('Funding agent gas failed:', err)
      alert(`Gas 充值失败: ${err.message || err}`)
    } finally {
      setIsFundingAgent(false)
    }
  }

  // Reset Agent Scoped Wallet (New key for fresh policy lifecycle)
  const handleResetAgent = () => {
    const newW = createNewAgentWallet()
    setAgentWallet(newW)
    refreshBalances()
    setPolicy(null)
    setAgentAuthorized(false)
  }

  // Human Action: Create Policy
  const handleCreatePolicy = async (budget: string, maxTx: string, daily: string, durationSec: number) => {
    if (!account || !provider) {
      alert('请先连接钱包！')
      return
    }
    if (!isContractDeployed) {
      alert('链上状态未就绪：请先通过上方按钮部署 AvaxGuard 智能合约！')
      return
    }

    setIsCreatingPolicy(true)
    try {
      await assertFujiNetwork(provider)
      const fujiRpc = new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0], 43113, { staticNetwork: true })
      const feeData = await fujiRpc.getFeeData().catch(() => ({ gasPrice: 25000000000n }))
      const gasPriceHex = '0x' + ((feeData.gasPrice || 25000000000n) * 120n / 100n).toString(16)

      const budgetWei = ethers.parseEther(budget)
      const maxTxWei = ethers.parseEther(maxTx)
      const dailyWei = ethers.parseEther(daily)

      // Pre-check on-chain rule: One Agent = One Policy Lifecycle
      const contractCheck = new ethers.Contract(contractAddress, AVAX_GUARD_ABI, fujiRpc)
      const isAlreadyUsed = await contractCheck.agentEverBound(agentWallet.address).catch(() => false)
      if (isAlreadyUsed) {
        const newW = createNewAgentWallet()
        setAgentWallet(newW)
        alert(`安全规则触发：当前 Agent 此前已绑定过生效策略。\n\nAvaxGuard 严格执行 “一个 Agent = 一个策略生命周期 (One Agent = One Policy Lifecycle)” 护栏规则。\n\n系统已为您生成全新 Agent 钱包 (${newW.address})！\n\n请先点击 “充值 Agent Gas (0.005 AVAX)” 为其注入 Gas，然后再点击 “创建 Spending Policy”。`)
        setIsCreatingPolicy(false)
        return
      }

      const iface = new ethers.Interface(AVAX_GUARD_ABI)
      const callData = iface.encodeFunctionData('createPolicy', [
        agentWallet.address,
        DEMO_ADDRESSES.MERCHANT,
        maxTxWei,
        dailyWei,
        durationSec
      ])

      const txHash: string = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: contractAddress,
          data: callData,
          value: '0x' + budgetWei.toString(16),
          gas: '0x6ddd0', // 450,000 gas
          gasPrice: gasPriceHex
        }]
      })
      await fujiRpc.waitForTransaction(txHash, 1, 30000)

      await loadPolicy()
      await refreshBalances()
    } catch (err: any) {
      console.error('Failed to create policy:', err)
      alert(`创建策略失败: ${err.message || err}`)
    } finally {
      setIsCreatingPolicy(false)
    }
  }

  // Human Action: Revoke Policy
  const handleRevokePolicy = async () => {
    if (!account || !provider || !isContractDeployed) return
    setIsRevokingPolicy(true)
    try {
      await assertFujiNetwork(provider)
      const fujiRpc = new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0], 43113, { staticNetwork: true })
      const feeData = await fujiRpc.getFeeData().catch(() => ({ gasPrice: 25000000000n }))
      const gasPriceHex = '0x' + ((feeData.gasPrice || 25000000000n) * 120n / 100n).toString(16)

      const iface = new ethers.Interface(AVAX_GUARD_ABI)
      const callData = iface.encodeFunctionData('revokePolicy', [agentWallet.address])

      const txHash: string = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: contractAddress,
          data: callData,
          gas: '0x493e0', // 300,000 gas
          gasPrice: gasPriceHex
        }]
      })
      await fujiRpc.waitForTransaction(txHash, 1, 30000)

      await loadPolicy()
      await refreshBalances()
    } catch (err: any) {
      console.error('Failed to revoke policy:', err)
      alert(`撤销策略失败: ${err.message || err}`)
    } finally {
      setIsRevokingPolicy(false)
    }
  }

  // Emergency Revoke for the retired/compromised legacy agent (0x82fF...1A51)
  const handleRevokeCompromisedPolicy = async () => {
    if (!account || !provider || isRevokingCompromised) return
    setIsRevokingCompromised(true)
    try {
      await assertFujiNetwork(provider)
      const fujiRpc = new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0], 43113, { staticNetwork: true })
      const feeData = await fujiRpc.getFeeData().catch(() => ({ gasPrice: 25000000000n }))
      const gasPriceHex = '0x' + ((feeData.gasPrice || 25000000000n) * 120n / 100n).toString(16)

      const iface = new ethers.Interface(AVAX_GUARD_ABI)
      const callData = iface.encodeFunctionData('revokePolicy', ['0x82fF1466015f208dB33e4E198e529b03f6fa1A51'])

      const txHash: string = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: contractAddress,
          data: callData,
          gas: '0x493e0', // 300,000 gas
          gasPrice: gasPriceHex
        }]
      })
      await fujiRpc.waitForTransaction(txHash, 1, 30000)

      alert(`✅ 废弃受损 Agent 策略已成功撤销！\n交易哈希: ${txHash}\n剩余 0.018 AVAX 预算已返还至您的钱包。`)
      setHasCompromisedPolicy(false)
      await loadPolicy()
      await refreshBalances()
    } catch (err: any) {
      console.error('Failed to revoke compromised policy:', err)
      alert(`撤销失败: ${err.message || err}`)
    } finally {
      setIsRevokingCompromised(false)
    }
  }

  // Async Timeout Helper (Requirement 25: No infinite loading)
  function withTimeout<T>(promise: Promise<T>, ms: number, stepName: string): Promise<T> {
    let timer: any
    const timeoutPromise = new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`${stepName} 超时 (${ms / 1000}s) - 网络延迟过高或 RPC 无响应`))
      }, ms)
    })
    return Promise.race([
      promise.then((res) => {
        clearTimeout(timer)
        return res
      }),
      timeoutPromise
    ])
  }

  // Pre-flight Demo Readiness Verification (Requirement 27 & 28)
  const demoReadiness = useMemo(() => {
    if (!account) {
      return { ready: false, reason: '请先连接 MetaMask 钱包' }
    }
    if (!isContractDeployed || !contractAddress) {
      return { ready: false, reason: 'AvaFence 合约未就绪' }
    }
    if (!policy || !policy.active) {
      return { ready: false, reason: '当前无活跃 Policy，请先在右侧创建' }
    }
    if (Date.now() / 1000 > policy.expiry) {
      return { ready: false, reason: 'Policy 已过期，请在右侧重新创建' }
    }
    if (parseFloat(agentBalance || '0') < 0.002) {
      return { ready: false, reason: 'Agent 钱包 Gas 不足 (需 >= 0.002 AVAX)' }
    }
    if (parseFloat(policy.remainingBudget || '0') < 0.002) {
      return { ready: false, reason: 'Policy 剩余预算不足 (需 >= 0.002 AVAX)' }
    }
    const dailyRemaining = parseFloat(policy.dailyLimit || '0') - parseFloat(policy.dailySpent || '0')
    if (dailyRemaining < 0.001) {
      return { ready: false, reason: '单日限额已耗尽，请创建新 Policy' }
    }
    return { ready: true, reason: 'Fuji 链上状态已验证就绪' }
  }, [account, isContractDeployed, contractAddress, policy, agentBalance])

  // Scenario Selection Handler with Immediate State Reset (Item 1: Scene Isolation)
  const handleSelectScenario = (scenario: DemoScenario) => {
    if (isExecuting) return
    setCurrentExecution(createInitialExecution(scenario))
  }

  // Autonomous AI Agent Trigger: 100% Real Fuji C-Chain Execution with Choreographed Staging
  const handleTriggerExecution = async () => {
    if (isExecuting) return
    if (!demoReadiness.ready) {
      alert(`无法运行 Demo: ${demoReadiness.reason}`)
      return
    }

    const scenario = currentExecution.scenario
    const curNonce = localNonce
    setLocalNonce((prev) => prev + 1)

    const intent = createInitialSpendIntent(scenario, curNonce)
    const execId = `exec_${scenario}_${curNonce}`

    // 1. Stage: PREPARING
    setCurrentExecution((prev) => ({
      ...prev,
      executionId: execId,
      stage: 'PREPARING',
      requestId: intent.requestId,
      spendIntent: intent,
      revealStep: -1,
      checksPassed: null,
      previewVerdict: null,
      verdict: null,
      blockReason: null,
      verdictMismatch: false,
      networkStatus: 'READY',
      txHash: null,
      blockNumber: null,
      gasUsed: null,
      acceptanceLatencyMs: null,
      merchantResult: null,
      errorMessage: null,
      errorStage: null,
      executionLogs: [`[${new Date().toLocaleTimeString()}] 🤖 Agent 接收任务并构建支出意图 (${scenario === 'A' ? '正常采购' : scenario === 'B' ? '超额采购' : '受外部诱导'})`]
    }))

    const log = (msg: string) => {
      setCurrentExecution((prev) => ({
        ...prev,
        executionLogs: [...prev.executionLogs, msg]
      }))
    }

    await new Promise((r) => setTimeout(r, 200))

    try {
      const amountWei = ethers.parseEther(intent.amount)
      log(`[意图声明] 目标服务: ${intent.serviceName}`)
      log(`[意图声明] 收款方: ${intent.merchantAlias} (${intent.merchant.slice(0, 6)}...${intent.merchant.slice(-4)})`)
      log(`[意图声明] 申请金额: ${intent.amount} AVAX | Request ID: ${intent.requestId.slice(0, 10)}...${intent.requestId.slice(-6)}`)

      // 2. Stage: POLICY_EVALUATING (Real on-chain evaluateSpend called ONCE - Requirement 1)
      setCurrentExecution((prev) => ({
        ...prev,
        stage: 'POLICY_EVALUATING',
        networkStatus: 'READY'
      }))
      log('🔍 调用 Fuji 链上 AvaFence.evaluateSpend() 静态只读预检 (单次调用)...')

      const fujiProvider = new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0], 43113, { staticNetwork: true })
      await assertFujiNetwork(fujiProvider)
      const guardContract = new ethers.Contract(contractAddress, AVAX_GUARD_ABI, fujiProvider)

      const evalRes = await withTimeout(
        guardContract.evaluateSpend(
          account,
          agentWallet.address,
          intent.merchant,
          amountWei,
          intent.requestId
        ),
        10000,
        'Policy RPC (链上预检)'
      )

      const onChainAllowed = evalRes[0] as boolean
      const onChainReason = Number(evalRes[1]) as BlockReason
      const onChainBits = Number(evalRes[2])

      log(`[策略引擎] 链上预检结果返回: allowed=${onChainAllowed}, reason=${onChainReason}, bitmask=0b${onChainBits.toString(2).padStart(7, '0')}`)

      // 3. Stage: POLICY_VISUALIZING (Sequential Reveal Choreography - Requirement 2 & 3)
      let firstFail = -1
      if (!agentAuthorized) {
        firstFail = 0
      } else {
        for (let bit = 0; bit < 7; bit++) {
          if ((onChainBits & (1 << bit)) === 0) {
            firstFail = bit + 1
            break
          }
        }
      }

      setCurrentExecution((prev) => ({
        ...prev,
        stage: 'POLICY_VISUALIZING',
        checksPassed: onChainBits,
        previewVerdict: onChainReason,
        networkStatus: 'READY'
      }))

      // Sequential visual reveal promise (0.8s - 1.2s total)
      const revealPromise = (async () => {
        for (let step = 0; step <= 7; step++) {
          setCurrentExecution((prev) => ({ ...prev, revealStep: step }))
          await new Promise((r) => setTimeout(r, 120))
          if (firstFail !== -1 && step === firstFail) {
            // First failing check reached! Subsequent checks immediately become SKIPPED
            await new Promise((r) => setTimeout(r, 140))
            break
          }
        }
      })()

      // 4. In Parallel: Autonomous Execution on Avalanche Fuji (No artificial delay - Requirement 14)
      const txPromise: Promise<{ txHash: string; receipt: any; acceptedRes: any; latency: number }> = (async () => {
        log('⚡ Agent 使用独立钱包私钥签署 attemptSpend 并广播至 Avalanche Fuji C-Chain...')
        const agentSigner = agentWallet.connect(fujiProvider)
        const agentContract = new ethers.Contract(contractAddress, AVAX_GUARD_ABI, agentSigner)

        const t0 = performance.now()
        const tx = await withTimeout(
          agentContract.attemptSpend(intent.merchant, amountWei, intent.requestId),
          20000,
          'Tx Submission (广播交易)'
        )
        const txHash = tx.hash
        log(`📝 交易已广播: ${txHash.slice(0, 18)}...`)

        // Update broadcast status
        setCurrentExecution((prev) => ({
          ...prev,
          txHash,
          networkStatus: 'BROADCAST'
        }))

        // Wait for acceptance on Avalanche (WSS / receipt polling)
        const waitPromise = monitor.waitForAccepted(txHash, t0, fujiProvider, 30000)
        const receipt: any = await withTimeout(tx.wait(), 30000, 'Tx Receipt (等待出块)')
        const acceptedRes = await waitPromise
        const latency = acceptedRes.latencyMs
        log(`🏁 Avalanche 区块 #${receipt.blockNumber} 确认完成 (Observed Acceptance: ${latency} ms，来源: ${acceptedRes.source})`)

        return { txHash, receipt, acceptedRes, latency }
      })()

      // Wait for UI reveal to finish first (Requirement 15: even if tx finishes faster, let reveal complete gracefully)
      await revealPromise

      // Update to WAITING_ACCEPTANCE if tx is still in-flight (Requirement 16)
      setCurrentExecution((prev) => ({
        ...prev,
        stage: 'WAITING_ACCEPTANCE',
        networkStatus: prev.txHash ? 'BROADCAST' : 'SUBMITTING'
      }))

      // Await real tx results with timeout
      const { txHash, receipt, acceptedRes, latency } = await txPromise

      // 5. Parse Receipt Logs for PaymentExecuted / PaymentBlocked
      let isExecuted = false
      let isBlocked = false
      let blockReasonParsed: BlockReason = BlockReason.NONE

      const iface = new ethers.Interface(AVAX_GUARD_ABI)
      for (const logItem of receipt.logs) {
        if (logItem.address.toLowerCase() === contractAddress.toLowerCase()) {
          try {
            const parsed = iface.parseLog({
              topics: logItem.topics as string[],
              data: logItem.data
            })
            if (parsed?.name === 'PaymentExecuted') {
              isExecuted = true
            } else if (parsed?.name === 'PaymentBlocked') {
              isBlocked = true
              blockReasonParsed = Number(parsed.args[5]) as BlockReason
            }
          } catch {}
        }
      }

      // Requirement 5: Check for Verdict Mismatch
      const previewAllowed = (onChainReason === BlockReason.NONE)
      const receiptAllowed = isExecuted && !isBlocked
      if (previewAllowed !== receiptAllowed) {
        log(`❌ 判定冲突: 预检预览 (Preview: ${previewAllowed ? 'ALLOW' : 'BLOCK'}) 与链上收据事件 (${isExecuted ? 'PaymentExecuted' : 'PaymentBlocked'}) 不一致!`)
        setCurrentExecution((prev) => ({
          ...prev,
          stage: 'EXECUTION_ERROR',
          errorMessage: 'VERDICT MISMATCH · DEMO HALTED (链上预检与实际执行事件不一致)',
          verdictMismatch: true,
          networkStatus: 'ERROR'
        }))
        return
      }

      const realGasUsed = receipt.gasUsed.toString()
      const effectiveGasPrice = receipt.gasPrice || 25000000000n
      const realGasCostEth = ethers.formatEther(receipt.gasUsed * effectiveGasPrice)
      const finalVerdict = isExecuted ? BlockReason.NONE : blockReasonParsed

      // 6. Stage: TX_ACCEPTED (Confirmed only from Receipt Event - Requirement 5)
      setCurrentExecution((prev) => ({
        ...prev,
        stage: 'TX_ACCEPTED',
        txHash,
        blockNumber: receipt.blockNumber,
        gasUsed: Number(realGasUsed).toLocaleString(),
        acceptanceLatencyMs: latency,
        latencySource: acceptedRes.source,
        networkStatus: 'ACCEPTED',
        networkGasCost: `~${parseFloat(realGasCostEth).toFixed(5)} AVAX`,
        verdict: finalVerdict,
        blockReason: finalVerdict
      }))

      if (isExecuted) {
        // APPROVED BRANCH (Scene A)
        log('📡 正在将 PaymentExecuted 链上收据提交至商户 API 进行核验...')
        setCurrentExecution((prev) => ({ ...prev, stage: 'MERCHANT_VERIFYING' }))

        const merchantRes = await withTimeout(
          merchantService.verifyAndFulfill(
            txHash,
            intent.requestId,
            agentWallet.address,
            amountWei,
            fujiProvider,
            contractAddress
          ),
          10000,
          'Merchant Verification (商户服务核验)'
        )

        if (merchantRes.success) {
          log(`✅ 商户端核验通过: ${merchantRes.message}`)
          log('📊 Agent 成功接收验证后的付费高价值数据集。')

          setCurrentExecution((prev) => ({ ...prev, stage: 'SERVICE_RELEASED' }))
          await new Promise((r) => setTimeout(r, 300))

          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#ef4444', '#10b981', '#ffffff']
          })

          setCurrentExecution((prev) => ({
            ...prev,
            stage: 'TASK_COMPLETED',
            merchantResult: merchantRes
          }))

          setAuditLogs((prev) => [
            {
              id: 'audit-' + Date.now(),
              timestamp: new Date().toLocaleTimeString(),
              type: 'EXECUTED',
              agent: agentWallet.address,
              recipient: intent.merchant,
              recipientAlias: intent.merchantAlias,
              amount: intent.amount,
              requestId: intent.requestId,
              reason: BlockReason.NONE,
              txHash,
              latencyMs: latency,
              sceneType: intent.sceneType
            },
            ...prev
          ])
        } else {
          log(`❌ 商户端核验失败: ${merchantRes.message}`)
          setCurrentExecution((prev) => ({
            ...prev,
            stage: 'EXECUTION_ERROR',
            errorMessage: `商户核验失败: ${merchantRes.message}`,
            networkStatus: 'ERROR'
          }))
        }
      } else if (isBlocked) {
        // BLOCKED BRANCH (Scene B & C)
        log(`🛡️ SPENDING BLOCKED BY AVAFENCE: 拦截原因 = ${BLOCK_REASON_TEXT[finalVerdict]?.label || finalVerdict}`)
        log(`🔒 0 非授权资金损失：人类委托的本金受到 100% 链上保护。`)

        setCurrentExecution((prev) => ({
          ...prev,
          stage: 'BLOCKED_COMPLETED'
        }))

        setAuditLogs((prev) => [
          {
            id: 'audit-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            type: 'BLOCKED',
            agent: agentWallet.address,
            recipient: intent.merchant,
            recipientAlias: intent.merchantAlias,
            amount: intent.amount,
            requestId: intent.requestId,
            reason: finalVerdict,
            txHash,
            latencyMs: latency,
            sceneType: intent.sceneType
          },
          ...prev
        ])
      }

      await loadPolicy()
      await refreshBalances()
    } catch (err: any) {
      console.error('Execution error:', err)
      const errMsg = err?.message || String(err)
      log(`❌ 执行异常: ${errMsg}`)
      setCurrentExecution((prev) => ({
        ...prev,
        stage: 'EXECUTION_ERROR',
        errorMessage: errMsg,
        networkStatus: 'ERROR'
      }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-red-500 selection:text-white">
      <Navbar
        account={account}
        chainId={chainId}
        balance={balance}
        isConnecting={isConnecting}
        onConnect={connectWallet}
        onOpenFaucet={() => setIsFaucetOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 space-y-4">
        <Hero />

        {/* Main Stage (64%) & AvaFence Guard Panel (36%) */}
        <div className="grid grid-cols-1 lg:grid-cols-[64fr_36fr] gap-4 sm:gap-5 items-start">
          {/* Main Stage: 64% Agent Mission & Workspace */}
          <div className="w-full">
            <AgentWorkspace
              currentExecution={currentExecution}
              isExecuting={isExecuting}
              demoReadiness={demoReadiness}
              onSelectScenario={handleSelectScenario}
              onTriggerExecution={handleTriggerExecution}
            />
          </div>

          {/* Right Guard Panel: 36% AvaFence Financial Permission Layer */}
          <div className="w-full">
            <AvaxGuardPanel
              currentExecution={currentExecution}
              policy={policy}
              account={account}
              contractAddress={contractAddress}
              isContractDeployed={isContractDeployed}
              isDeployingContract={isDeployingContract}
              deployError={deployError}
              hasCompromisedPolicy={hasCompromisedPolicy}
              isRevokingCompromised={isRevokingCompromised}
              agentAddress={agentWallet.address}
              agentBalance={agentBalance}
              isFundingAgent={isFundingAgent}
              onFundAgent={handleFundAgent}
              isCreatingPolicy={isCreatingPolicy}
              isRevokingPolicy={isRevokingPolicy}
              agentAuthorized={agentAuthorized}
              onDeployContract={handleDeployContract}
              onBindCustomContract={handleBindCustomContract}
              onRevokeCompromisedPolicy={handleRevokeCompromisedPolicy}
              onCreatePolicy={handleCreatePolicy}
              onRevokePolicy={handleRevokePolicy}
              onResetAgent={handleResetAgent}
            />
          </div>
        </div>

        {/* Bottom Full-Width On-Chain Evidence */}
        <AuditLog logs={auditLogs} />
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        AvaFence • 面向自主 AI Agent 的链上资金权限边界 • Built on Avalanche Fuji C-Chain
      </footer>

      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
        account={account}
      />
    </div>
  )
}

export default App

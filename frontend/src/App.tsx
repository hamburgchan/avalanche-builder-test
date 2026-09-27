import { useState, useEffect, useCallback, useMemo } from 'react'
import { ethers } from 'ethers'
import confetti from 'canvas-confetti'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { DeveloperIntegrationPreview } from './components/DeveloperIntegrationPreview'
import { CurrentVsPlanned } from './components/CurrentVsPlanned'
import { DemoSetupProgress } from './components/DemoSetupProgress'
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
  assertBrowserSigningAllowed,
  validateAddressOrThrow,
  switchToFuji
} from './config/avalanche'
import {
  getOrCreateAgentWallet,
  createNewAgentWallet,
  connectAgentSignerSafely
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
  const [isPreparingDemo, setIsPreparingDemo] = useState<boolean>(false)
  const [demoMode, setDemoMode] = useState<'instant' | 'live'>('instant')

  // Contract deployment state
  const [contractAddress, setContractAddr] = useState<string>(getAvaxGuardAddress())
  const [isContractDeployed, setIsContractDeployed] = useState<boolean>(true)
  const [isDeployingContract, setIsDeployingContract] = useState<boolean>(false)
  const [deployError, setDeployError] = useState<string | null>(null)
  const [hasCompromisedPolicy, setHasCompromisedPolicy] = useState<boolean>(false)
  const [isRevokingCompromised, setIsRevokingCompromised] = useState<boolean>(false)

  // Agent Scoped Wallet state (Lazy Initialization — not created on startup or during instant simulation)
  const [agentWallet, setAgentWallet] = useState<ethers.Wallet | null>(null)
  const [agentBalance, setAgentBalance] = useState<string>('0')
  const [isFundingAgent, setIsFundingAgent] = useState<boolean>(false)

  // Lazy Agent Scoped Wallet initializer: only called when user enters Live mode or Guided Setup
  const ensureAgentWallet = useCallback((): ethers.Wallet => {
    if (agentWallet) return agentWallet
    const wallet = getOrCreateAgentWallet()
    setAgentWallet(wallet)
    return wallet
  }, [agentWallet])

  // Policy & Guard state
  const [policy, setPolicy] = useState<PolicyState | null>(null)
  const [isCreatingPolicy, setIsCreatingPolicy] = useState<boolean>(false)
  const [isRevokingPolicy, setIsRevokingPolicy] = useState<boolean>(false)
  const [agentAuthorized, setAgentAuthorized] = useState<boolean>(false)

  // Local nonce for guaranteed unique on-chain request IDs
  const [localNonce, setLocalNonce] = useState<number>(() => Date.now() % 1000000)

  // Unified Demo Execution State Machine (Initial Scenario A)
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

  // Persist audit logs to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('AVAX_GUARD_AUDIT_LOGS', JSON.stringify(auditLogs))
      } catch (e) {
        console.warn('Failed to save audit logs to localStorage:', e)
      }
    }
  }, [auditLogs])

  // Init WSS monitor once
  useEffect(() => {
    monitor.init()
  }, [])

  // Direct static read-only Fuji RPC provider (Bypasses MetaMask for all queries)
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
      alert('未检测到 Web3 钱包，请安装 MetaMask 或 Core 扩展插件！')
      return
    }

    setIsConnecting(true)
    try {
      const browserProvider = new ethers.BrowserProvider(ethereum)
      const accounts = await browserProvider.send('eth_requestAccounts', [])
      if (accounts.length > 0) {
        const checksummed = ethers.getAddress(accounts[0])
        setAccount(checksummed)
        setProvider(browserProvider)

        const network = await browserProvider.getNetwork()
        setChainId(Number(network.chainId))

        if (Number(network.chainId) !== 43113) {
          await switchToFuji()
          const updatedNet = await browserProvider.getNetwork()
          setChainId(Number(updatedNet.chainId))
        }

        const bal = await browserProvider.getBalance(checksummed)
        setBalance(ethers.formatEther(bal))
      }
    } catch (err: any) {
      console.error('Connect wallet failed:', err)
      alert(`连接钱包失败: ${err.message || err}`)
    } finally {
      setIsConnecting(false)
    }
  }

  // Listen to chain/account changes
  useEffect(() => {
    const ethereum = (window as any).ethereum
    if (!ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null)
        setBalance('0')
        setPolicy(null)
        setAgentAuthorized(false)
      } else {
        const checksummed = ethers.getAddress(accounts[0])
        setAccount(checksummed)
        refreshBalances()
        loadPolicy()
      }
    }

    const handleChainChanged = (hexChain: string) => {
      const cId = parseInt(hexChain, 16)
      setChainId(cId)
      if (cId !== 43113) {
        switchToFuji().catch(console.error)
      }
      refreshBalances()
      loadPolicy()
    }

    ethereum.on('accountsChanged', handleAccountsChanged)
    ethereum.on('chainChanged', handleChainChanged)

    ethereum.request({ method: 'eth_accounts' }).then((accs: string[]) => {
      if (accs.length > 0) {
        const checksummed = ethers.getAddress(accs[0])
        setAccount(checksummed)
        setProvider(new ethers.BrowserProvider(ethereum))
        ethereum.request({ method: 'eth_chainId' }).then((hexCId: string) => {
          setChainId(parseInt(hexCId, 16))
        })
      }
    }).catch(console.error)

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged)
      ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [loadPolicy, refreshBalances])

  // Contract deployment handler
  const handleDeployContract = async () => {
    if (!account || !provider) {
      alert('请先连接 MetaMask 钱包！')
      return
    }

    setIsDeployingContract(true)
    setDeployError(null)

    try {
      await assertFujiNetwork(provider)
      const signer = await provider.getSigner()

      const factory = new ethers.ContractFactory(
        AVAX_GUARD_ABI,
        AVAX_GUARD_BYTECODE,
        signer
      )

      const feeData = await fujiReadOnlyRpc.getFeeData().catch(() => ({ gasPrice: 25000000000n }))
      const gasPrice = (feeData.gasPrice || 25000000000n) * 120n / 100n

      const deployedContract = await factory.deploy({
        gasLimit: 3000000,
        gasPrice
      })

      const txHash = deployedContract.deploymentTransaction()?.hash || '0x'
      await deployedContract.deploymentTransaction()?.wait(1)

      const newAddr = await deployedContract.getAddress()

      setAvaxGuardAddress(newAddr)
      setContractAddr(newAddr)
      setIsContractDeployed(true)

      alert(`AvaFence 智能合约部署成功！\n\n合约地址: ${newAddr}\n交易哈希: ${txHash}\nSnowtrace 浏览器: https://testnet.snowtrace.io/address/${newAddr}`)

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
      alert(`成功绑定已验证的 AvaFence 合约: ${verified}`)
    } catch (e: any) {
      alert(`无效地址: ${e.message}`)
    }
  }

  // Fund Agent Gas (0.005 AVAX)
  const handleFundAgent = async () => {
    if (!account || !provider) {
      alert('请先连接 MetaMask 钱包！')
      return
    }

    const currentAgent = ensureAgentWallet()
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
          to: currentAgent.address,
          value: '0x' + ethers.parseEther('0.005').toString(16),
          gas: '0x7530',
          gasPrice: gasPriceHex
        }]
      })
      await fujiRpc.waitForTransaction(txHash, 1, 30000)
      await refreshBalances()
      alert(`成功为 Agent 独立钱包充值 0.005 AVAX Gas: ${currentAgent.address}`)
    } catch (err: any) {
      console.error('Funding agent gas failed:', err)
      alert(`Gas 充值失败: ${err.message || err}`)
    } finally {
      setIsFundingAgent(false)
    }
  }

  // Reset Agent Scoped Wallet
  const handleResetAgent = () => {
    const newW = createNewAgentWallet()
    setAgentWallet(newW)
    refreshBalances()
    setPolicy(null)
    setAgentAuthorized(false)
  }

  // Create Policy
  const handleCreatePolicy = async (budget: string, maxTx: string, daily: string, durationSec: number) => {
    if (!account || !provider) {
      alert('请先连接钱包！')
      return
    }
    if (!isContractDeployed) {
      alert('链上状态未就绪：请先部署 AvaFence 智能合约！')
      return
    }

    const currentAgent = ensureAgentWallet()
    setIsCreatingPolicy(true)
    try {
      await assertFujiNetwork(provider)
      const fujiRpc = new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0], 43113, { staticNetwork: true })
      const feeData = await fujiRpc.getFeeData().catch(() => ({ gasPrice: 25000000000n }))
      const gasPriceHex = '0x' + ((feeData.gasPrice || 25000000000n) * 120n / 100n).toString(16)

      const budgetWei = ethers.parseEther(budget)
      const maxTxWei = ethers.parseEther(maxTx)
      const dailyWei = ethers.parseEther(daily)

      const contractCheck = new ethers.Contract(contractAddress, AVAX_GUARD_ABI, fujiRpc)
      const isAlreadyUsed = await contractCheck.agentEverBound(currentAgent.address).catch(() => false)
      if (isAlreadyUsed) {
        const newW = createNewAgentWallet()
        setAgentWallet(newW)
        alert(`安全规则触发：当前 Agent 此前已绑定过生效策略。\n\nAvaFence 严格执行 “一个 Agent = 一个策略生命周期” 规则。\n\n系统已为您生成全新 Agent 钱包 (${newW.address})！\n\n请先点击 “充值 Agent Gas (0.005 AVAX)” 为其注入 Gas，然后再创建 Spending Policy。`)
        setIsCreatingPolicy(false)
        return
      }

      const iface = new ethers.Interface(AVAX_GUARD_ABI)
      const callData = iface.encodeFunctionData('createPolicy', [
        currentAgent.address,
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

  // Revoke Policy
  const handleRevokePolicy = async () => {
    if (!account || !provider || !isContractDeployed) return
    const currentAgent = ensureAgentWallet()
    setIsRevokingPolicy(true)
    try {
      await assertFujiNetwork(provider)
      const fujiRpc = new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0], 43113, { staticNetwork: true })
      const feeData = await fujiRpc.getFeeData().catch(() => ({ gasPrice: 25000000000n }))
      const gasPriceHex = '0x' + ((feeData.gasPrice || 25000000000n) * 120n / 100n).toString(16)

      const iface = new ethers.Interface(AVAX_GUARD_ABI)
      const callData = iface.encodeFunctionData('revokePolicy', [currentAgent.address])

      const txHash: string = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: contractAddress,
          data: callData,
          gas: '0x493e0',
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

  // Revoke Compromised Legacy Policy
  const handleRevokeCompromisedPolicy = async () => {
    if (!account || !provider || !isContractDeployed) return
    const RETIRED_LEAKED_AGENT = '0x82fF1466015f208dB33e4E198e529b03f6fa1A51'
    setIsRevokingCompromised(true)
    try {
      await assertFujiNetwork(provider)
      const fujiRpc = new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0], 43113, { staticNetwork: true })
      const feeData = await fujiRpc.getFeeData().catch(() => ({ gasPrice: 25000000000n }))
      const gasPriceHex = '0x' + ((feeData.gasPrice || 25000000000n) * 120n / 100n).toString(16)

      const iface = new ethers.Interface(AVAX_GUARD_ABI)
      const callData = iface.encodeFunctionData('revokePolicy', [RETIRED_LEAKED_AGENT])

      const txHash: string = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: contractAddress,
          data: callData,
          gas: '0x493e0',
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

  // Async Timeout Helper
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

  // Pre-flight Demo Readiness Verification
  const demoReadiness = useMemo(() => {
    if (demoMode === 'instant') {
      return { ready: true, reason: 'Instant Simulation Ready (Zero Setup Required)' }
    }
    if (!account) {
      return { ready: false, reason: '请先连接 MetaMask 钱包' }
    }
    if (chainId !== 43113) {
      return { ready: false, reason: '请切换至 Avalanche Fuji 测试网 (43113)' }
    }
    if (!isContractDeployed || !contractAddress) {
      return { ready: false, reason: 'AvaFence 合约未就绪' }
    }
    if (!policy || !policy.active) {
      return { ready: false, reason: '当前无活跃 Policy，请先创建策略' }
    }
    if (Date.now() / 1000 > policy.expiry) {
      return { ready: false, reason: 'Policy 已过期，请重新创建' }
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
  }, [demoMode, account, chainId, isContractDeployed, contractAddress, policy, agentBalance])

  // Guided Prepare Demo Handler (P0-3)
  const handlePrepareDemo = async () => {
    ensureAgentWallet()
    setIsPreparingDemo(true)
    try {
      if (!account) {
        await connectWallet()
        return
      }
      if (chainId !== 43113) {
        await switchToFuji()
        return
      }
      if (parseFloat(balance || '0') < 0.01) {
        setIsFaucetOpen(true)
        alert('您的 Fuji 钱包余额不足以支付 Gas 与创建策略。请通过弹出的水龙头窗口领取免费测试 AVAX。')
        return
      }
      if (!policy || !policy.active || Date.now() / 1000 > policy.expiry) {
        alert('正在为您在 Fuji 链上创建演示策略 (0.02 AVAX 总预算, 0.003 AVAX 单笔限额, 有效期 1 小时)...')
        await handleCreatePolicy('0.02', '0.003', '0.01', 3600)
        return
      }
      if (parseFloat(agentBalance || '0') < 0.002) {
        alert('正在为 Agent 独立签名钱包注入 0.005 AVAX 交易 Gas...')
        await handleFundAgent()
        return
      }
      alert('演示环境已 100% 准备就绪！请在下方选择场景 A、B 或 C 并点击执行。')
    } catch (err: any) {
      console.error('Prepare demo failed:', err)
      alert(`环境准备步骤中断: ${err.message || err}`)
    } finally {
      setIsPreparingDemo(false)
    }
  }

  // Scenario Selection Handler with Immediate State Reset
  const handleSelectScenario = (scenario: DemoScenario) => {
    if (isExecuting) return
    setCurrentExecution(createInitialExecution(scenario))
  }

  // Instant Simulation Handler (Interactive Simulation — no transaction is broadcast)
  const handleTriggerSimulation = async () => {
    if (isExecuting) return

    const scenario = currentExecution.scenario
    const curNonce = localNonce
    setLocalNonce((prev) => prev + 1)

    const intent = createInitialSpendIntent(scenario, curNonce)
    const execId = `sim_${scenario}_${curNonce}`

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
      transferredAmount: '0 AVAX',
      plainReason: '',
      networkStatus: 'READY',
      txHash: null,
      blockNumber: null,
      gasUsed: null,
      acceptanceLatencyMs: null,
      networkGasCost: null,
      merchantResult: null,
      errorMessage: null,
      errorStage: null,
      executionLogs: []
    }))

    const log = (msg: string) => {
      console.log(`[Simulation Stage] ${msg}`)
      setCurrentExecution((prev) => ({
        ...prev,
        executionLogs: [...prev.executionLogs, msg]
      }))
    }

    await new Promise((r) => setTimeout(r, 150))

    log(`[意图声明] 目标资源: ${intent.serviceName}`)
    log(`[意图声明] 收款方: ${intent.recipientAlias} (${intent.recipient.slice(0, 6)}...${intent.recipient.slice(-4)})`)
    log(`[意图声明] 申请金额: ${intent.amount} AVAX | Request ID: ${intent.requestId.slice(0, 10)}...${intent.requestId.slice(-6)}`)

    // 2. Stage: POLICY_EVALUATING
    setCurrentExecution((prev) => ({
      ...prev,
      stage: 'POLICY_EVALUATING',
      networkStatus: 'READY'
    }))
    log('🔍 执行 AvaFence 策略评估 (模拟沙盒)...')

    await new Promise((r) => setTimeout(r, 200))

    let checksPassed = 127
    let previewReason: BlockReason = BlockReason.NONE
    let firstFail = -1

    if (scenario === 'A') {
      checksPassed = 127 // All 7 checks pass (0b1111111)
      previewReason = BlockReason.NONE
      firstFail = -1
    } else if (scenario === 'B') {
      checksPassed = 7 // Bits 0, 1, 2 pass (0b0000111 = 7); Bit 3 (Merchant Allowed) fails
      previewReason = BlockReason.MERCHANT_NOT_ALLOWED
      firstFail = 4 // Check 4: Recipient Authorized
    } else if (scenario === 'C') {
      checksPassed = 15 // Bits 0, 1, 2, 3 pass (0b0001111 = 15); Bit 4 (Per-Tx Limit) fails
      previewReason = BlockReason.PER_TX_LIMIT_EXCEEDED
      firstFail = 5 // Check 5: Per Tx Limit Check
    }

    log(`[策略引擎] 判定结果: allowed=${previewReason === BlockReason.NONE}, reason=${previewReason}, bitmask=0b${checksPassed.toString(2).padStart(7, '0')}`)

    // 3. Stage: POLICY_VISUALIZING
    setCurrentExecution((prev) => ({
      ...prev,
      stage: 'POLICY_VISUALIZING',
      checksPassed,
      previewVerdict: previewReason,
      networkStatus: 'READY'
    }))

    for (let step = 0; step <= 7; step++) {
      setCurrentExecution((prev) => ({ ...prev, revealStep: step }))
      await new Promise((r) => setTimeout(r, 80))
      if (firstFail !== -1 && step === firstFail) {
        await new Promise((r) => setTimeout(r, 120))
        break
      }
    }

    // 4. Stage: SIMULATION_COMPLETED (No transaction broadcast, zero fake telemetry)
    if (scenario === 'A') {
      log('📊 [模拟] AvaFence 策略评估通过: 满足单笔限额、白名单与有效预算。')
      log('ℹ️ [模拟说明] 本地交互仿真 — 未向 Avalanche 网络广播真实交易。')

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#10b981', '#ffffff']
      })

      setCurrentExecution((prev) => ({
        ...prev,
        stage: 'TASK_COMPLETED',
        txHash: null,
        blockNumber: null,
        gasUsed: null,
        acceptanceLatencyMs: null,
        latencySource: undefined,
        networkStatus: 'READY',
        networkGasCost: null,
        verdict: BlockReason.NONE,
        blockReason: BlockReason.NONE,
        transferredAmount: `${intent.amount} AVAX`,
        plainReason: 'Payment authorized: within 0.003 AVAX per-tx limit and recipient is authorized.'
      }))
    } else {
      const isB = scenario === 'B'
      const blockReason = isB ? BlockReason.MERCHANT_NOT_ALLOWED : BlockReason.PER_TX_LIMIT_EXCEEDED
      const naturalReason = isB
        ? 'Recipient is not authorized by policy.'
        : 'Per-transaction limit of 0.003 AVAX exceeded.'

      log(`🛡️ [模拟] AvaFence 策略熔断拦截: 原因 = ${BLOCK_REASON_TEXT[blockReason]?.label || (isB ? 'recipient not authorized' : 'per-tx limit exceeded')}`)
      log('ℹ️ [模拟说明] 仿真拦截 — 未广播交易，消耗 0 网络 Gas，0 AVAX 划转。')

      setCurrentExecution((prev) => ({
        ...prev,
        stage: 'BLOCKED_COMPLETED',
        txHash: null,
        blockNumber: null,
        gasUsed: null,
        acceptanceLatencyMs: null,
        latencySource: undefined,
        networkStatus: 'READY',
        networkGasCost: null,
        verdict: blockReason,
        blockReason,
        transferredAmount: '0 AVAX',
        plainReason: naturalReason
      }))
    }
  }

  // Autonomous AI Agent Trigger: Real Fuji C-Chain Execution or Instant Simulation
  const handleTriggerExecution = async () => {
    if (isExecuting) return

    if (demoMode === 'instant') {
      await handleTriggerSimulation()
      return
    }

    if (!demoReadiness.ready) {
      alert(`无法运行 Demo: ${demoReadiness.reason}`)
      return
    }

    const activeAgentWallet = ensureAgentWallet()

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
      transferredAmount: '0 AVAX',
      plainReason: '',
      networkStatus: 'READY',
      txHash: null,
      blockNumber: null,
      gasUsed: null,
      acceptanceLatencyMs: null,
      networkGasCost: null,
      merchantResult: null,
      errorMessage: null,
      errorStage: null,
      executionLogs: []
    }))

    const log = (msg: string) => {
      console.log(`[AvaFence Stage] ${msg}`)
      setCurrentExecution((prev) => ({
        ...prev,
        executionLogs: [...prev.executionLogs, msg]
      }))
    }

    await new Promise((r) => setTimeout(r, 200))

    try {
      const amountWei = ethers.parseEther(intent.amount)
      log(`[意图声明] 目标资源: ${intent.serviceName}`)
      log(`[意图声明] 收款方: ${intent.recipientAlias} (${intent.recipient.slice(0, 6)}...${intent.recipient.slice(-4)})`)
      log(`[意图声明] 申请金额: ${intent.amount} AVAX | Request ID: ${intent.requestId.slice(0, 10)}...${intent.requestId.slice(-6)}`)

      // 2. Stage: POLICY_EVALUATING
      setCurrentExecution((prev) => ({
        ...prev,
        stage: 'POLICY_EVALUATING',
        networkStatus: 'READY'
      }))
      log('🔍 调用 Fuji 链上 AvaFence.evaluateSpend() 静态只读预检...')

      const fujiProvider = new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0], 43113, { staticNetwork: true })
      await assertFujiNetwork(fujiProvider)
      const guardContract = new ethers.Contract(contractAddress, AVAX_GUARD_ABI, fujiProvider)

      const evalRes = await withTimeout(
        guardContract.evaluateSpend(
          account,
          activeAgentWallet.address,
          intent.recipient,
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

      // 3. Stage: POLICY_VISUALIZING
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

      // Sequential visual reveal promise
      const revealPromise = (async () => {
        for (let step = 0; step <= 7; step++) {
          setCurrentExecution((prev) => ({ ...prev, revealStep: step }))
          await new Promise((r) => setTimeout(r, 120))
          if (firstFail !== -1 && step === firstFail) {
            await new Promise((r) => setTimeout(r, 140))
            break
          }
        }
      })()

      // 4. In Parallel: Autonomous Execution on Avalanche Fuji
      const txPromise: Promise<{ txHash: string; receipt: any; acceptedRes: any; latency: number }> = (async () => {
        log('⚡ Agent 使用独立钱包私钥签署 attemptSpend 并广播至 Avalanche Fuji C-Chain...')
        assertBrowserSigningAllowed(chainId)
        const agentSigner = await connectAgentSignerSafely(activeAgentWallet, fujiProvider)
        const agentContract = new ethers.Contract(contractAddress, AVAX_GUARD_ABI, agentSigner)

        const t0 = performance.now()
        const tx = await withTimeout(
          agentContract.attemptSpend(intent.recipient, amountWei, intent.requestId),
          20000,
          'Tx Submission (广播交易)'
        )
        const txHash = tx.hash
        log(`📝 交易已广播: ${txHash.slice(0, 18)}...`)

        setCurrentExecution((prev) => ({
          ...prev,
          txHash,
          networkStatus: 'BROADCAST'
        }))

        const waitPromise = monitor.waitForAccepted(txHash, t0, fujiProvider, 30000)
        const receipt: any = await withTimeout(tx.wait(), 30000, 'Tx Receipt (等待出块)')
        const acceptedRes = await waitPromise
        const latency = acceptedRes.latencyMs
        log(`🏁 Avalanche 区块 #${receipt.blockNumber} 确认完成 (延迟: ${latency} ms，来源: ${acceptedRes.source})`)

        return { txHash, receipt, acceptedRes, latency }
      })()

      await revealPromise

      setCurrentExecution((prev) => ({
        ...prev,
        stage: 'WAITING_ACCEPTANCE',
        networkStatus: prev.txHash ? 'BROADCAST' : 'SUBMITTING'
      }))

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

      // 6. Stage: TX_ACCEPTED
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
        blockReason: finalVerdict,
        transferredAmount: isExecuted ? `${intent.amount} AVAX` : '0 AVAX',
        plainReason: isExecuted
          ? 'Payment authorized by policy.'
          : scenario === 'B' || finalVerdict === BlockReason.MERCHANT_NOT_ALLOWED
          ? 'Recipient is not authorized by policy.'
          : scenario === 'C' || finalVerdict === BlockReason.PER_TX_LIMIT_EXCEEDED
          ? 'Per-transaction limit of 0.003 AVAX exceeded.'
          : (BLOCK_REASON_TEXT[finalVerdict]?.description || 'Payment blocked by policy.')
      }))

      if (isExecuted) {
        // APPROVED BRANCH (Scenario A)
        log('📡 正在将 PaymentExecuted 链上收据提交至商户 API 进行核验...')
        setCurrentExecution((prev) => ({ ...prev, stage: 'MERCHANT_VERIFYING' }))

        const merchantRes = await withTimeout(
          merchantService.verifyAndFulfill(
            txHash,
            intent.requestId,
            activeAgentWallet.address,
            amountWei,
            fujiProvider,
            contractAddress
          ),
          10000,
          'Merchant Verification'
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
            merchantResult: merchantRes,
            transferredAmount: `${intent.amount} AVAX`
          }))

          setAuditLogs((prev) => [
            {
              id: 'audit-' + Date.now(),
              timestamp: new Date().toLocaleTimeString(),
              type: 'EXECUTED',
              agent: activeAgentWallet.address,
              recipient: intent.recipient,
              recipientAlias: intent.recipientAlias,
              amount: intent.amount,
              transferredAmount: `${intent.amount} AVAX`,
              requestId: intent.requestId,
              reason: BlockReason.NONE,
              txHash,
              latencyMs: latency,
              sceneType: intent.sceneType,
              isLiveExecution: true
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
        // BLOCKED BRANCH (Scenario B & C)
        log(`🛡️ SPENDING BLOCKED BY AVAFENCE: 拦截原因 = ${BLOCK_REASON_TEXT[finalVerdict]?.label || finalVerdict}`)
        log(`🔒 0 AVAX transferred to recipient: 本金受 100% 链上策略保护。`)

        setCurrentExecution((prev) => ({
          ...prev,
          stage: 'BLOCKED_COMPLETED',
          transferredAmount: '0 AVAX',
          plainReason:
            scenario === 'B' || finalVerdict === BlockReason.MERCHANT_NOT_ALLOWED
              ? 'Recipient is not authorized by policy.'
              : scenario === 'C' || finalVerdict === BlockReason.PER_TX_LIMIT_EXCEEDED
              ? 'Per-transaction limit of 0.003 AVAX exceeded.'
              : (BLOCK_REASON_TEXT[finalVerdict]?.description || 'Payment blocked by policy.')
        }))

        setAuditLogs((prev) => [
          {
            id: 'audit-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            type: 'BLOCKED',
            agent: activeAgentWallet.address,
            recipient: intent.recipient,
            recipientAlias: intent.recipientAlias,
            amount: intent.amount,
            transferredAmount: '0 AVAX',
            requestId: intent.requestId,
            reason: finalVerdict,
            txHash,
            latencyMs: latency,
            sceneType: intent.sceneType,
            isLiveExecution: true
          },
          ...prev
        ])
      }

      await loadPolicy()
      await refreshBalances()
    } catch (err: any) {
      console.error('Scenario execution failed:', err)
      const errMsg = err.message || String(err)
      log(`❌ 执行失败: ${errMsg}`)
      setCurrentExecution((prev) => ({
        ...prev,
        stage: 'EXECUTION_ERROR',
        errorMessage: errMsg,
        networkStatus: 'ERROR'
      }))
    }
  }

  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
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
        onNavClick={handleScrollToSection}
      />

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-6">
        {/* Section 6: Hero */}
        <Hero
          onTryInstantDemo={() => {
            setDemoMode('instant')
            handleScrollToSection('demo-section')
          }}
          onRunLiveOnFuji={() => {
            setDemoMode('live')
            ensureAgentWallet()
            handleScrollToSection('demo-section')
          }}
          onHowItWorks={() => handleScrollToSection('how-it-works')}
        />

        {/* Section 8 & P0-3: Interactive Demo Section */}
        <div id="demo-section" className="pt-2">
          {/* Mode Switcher Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 mb-4 shadow-lg gap-2">
            <div className="flex items-center space-x-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setDemoMode('instant')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  demoMode === 'instant'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>⚡ Instant Demo</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${demoMode === 'instant' ? 'bg-red-950/80 text-rose-200' : 'bg-slate-800 text-slate-400'}`}>
                  Zero Setup
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDemoMode('live')
                  ensureAgentWallet()
                }}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  demoMode === 'live'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>⛓️ Run Live on Avalanche Fuji</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${demoMode === 'live' ? 'bg-red-950/80 text-rose-200' : 'bg-slate-800 text-slate-400'}`}>
                  Guided Setup
                </span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-2 px-2">
              {demoMode === 'instant' ? (
                <span className="text-amber-400 font-medium">
                  ⚡ Interactive Simulation — no transaction is broadcast · verifiable Fuji evidence provided
                </span>
              ) : (
                <span className="text-cyan-400 font-medium">
                  ⛓️ Connected to Avalanche Fuji C-Chain (43113)
                </span>
              )}
            </div>
          </div>

          {/* Setup Progress: Only shown in live mode */}
          {demoMode === 'live' && (
            <DemoSetupProgress
              account={account}
              chainId={chainId}
              balance={balance}
              policyActive={!!(policy && policy.active && Date.now() / 1000 <= policy.expiry)}
              agentGasBalance={agentBalance}
              isExecuting={isExecuting}
              onConnectWallet={connectWallet}
              onSwitchToFuji={switchToFuji}
              onOpenFaucet={() => setIsFaucetOpen(true)}
              onCreatePolicy={() => handleCreatePolicy('0.02', '0.003', '0.01', 3600)}
              onFundAgent={handleFundAgent}
              onPrepareDemo={handlePrepareDemo}
              isPreparingDemo={isPreparingDemo}
            />
          )}

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
                isSimulation={demoMode === 'instant'}
              />
            </div>

            {/* Right Guard Panel: 36% Policy Evaluation & Evidence */}
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
                agentAddress={agentWallet ? agentWallet.address : ''}
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
                isSimulation={demoMode === 'instant'}
              />
            </div>
          </div>
        </div>

        {/* Section 7: Developer Integration Preview (Immediately following Instant Demo) */}
        <DeveloperIntegrationPreview />

        {/* P0-5: Current Capabilities vs Planned Roadmap */}
        <CurrentVsPlanned />

        {/* P0-1: Decision Evidence & Audit Trail */}
        <AuditLog logs={auditLogs} />
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        AvaFence • The Verifiable Policy Firewall for AI Agent Payments • Built on Avalanche Fuji C-Chain
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

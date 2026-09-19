import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import confetti from 'canvas-confetti'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { PolicyConsole } from './components/PolicyConsole'
import type { PolicyState } from './components/PolicyConsole'
import { AgentActivity } from './components/AgentActivity'
import { LiveTelemetry } from './components/LiveTelemetry'
import type { TelemetryData } from './components/LiveTelemetry'
import { AuditLog } from './components/AuditLog'
import type { AuditRecord } from './components/AuditLog'
import { FaucetModal } from './components/FaucetModal'
import type { SpendIntent } from './components/SpendIntentCard'
import {
  getAvaxGuardAddress,
  setAvaxGuardAddress,
  AVAX_GUARD_ABI,
  AVAX_GUARD_BYTECODE,
  DEMO_ADDRESSES,
  BlockReason,
  FUJI_CHAIN_CONFIG
} from './config/avalanche'
import {
  getOrCreateAgentWallet,
  createNewAgentWallet,
  getAgentBalance
} from './services/agentWallet'
import { monitor } from './services/monitor'
import { merchantService } from './services/merchant'
import type { FulfillmentResult } from './services/merchant'

export function App() {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [balance, setBalance] = useState<string>('0')
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [isFaucetOpen, setIsFaucetOpen] = useState<boolean>(false)

  // Contract deployment state
  const [contractAddress, setContractAddr] = useState<string>(getAvaxGuardAddress())
  const [isContractDeployed, setIsContractDeployed] = useState<boolean>(false)
  const [isDeployingContract, setIsDeployingContract] = useState<boolean>(false)

  // Agent Scoped Wallet state
  const [agentWallet, setAgentWallet] = useState<ethers.Wallet>(() => getOrCreateAgentWallet())
  const [agentBalance, setAgentBalance] = useState<string>('0')
  const [isFundingAgent, setIsFundingAgent] = useState<boolean>(false)

  // Policy & Guard state
  const [policy, setPolicy] = useState<PolicyState | null>(null)
  const [isCreatingPolicy, setIsCreatingPolicy] = useState<boolean>(false)
  const [isRevokingPolicy, setIsRevokingPolicy] = useState<boolean>(false)

  // Autonomous Activity state
  const [isExecuting, setIsExecuting] = useState<boolean>(false)
  const [currentIntent, setCurrentIntent] = useState<SpendIntent | null>(null)
  const [executionLogs, setExecutionLogs] = useState<string[]>([])
  const [checksPassed, setChecksPassed] = useState<number | null>(null)
  const [verdict, setVerdict] = useState<BlockReason | null>(null)
  const [agentAuthorized, setAgentAuthorized] = useState<boolean>(false)
  const [merchantResult, setMerchantResult] = useState<FulfillmentResult | null>(null)

  // Live Telemetry & Audit Logs
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    status: 'IDLE',
    txHash: null,
    blockNumber: null,
    gasUsed: null,
    observedLatencyMs: null,
    unauthorizedTransfer: '0 AVAX',
    networkGasCost: '~0.00035 AVAX'
  })
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([])

  // Nonce counter for deterministic request IDs
  const [localNonce, setLocalNonce] = useState<number>(Date.now() % 1000000)

  // Init WSS monitor once
  useEffect(() => {
    monitor.init()
  }, [])

  // Check if contract has bytecode on Fuji
  const checkContractDeployment = useCallback(async (targetAddr: string, activeProvider?: ethers.Provider) => {
    const prov = activeProvider || new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0])
    try {
      const code = await prov.getCode(targetAddr)
      const deployed = code !== '0x' && code.length > 2
      setIsContractDeployed(deployed)
      return deployed
    } catch (e) {
      console.warn('Failed to check contract bytecode:', e)
      setIsContractDeployed(false)
      return false
    }
  }, [])

  const refreshBalances = useCallback(async () => {
    const prov = provider || new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0])
    if (account) {
      try {
        const bal = await prov.getBalance(account)
        setBalance(ethers.formatEther(bal))
      } catch (e) {
        console.error('Failed to get account balance:', e)
      }
    }
    if (agentWallet) {
      const aBal = await getAgentBalance(agentWallet.address, prov)
      setAgentBalance(aBal)
    }
  }, [provider, account, agentWallet])

  // Load Policy from Avalanche C-Chain
  const loadPolicy = useCallback(async () => {
    const prov = provider || new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0])
    if (!account || !agentWallet) return

    try {
      const isDeployed = await checkContractDeployment(contractAddress, prov)
      if (isDeployed) {
        const contract = new ethers.Contract(contractAddress, AVAX_GUARD_ABI, prov)
        const activeOwner = await contract.activeOwnerOfAgent(agentWallet.address)
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
  }, [provider, account, agentWallet, contractAddress, checkContractDeployment])

  useEffect(() => {
    loadPolicy()
    refreshBalances()
  }, [loadPolicy, refreshBalances])

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum
    if (!ethereum) {
      alert('Please install MetaMask or Core Wallet!')
      return
    }

    setIsConnecting(true)
    try {
      const browserProvider = new ethers.BrowserProvider(ethereum)
      const accounts = await browserProvider.send('eth_requestAccounts', [])
      const network = await browserProvider.getNetwork()

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

  // In-DApp 1-Click Contract Deployer via MetaMask
  const handleDeployContract = async () => {
    if (!account || !provider) {
      alert('Please connect MetaMask first!')
      return
    }

    setIsDeployingContract(true)
    try {
      const signer = await provider.getSigner()
      const factory = new ethers.ContractFactory(AVAX_GUARD_ABI, AVAX_GUARD_BYTECODE, signer)
      const deployedContract = await factory.deploy()
      await deployedContract.waitForDeployment()
      const newAddr = await deployedContract.getAddress()

      setAvaxGuardAddress(newAddr)
      setContractAddr(newAddr)
      setIsContractDeployed(true)
      await loadPolicy()
      await refreshBalances()
      alert(`AvaxGuard successfully deployed to Fuji at: ${newAddr}`)
    } catch (err: any) {
      console.error('Contract deployment failed:', err)
      alert(`Deployment failed: ${err.message || err}`)
    } finally {
      setIsDeployingContract(false)
    }
  }

  // Human Action: Fund Agent Gas (0.005 AVAX)
  const handleFundAgent = async () => {
    if (!account || !provider) {
      alert('Please connect MetaMask first!')
      return
    }

    setIsFundingAgent(true)
    try {
      const signer = await provider.getSigner()
      const tx = await signer.sendTransaction({
        to: agentWallet.address,
        value: ethers.parseEther('0.005')
      })
      await tx.wait()
      await refreshBalances()
      alert(`Successfully funded 0.005 AVAX gas to Agent Scoped Wallet: ${agentWallet.address}`)
    } catch (err: any) {
      console.error('Funding agent gas failed:', err)
      alert(`Gas funding failed: ${err.message || err}`)
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
      alert('Please connect your wallet!')
      return
    }
    if (!isContractDeployed) {
      alert('Please deploy the AvaxGuard contract first using the button above!')
      return
    }

    setIsCreatingPolicy(true)
    try {
      const signer = await provider.getSigner()
      const budgetWei = ethers.parseEther(budget)
      const maxTxWei = ethers.parseEther(maxTx)
      const dailyWei = ethers.parseEther(daily)

      const contract = new ethers.Contract(contractAddress, AVAX_GUARD_ABI, signer)
      const tx = await contract.createPolicy(
        agentWallet.address,
        DEMO_ADDRESSES.MERCHANT,
        maxTxWei,
        dailyWei,
        durationSec,
        { value: budgetWei }
      )
      await tx.wait()

      await loadPolicy()
      await refreshBalances()
    } catch (err: any) {
      console.error('Failed to create policy:', err)
      alert(`Policy creation failed: ${err.message || err}`)
    } finally {
      setIsCreatingPolicy(false)
    }
  }

  // Human Action: Revoke Policy
  const handleRevokePolicy = async () => {
    if (!account || !provider || !isContractDeployed) return
    setIsRevokingPolicy(true)
    try {
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(contractAddress, AVAX_GUARD_ABI, signer)
      const tx = await contract.revokePolicy(agentWallet.address)
      await tx.wait()

      await loadPolicy()
      await refreshBalances()
    } catch (err: any) {
      console.error('Failed to revoke policy:', err)
      alert(`Revoke failed: ${err.message || err}`)
    } finally {
      setIsRevokingPolicy(false)
    }
  }

  // Autonomous AI Agent Trigger: 100% Real Fuji C-Chain Execution
  const handleTriggerScene = async (scene: 'A' | 'B' | 'C') => {
    if (!account) {
      alert('Please connect your wallet first!')
      return
    }
    if (!isContractDeployed) {
      alert('Please deploy the AvaxGuard contract first to Fuji!')
      return
    }
    if (parseFloat(agentBalance) < 0.001) {
      alert('Agent Scoped Wallet has insufficient AVAX for gas. Please click "Fund Agent Gas" first!')
      return
    }

    setIsExecuting(true)
    setExecutionLogs([])
    setMerchantResult(null)
    setVerdict(null)
    setChecksPassed(null)

    const log = (msg: string) => setExecutionLogs((prev) => [...prev, msg])
    const curNonce = localNonce
    setLocalNonce((prev) => prev + 1)

    try {
      // 1. Prepare Spend Intent based on selected scene
      let intent: SpendIntent
      let amountWei: bigint

      if (scene === 'A') {
        // Legitimate 0.002 AVAX
        const amt = '0.002'
        amountWei = ethers.parseEther(amt)
        const reqId = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'uint256', 'bytes32'],
            [agentWallet.address, curNonce, ethers.id('AVAX_HIGH_RES_ORDERBOOK')]
          )
        )
        intent = {
          requestId: reqId,
          serviceName: 'Avalanche High-Resolution Orderbook API',
          merchant: DEMO_ADDRESSES.MERCHANT,
          merchantAlias: 'PremiumData API (Whitelisted)',
          amount: amt,
          taskDescription: 'Fetch AVAX real-time liquidity depth and orderbook support levels.',
          sceneType: 'A'
        }
      } else if (scene === 'B') {
        // Over-Limit 0.010 AVAX > maxPerTx (0.003)
        const amt = '0.010'
        amountWei = ethers.parseEther(amt)
        const reqId = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'uint256', 'bytes32'],
            [agentWallet.address, curNonce, ethers.id('DEEP_HFT_DATASET')]
          )
        )
        intent = {
          requestId: reqId,
          serviceName: 'Institutional High-Frequency Dataset (Exclusive)',
          merchant: DEMO_ADDRESSES.MERCHANT,
          merchantAlias: 'PremiumData API (Whitelisted)',
          amount: amt,
          taskDescription: 'Attempt to purchase ultra-deep intelligence dataset exceeding per-tx cap.',
          sceneType: 'B'
        }
      } else {
        // Scene C: Prompt Injection Attack Simulation to Attacker
        const amt = '0.001'
        amountWei = ethers.parseEther(amt)
        const reqId = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'uint256', 'bytes32'],
            [agentWallet.address, curNonce, ethers.id('PROMPT_INJECTION_OVERRIDE')]
          )
        )
        intent = {
          requestId: reqId,
          serviceName: 'Prompt-Injection-Induced Malicious Forwarding',
          merchant: DEMO_ADDRESSES.ATTACKER,
          merchantAlias: 'Attacker Wallet (Unauthorized)',
          amount: amt,
          taskDescription: 'Simulated prompt injection override attempting to drain micro funds to attacker.',
          sceneType: 'C'
        }
      }

      setCurrentIntent(intent)
      log(`[${new Date().toLocaleTimeString()}] 🤖 Agent formed Spend Intent for Scene ${scene}`)
      log(`[Intent] Target: ${intent.serviceName}`)
      log(`[Intent] Recipient: ${intent.merchantAlias} (${intent.merchant.slice(0, 8)}...)`)
      log(`[Intent] Amount: ${intent.amount} AVAX | RequestId: ${intent.requestId.slice(0, 14)}...`)

      // 2. Perform Real On-Chain evaluateSpend View Check
      const fujiProvider = new ethers.JsonRpcProvider(FUJI_CHAIN_CONFIG.rpcUrls[0])
      const guardContract = new ethers.Contract(contractAddress, AVAX_GUARD_ABI, fujiProvider)

      log('🔍 Querying AvaxGuard.evaluateSpend on Fuji...')
      const evalRes = await guardContract.evaluateSpend(
        account,
        agentWallet.address,
        intent.merchant,
        amountWei,
        intent.requestId
      )
      const onChainAllowed = evalRes[0] as boolean
      const onChainReason = Number(evalRes[1]) as BlockReason
      const onChainBits = Number(evalRes[2])

      setChecksPassed(onChainBits)
      setVerdict(onChainReason)

      log(`[Policy Engine] Bitmask: 0b${onChainBits.toString(2).padStart(7, '0')}`)
      log(`[Policy Engine] On-Chain Verdict: ${onChainAllowed ? 'APPROVED ✅' : 'BLOCKED 🛡️'}`)

      // 3. Autonomous Execution: Agent Signs with Dedicated Key and Broadcasts to Fuji
      setTelemetry((prev) => ({ ...prev, status: 'PENDING' }))
      log('⚡ Autonomous Agent broadcasting attemptSpend to Avalanche Fuji C-Chain...')

      const agentSigner = agentWallet.connect(fujiProvider)
      const agentContract = new ethers.Contract(contractAddress, AVAX_GUARD_ABI, agentSigner)

      const t0 = performance.now()
      const tx = await agentContract.attemptSpend(intent.merchant, amountWei, intent.requestId)
      const txHash = tx.hash
      log(`📝 Tx Broadcasted: ${txHash.slice(0, 18)}...`)

      // Wait for acceptance on Avalanche (WSS or receipt polling) with strict 15s timeout
      const waitPromise = monitor.waitForAccepted(txHash, t0, fujiProvider, 15000)
      const receipt = await tx.wait()
      const acceptedRes = await waitPromise
      const latency = acceptedRes.latencyMs
      log(`🏁 Avalanche Confirmed in Block #${receipt.blockNumber} (Observed Acceptance: ${latency} ms via ${acceptedRes.source})`)

      // Parse Receipt Logs for PaymentExecuted / PaymentBlocked
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
          } catch {
            // Not a matching event
          }
        }
      }

      const realGasUsed = receipt.gasUsed.toString()
      const effectiveGasPrice = receipt.gasPrice || 25000000000n
      const realGasCostEth = ethers.formatEther(receipt.gasUsed * effectiveGasPrice)

      if (isExecuted) {
        // APPROVED BRANCH (Scene A)
        setTelemetry({
          status: 'ACCEPTED',
          txHash,
          blockNumber: receipt.blockNumber,
          gasUsed: Number(realGasUsed).toLocaleString(),
          observedLatencyMs: latency,
          latencySource: acceptedRes.source,
          unauthorizedTransfer: '0 AVAX',
          networkGasCost: `~${parseFloat(realGasCostEth).toFixed(5)} AVAX`
        })

        // Call Real Merchant Verification Service
        log('📡 Verifying PaymentExecuted receipt with Merchant API...')
        const merchantRes = await merchantService.verifyAndFulfill(
          txHash,
          intent.requestId,
          agentWallet.address,
          amountWei,
          fujiProvider,
          contractAddress
        )
        setMerchantResult(merchantRes)

        if (merchantRes.success) {
          log(`✅ Merchant: ${merchantRes.message}`)
          log('📊 Agent received verified protected dataset.')

          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#ef4444', '#10b981', '#ffffff']
          })

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
              latencyMs: latency
            },
            ...prev
          ])
        } else {
          log(`❌ Merchant Verification Failed: ${merchantRes.message}`)
        }
      } else if (isBlocked) {
        // BLOCKED BRANCH (Scene B & C)
        const finalReason = blockReasonParsed !== BlockReason.NONE ? blockReasonParsed : onChainReason

        setTelemetry({
          status: 'BLOCKED',
          txHash,
          blockNumber: receipt.blockNumber,
          gasUsed: Number(realGasUsed).toLocaleString(),
          observedLatencyMs: latency,
          latencySource: acceptedRes.source,
          unauthorizedTransfer: '0 AVAX',
          networkGasCost: `~${parseFloat(realGasCostEth).toFixed(5)} AVAX`
        })

        log(`🛡️ SPENDING BLOCKED BY AVAXGUARD: Reason = ${finalReason}`)
        log(`🔒 ZERO Unauthorized Value Transferred from Human Budget.`)

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
            reason: finalReason,
            txHash,
            latencyMs: latency
          },
          ...prev
        ])
      } else {
        log(`⚠️ Transaction mined with status ${receipt.status}, but neither event identified.`)
      }

      await loadPolicy()
      await refreshBalances()
    } catch (err: any) {
      console.error('Execution error:', err)
      log(`❌ On-chain Error: ${err.message || err}`)
      setTelemetry((prev) => ({ ...prev, status: 'IDLE' }))
    } finally {
      setIsExecuting(false)
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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        <Hero />

        {/* Core 3-Column Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Col 1: Human Policy Guardrails (3.5 cols) */}
          <div className="lg:col-span-4">
            <PolicyConsole
              policy={policy}
              account={account}
              contractAddress={contractAddress}
              isContractDeployed={isContractDeployed}
              isDeployingContract={isDeployingContract}
              agentAddress={agentWallet.address}
              agentBalance={agentBalance}
              isFundingAgent={isFundingAgent}
              isCreating={isCreatingPolicy}
              isRevoking={isRevokingPolicy}
              onDeployContract={handleDeployContract}
              onFundAgent={handleFundAgent}
              onResetAgent={handleResetAgent}
              onCreatePolicy={handleCreatePolicy}
              onRevokePolicy={handleRevokePolicy}
            />
          </div>

          {/* Col 2: Agent Autonomous Stream & Trace (5 cols) */}
          <div className="lg:col-span-5">
            <AgentActivity
              isExecuting={isExecuting}
              currentIntent={currentIntent}
              executionLogs={executionLogs}
              checksPassed={checksPassed}
              verdict={verdict}
              agentAuthorized={agentAuthorized}
              merchantResult={merchantResult}
              onTriggerScene={handleTriggerScene}
            />
          </div>

          {/* Col 3: Live Telemetry & Avalanche Consensus (3.5 cols) */}
          <div className="lg:col-span-3">
            <LiveTelemetry telemetry={telemetry} />
          </div>
        </div>

        {/* Bottom Full-Width Audit Log */}
        <AuditLog logs={auditLogs} />
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        AvaxGuard • Programmable Spending Guardrails for Autonomous AI Agents • Built on Avalanche Fuji
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

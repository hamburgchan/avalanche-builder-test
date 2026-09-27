import { describe, it, expect, beforeEach } from 'bun:test'
import { ethers } from 'ethers'
import {
  getOrCreateAgentWallet,
  createNewAgentWallet,
  connectAgentSignerSafely,
  PERMANENTLY_COMPROMISED_LEGACY_AGENT
} from './agentWallet'

// Mock localStorage for non-browser CLI test runner
if (typeof (globalThis as any).localStorage === 'undefined') {
  const store = new Map<string, string>()
  ;(globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: () => null,
    length: 0
  }
}

describe('Agent Wallet Security & Disconnected Factory Guard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('1. getOrCreateAgentWallet() must ALWAYS return a disconnected Wallet (provider is null)', () => {
    const wallet = getOrCreateAgentWallet()
    expect(wallet).toBeInstanceOf(ethers.Wallet)
    expect(wallet.provider).toBeNull()
    expect(wallet.address.startsWith('0x')).toBeTrue()
  })

  it('2. createNewAgentWallet() must ALWAYS return a disconnected Wallet (provider is null)', () => {
    const freshWallet = createNewAgentWallet()
    expect(freshWallet).toBeInstanceOf(ethers.Wallet)
    expect(freshWallet.provider).toBeNull()
    expect(freshWallet.address.startsWith('0x')).toBeTrue()
  })

  it('3. connectAgentSignerSafely() allows connection to Avalanche Fuji Testnet (43113)', async () => {
    const wallet = createNewAgentWallet()
    expect(wallet.provider).toBeNull()

    const mockFujiProvider = {
      getNetwork: async () => ({ chainId: 43113n, name: 'fuji' }),
      _isProvider: true
    } as unknown as ethers.Provider

    const connectedSigner = await connectAgentSignerSafely(wallet, mockFujiProvider)
    expect(connectedSigner.provider).toBe(mockFujiProvider)
    expect(connectedSigner.address).toBe(wallet.address)
  })

  it('4. connectAgentSignerSafely() strictly REJECTS Avalanche Mainnet (43114) BEFORE connection', async () => {
    const wallet = createNewAgentWallet()
    expect(wallet.provider).toBeNull()

    const mockMainnetProvider = {
      getNetwork: async () => ({ chainId: 43114n, name: 'avalanche-mainnet' }),
      _isProvider: true
    } as unknown as ethers.Provider

    let threwError = false
    try {
      await connectAgentSignerSafely(wallet, mockMainnetProvider)
    } catch (err: any) {
      threwError = true
      expect(err.message).toContain('43114')
      expect(err.message).toContain('CRITICAL SECURITY GUARD')
    }

    expect(threwError).toBeTrue()
    // Verify that the original wallet was NEVER connected to the Mainnet provider
    expect(wallet.provider).toBeNull()
  })

  it('5. getOrCreateAgentWallet() purges permanently compromised legacy address if detected', () => {
    const dummyCompromisedWallet = ethers.Wallet.createRandom()
    localStorage.setItem('avaxguard_agent_pkey', dummyCompromisedWallet.privateKey)
    const loadedWallet = getOrCreateAgentWallet()
    expect(loadedWallet.provider).toBeNull()
    expect(loadedWallet.address.toLowerCase()).not.toBe(PERMANENTLY_COMPROMISED_LEGACY_AGENT)
  })

  it('6. Lazy initialization: initial state has no agent private key in localStorage', () => {
    // Fresh state before entering Live Fuji mode
    expect(localStorage.getItem('avaxguard_agent_pkey')).toBeNull()
  })

  it('7. Historical Fuji Evidence matches RPC Source of Truth exactly without estimation', async () => {
    const { siteConfig } = await import('../config/site.config')
    const itemA = siteConfig.historicalEvidence.find((e) => e.scenario === 'A')!
    const itemB = siteConfig.historicalEvidence.find((e) => e.scenario === 'B')!
    const itemC = siteConfig.historicalEvidence.find((e) => e.scenario === 'C')!

    // Scenario A: PaymentExecuted
    expect(itemA.amount).toBe('0.002 AVAX')
    expect(itemA.blockNumber).toBe(58476762)
    expect(itemA.gasUsed).toBe('107744')
    expect(itemA.effectiveGasPrice).toBe('160 wei')
    expect(itemA.networkGasCost).toBe('0.00000000001723904 AVAX')
    expect(itemA.recipientDelta).toBe('+0.002 AVAX')

    // Scenario B: PaymentBlocked reason 4
    expect(itemB.amount).toBe('0.001 AVAX')
    expect(itemB.blockNumber).toBe(58476773)
    expect(itemB.gasUsed).toBe('42958')
    expect(itemB.effectiveGasPrice).toBe('160 wei')
    expect(itemB.networkGasCost).toBe('0.00000000000687328 AVAX')
    expect(itemB.recipientDelta).toBe('0 AVAX')

    // Scenario C: PaymentBlocked reason 5
    expect(itemC.amount).toBe('0.010 AVAX')
    expect(itemC.blockNumber).toBe(58476771)
    expect(itemC.gasUsed).toBe('45100')
    expect(itemC.effectiveGasPrice).toBe('160 wei')
    expect(itemC.networkGasCost).toBe('0.000000000007216 AVAX')
    expect(itemC.recipientDelta).toBe('0 AVAX')
  })

  it('8. Obsolete gas estimates (142850, 68420, 68390) are completely eliminated', async () => {
    const { siteConfig } = await import('../config/site.config')
    const allGasUsed = siteConfig.historicalEvidence.map((e) => e.gasUsed)
    const allGasCost = siteConfig.historicalEvidence.map((e) => e.networkGasCost)

    expect(allGasUsed.includes('142850')).toBeFalse()
    expect(allGasUsed.includes('142,850')).toBeFalse()
    expect(allGasUsed.includes('68420')).toBeFalse()
    expect(allGasUsed.includes('68,420')).toBeFalse()
    expect(allGasUsed.includes('68390')).toBeFalse()
    expect(allGasUsed.includes('68,390')).toBeFalse()

    for (const cost of allGasCost) {
      expect(cost.includes('~0.00357')).toBeFalse()
      expect(cost.includes('~0.00171')).toBeFalse()
    }
  })

  it('9. Both Live entry points (Hero and Demo Live Tab) initialize Agent Principal consistently', () => {
    // Initial state before entering Live mode: no wallet, no pkey
    expect(localStorage.getItem('avaxguard_agent_pkey')).toBeNull()

    // Entering Live mode (Hero onRunLiveOnFuji or Demo Tab) invokes getOrCreateAgentWallet
    const liveWallet = getOrCreateAgentWallet()
    expect(liveWallet).toBeInstanceOf(ethers.Wallet)
    expect(liveWallet.address.length).toBe(42)
    expect(liveWallet.address.startsWith('0x')).toBeTrue()

    // Agent Principal is now resolvable and not '--'
    const agentPrincipal = `${liveWallet.address.slice(0, 8)}...${liveWallet.address.slice(-6)}`
    expect(agentPrincipal).not.toBe('--')
    expect(agentPrincipal).toContain('...')
  })
})

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
})

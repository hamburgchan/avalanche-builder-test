import { ethers } from 'ethers'

const AGENT_PKEY_STORAGE_KEY = 'avaxguard_agent_pkey'

// Default live verified Agent key on Fuji (0x82fF1466015f208dB33e4E198e529b03f6fa1A51)
const DEMO_LIVE_AGENT_PKEY = '0xd8bed69f112bb0772e4af757a08e96e5fe91d493f442fe5a498116c0cc351780'

/**
 * Retrieves the persisted Agent Scoped Wallet or creates a new one
 */
export function getOrCreateAgentWallet(provider?: ethers.Provider): ethers.Wallet {
  let pkey: string | null = null
  if (typeof window !== 'undefined') {
    pkey = localStorage.getItem(AGENT_PKEY_STORAGE_KEY)
  }

  if (pkey && pkey.startsWith('0x') && pkey.length === 66) {
    try {
      return new ethers.Wallet(pkey, provider)
    } catch (e) {
      console.warn('Invalid stored agent private key, generating fresh one:', e)
    }
  }

  const defaultKey = DEMO_LIVE_AGENT_PKEY
  if (typeof window !== 'undefined') {
    localStorage.setItem(AGENT_PKEY_STORAGE_KEY, defaultKey)
  }
  return new ethers.Wallet(defaultKey, provider)
}

/**
 * Creates a brand new Agent Scoped Wallet (used when resetting or after revoking a policy)
 * Ensures compliance with AvaxGuard's 'One Agent = One Policy Lifecycle'
 */
export function createNewAgentWallet(provider?: ethers.Provider): ethers.Wallet {
  const freshWallet = ethers.Wallet.createRandom()
  if (typeof window !== 'undefined') {
    localStorage.setItem(AGENT_PKEY_STORAGE_KEY, freshWallet.privateKey)
  }
  return new ethers.Wallet(freshWallet.privateKey, provider)
}

/**
 * Fetches the current gas balance of the Agent Scoped Wallet
 */
export async function getAgentBalance(
  agentAddress: string,
  provider: ethers.Provider
): Promise<string> {
  try {
    const bal = await provider.getBalance(agentAddress)
    return ethers.formatEther(bal)
  } catch (err) {
    console.warn('Failed to fetch agent balance:', err)
    return '0'
  }
}

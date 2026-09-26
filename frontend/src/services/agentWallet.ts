import { ethers } from 'ethers'
import { assertBrowserSigningAllowed } from '../config/avalanche'

const AGENT_PKEY_STORAGE_KEY = 'avaxguard_agent_pkey'

/**
 * PERMANENTLY COMPROMISED TEST-ONLY LEGACY ADDRESS:
 * Address 0x82fF1466015f208dB33e4E198e529b03f6fa1A51 was an early test key that was exposed.
 * The policy for this address was permanently revoked on Fuji (Tx 0x4309fe1653a1c09f16a056372527a12fb0724c4cab498c66596d9400179acf9f).
 * THIS ADDRESS IS PERMANENTLY TAINTED / TEST-ONLY.
 * CRITICAL RULE: Neither Owner nor Agent may EVER reuse this address on Avalanche Mainnet!
 */
export const PERMANENTLY_COMPROMISED_LEGACY_AGENT = '0x82ff1466015f208db33e4e198e529b03f6fa1a51'

/**
 * Connects an Agent Wallet to a provider with strict Mainnet signing guard.
 * Strictly blocks if provider targets Avalanche C-Chain Mainnet (Chain ID 43114).
 */
export async function connectAgentSignerSafely(
  wallet: ethers.Wallet,
  provider: ethers.Provider
): Promise<ethers.Wallet> {
  const network = await provider.getNetwork()
  assertBrowserSigningAllowed(network.chainId)
  return wallet.connect(provider)
}

/**
 * Retrieves the persisted Agent Scoped Wallet or creates a fresh random one in client browser.
 * NEVER hardcodes or bundles any private keys into source code or build artifacts.
 */
export function getOrCreateAgentWallet(provider?: ethers.Provider): ethers.Wallet {
  let pkey: string | null = null
  if (typeof window !== 'undefined') {
    pkey = localStorage.getItem(AGENT_PKEY_STORAGE_KEY)
  }

  if (pkey && pkey.startsWith('0x') && pkey.length === 66) {
    try {
      const wallet = new ethers.Wallet(pkey, provider)
      // Migration protection: automatically discard any compromised legacy demo wallet
      if (wallet.address.toLowerCase() === PERMANENTLY_COMPROMISED_LEGACY_AGENT) {
        console.warn('Compromised legacy agent wallet detected in localStorage. Purging and generating fresh wallet...')
        if (typeof window !== 'undefined') {
          localStorage.removeItem(AGENT_PKEY_STORAGE_KEY)
        }
        return createNewAgentWallet(provider)
      }
      return wallet
    } catch (e) {
      console.warn('Invalid stored agent private key, generating fresh one:', e)
    }
  }

  // Pure client-side generation: each browser gets its own secure isolated scoped wallet
  return createNewAgentWallet(provider)
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

import { ethers } from 'ethers'
import AvaxGuardMeta from '../contracts/AvaxGuard.json'

// Address validator enforcing strict EIP-55 checksum validation (Fail-Closed)
export function validateAddressOrThrow(addr: string, label: string): string {
  try {
    return ethers.getAddress(addr)
  } catch (err: any) {
    throw new Error(`[Address Checksum Failure] Invalid EIP-55 address for ${label}: "${addr}". ${err.message}`)
  }
}

export const FUJI_CHAIN_CONFIG = {
  chainId: '0xa869', // 43113 in hex
  chainIdDecimal: 43113,
  chainName: 'Avalanche Fuji C-Chain',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: [
    'https://avalanche-fuji-c-chain-rpc.publicnode.com',
    'https://api.avax-test.network/ext/bc/C/rpc'
  ],
  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
  wsUrl: 'wss://api.avax-test.network/ext/bc/C/ws'
}

// AvaxGuard Contract Address on Fuji (Updated upon deployment or local override)
const LOCAL_STORAGE_CONTRACT_KEY = 'AVAX_GUARD_ADDRESS_OVERRIDE'

export function getAvaxGuardAddress(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_CONTRACT_KEY)
    if (saved && saved.startsWith('0x') && saved.length === 42) {
      return validateAddressOrThrow(saved, 'SAVED_CONTRACT_ADDRESS')
    }
  }
  const envAddr = (import.meta as any).env?.VITE_AVAX_GUARD_ADDRESS
  if (envAddr && envAddr.startsWith('0x') && envAddr.length === 42) {
    return validateAddressOrThrow(envAddr, 'ENV_CONTRACT_ADDRESS')
  }
  return '0xB6379ce69E73cC6d20E5284D14386F4fBF8Ed770'
}

export function setAvaxGuardAddress(addr: string): void {
  const verified = validateAddressOrThrow(addr, 'DEPLOYED_CONTRACT_ADDRESS')
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_CONTRACT_KEY, verified)
  }
}

export const AVAX_GUARD_ADDRESS = getAvaxGuardAddress()
export const AVAX_GUARD_ABI = AvaxGuardMeta.abi
export const AVAX_GUARD_BYTECODE: string =
  (AvaxGuardMeta as any).bytecode?.object || (AvaxGuardMeta as any).bytecode || ''

// Deterministic EIP-55 Checksummed EVM Addresses for Demo (Validated Fail-Closed at Module Load)
export const DEMO_ADDRESSES = {
  // Scoped Agent Wallet Fallback
  AGENT: validateAddressOrThrow('0x888888cf1046e68E36e1aa2E0E07105EDDd1f08F', 'AGENT'),
  // Real Dedicated Merchant Wallet on Fuji (Trackable before/after balance)
  MERCHANT: validateAddressOrThrow('0x0D54D5f550e357D5314bf90f178101402BFd3348', 'MERCHANT'),
  // Dedicated Simulated Attacker Address on Fuji (0.0 balance, not in allowlist)
  ATTACKER: validateAddressOrThrow('0xA2B13aE961DE511D9897Ce99a6B5d273DB77B5dD', 'ATTACKER')
}

/**
 * Strict Fuji Chain Guard: enforces chainId == 43113 before any on-chain operation
 * Uses in-memory eth_chainId to bypass MetaMask remote RPC blockNumber errors (-32002)
 */
export async function assertFujiNetwork(provider?: ethers.Provider): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const hexChainId = await (window as any).ethereum.request({ method: 'eth_chainId' })
      const currentId = parseInt(hexChainId, 16)
      if (currentId !== 43113) {
        const switched = await switchToFuji()
        if (!switched) {
          throw new Error(`Wrong network: Chain ID ${currentId}. Please switch to Avalanche Fuji Testnet (Chain ID 43113 / 0xa869).`)
        }
      }
      return
    } catch (e: any) {
      if (e.message?.includes('Wrong network')) throw e
    }
  }
  if (provider) {
    const network = await provider.getNetwork()
    if (Number(network.chainId) !== 43113) {
      throw new Error(`Wrong network: Chain ID ${network.chainId}. Please switch to Avalanche Fuji Testnet (Chain ID 43113).`)
    }
  }
}

// BlockReason Enum matching AvaxGuard.sol (compatible with erasableSyntaxOnly)
export const BlockReason = {
  NONE: 0,
  POLICY_INACTIVE: 1,
  POLICY_EXPIRED: 2,
  REQUEST_ALREADY_EXECUTED: 3,
  MERCHANT_NOT_ALLOWED: 4,
  PER_TX_LIMIT_EXCEEDED: 5,
  DAILY_LIMIT_EXCEEDED: 6,
  INSUFFICIENT_BUDGET: 7,
} as const

export type BlockReason = (typeof BlockReason)[keyof typeof BlockReason]


export const BLOCK_REASON_TEXT: Record<BlockReason, { label: string; description: string }> = {
  [BlockReason.NONE]: {
    label: 'APPROVED',
    description: 'All 7 policy checks passed on-chain.'
  },
  [BlockReason.POLICY_INACTIVE]: {
    label: 'POLICY_INACTIVE',
    description: 'The spending policy has been revoked or not activated by the owner.'
  },
  [BlockReason.POLICY_EXPIRED]: {
    label: 'POLICY_EXPIRED',
    description: 'The transaction timestamp exceeds the policy expiry threshold.'
  },
  [BlockReason.REQUEST_ALREADY_EXECUTED]: {
    label: 'REQUEST_ALREADY_EXECUTED',
    description: 'Replay protection: This Spend Intent requestId has already been fulfilled.'
  },
  [BlockReason.MERCHANT_NOT_ALLOWED]: {
    label: 'MERCHANT_NOT_ALLOWED',
    description: 'The recipient address is not authorized in human owner allowlist.'
  },
  [BlockReason.PER_TX_LIMIT_EXCEEDED]: {
    label: 'PER_TX_LIMIT_EXCEEDED',
    description: 'Attempted amount exceeds the single-transaction hard ceiling.'
  },
  [BlockReason.DAILY_LIMIT_EXCEEDED]: {
    label: 'DAILY_LIMIT_EXCEEDED',
    description: 'Cumulative spending for today exceeds daily budget limit.'
  },
  [BlockReason.INSUFFICIENT_BUDGET]: {
    label: 'INSUFFICIENT_BUDGET',
    description: 'Attempted amount exceeds total remaining policy budget.'
  }
}

// Bitmask helpers (0b1111111 = 127)
export const TRACE_BITS = [
  { bit: 0, key: 'POLICY_ACTIVE', label: '1. Policy Active' },
  { bit: 1, key: 'NOT_EXPIRED', label: '2. Not Expired' },
  { bit: 2, key: 'REQUEST_FRESH', label: '3. Request Fresh (Nonce Unused)' },
  { bit: 3, key: 'MERCHANT_ALLOWED', label: '4. Merchant in Allowlist' },
  { bit: 4, key: 'PER_TX_LIMIT_OK', label: '5. Max / Tx Check' },
  { bit: 5, key: 'DAILY_LIMIT_OK', label: '6. Daily Limit Check' },
  { bit: 6, key: 'BUDGET_AVAILABLE', label: '7. Budget Available' }
]

export function parseChecksPassed(bitmask: number): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const item of TRACE_BITS) {
    result[item.key] = (bitmask & (1 << item.bit)) !== 0
  }
  return result
}

export async function switchToFuji(): Promise<boolean> {
  const ethereum = (window as any).ethereum
  if (!ethereum) {
    alert('Please install MetaMask or Core Wallet!')
    return false
  }
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: FUJI_CHAIN_CONFIG.chainId }],
    })
    return true
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [FUJI_CHAIN_CONFIG],
        })
        return true
      } catch (addError) {
        console.error('Failed to add Fuji network:', addError)
        return false
      }
    }
    console.error('Failed to switch to Fuji network:', switchError)
    return false
  }
}

export async function updateFujiRpcInMetaMask(): Promise<boolean> {
  const ethereum = (window as any).ethereum
  if (!ethereum) return false
  try {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [FUJI_CHAIN_CONFIG],
    })
    return true
  } catch (err) {
    console.error('Failed to update Fuji RPC in MetaMask:', err)
    return false
  }
}

import AvaxGuardMeta from '../contracts/AvaxGuard.json'

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
    'https://api.avax-test.network/ext/bc/C/rpc',
    'https://avalanche-fuji-c-chain-rpc.publicnode.com'
  ],
  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
  wsUrl: 'wss://api.avax-test.network/ext/bc/C/ws'
}

// AvaxGuard Contract Address on Fuji (Updated upon deployment)
export const AVAX_GUARD_ADDRESS = (import.meta as any).env?.VITE_AVAX_GUARD_ADDRESS || '0x4311300000000000000000000000000000000001'
export const AVAX_GUARD_ABI = AvaxGuardMeta.abi

// Deterministic Checksummed EVM Addresses for Demo (All valid 20-byte addresses)
export const DEMO_ADDRESSES = {
  // Scoped Agent Wallet (Holds dedicated signing key and tiny gas)
  AGENT: '0x888888cF1046e68E36E1AA2E0E07105EdDd1F08F',
  // Authorized Premium Data Merchant
  MERCHANT: '0x12aB34cD56eF78aB90cD1234567890aBcDeF1234',
  // Simulated Attacker Target Address (For Prompt Injection Defense Scene)
  ATTACKER: '0x93fc18bA40c72D8523A7aFe9E766D77994A1221A'
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

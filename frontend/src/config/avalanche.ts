import AvaxAgentVaultMeta from '../contracts/AvaxAgentVault.json'

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
}

// Default or deployed contract address on Fuji
export const CONTRACT_ADDRESS = (import.meta as any).env?.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'
export const CONTRACT_ABI = AvaxAgentVaultMeta.abi

export async function switchToFuji(): Promise<boolean> {
  const ethereum = (window as any).ethereum
  if (!ethereum) {
    alert('Please install Core Wallet or MetaMask!')
    return false
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: FUJI_CHAIN_CONFIG.chainId }],
    })
    return true
  } catch (switchError: any) {
    // 4902: Unrecognized chain, prompt to add
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

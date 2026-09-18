import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { AgentWorkspace } from './components/AgentWorkspace'
import { FaucetModal } from './components/FaucetModal'


export function App() {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [balance, setBalance] = useState<string>('0')
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [isFaucetOpen, setIsFaucetOpen] = useState<boolean>(false)

  const refreshBalance = useCallback(async () => {
    if (provider && account) {
      try {
        const balWei = await provider.getBalance(account)
        setBalance(ethers.formatEther(balWei))
      } catch (e) {
        console.error('Failed to get balance:', e)
      }
    }
  }, [provider, account])

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum
    if (!ethereum) {
      alert('No Web3 wallet found! Please install Core Wallet (https://core.app) or MetaMask.')
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

      const balWei = await browserProvider.getBalance(accounts[0])
      setBalance(ethers.formatEther(balWei))
    } catch (err: any) {
      console.error('Connection rejected or error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  useEffect(() => {
    const ethereum = (window as any).ethereum
    if (!ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0])
        refreshBalance()
      } else {
        setAccount(null)
        setBalance('0')
      }
    }

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16))
      refreshBalance()
    }

    ethereum.on('accountsChanged', handleAccountsChanged)
    ethereum.on('chainChanged', handleChainChanged)

    // Auto connect if already authorized
    const initCheck = async () => {
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
    initCheck()

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged)
      ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [refreshBalance])

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

      <main className="flex-1">
        <Hero />
        <AgentWorkspace
          account={account}
          provider={provider}
          refreshBalance={refreshBalance}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>
          AvaxAgent • Avalanche Builder Day Shenzhen 2026 • Powered by Sub-second Finality & Fuji C-Chain
        </p>
      </footer>

      {/* Faucet Quick Modal */}
      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
        account={account}
      />
    </div>
  )
}

export default App

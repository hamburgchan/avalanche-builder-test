import { Wallet, Globe, ShieldCheck, Zap } from 'lucide-react'

import { FUJI_CHAIN_CONFIG, switchToFuji } from '../config/avalanche'


interface NavbarProps {
  account: string | null
  chainId: number | null
  balance: string
  isConnecting: boolean
  onConnect: () => void
  onOpenFaucet: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  account,
  chainId,
  balance,
  isConnecting,
  onConnect,
  onOpenFaucet,
}) => {
  const isFuji = chainId === FUJI_CHAIN_CONFIG.chainIdDecimal

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center shadow-lg shadow-red-500/20 ring-1 ring-white/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tight text-white">AvaxAgent</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-red-500/10 text-red-400 border border-red-500/20">
                Fuji Testnet
              </span>
            </div>
            <p className="text-xs text-slate-400">Sub-second Autonomous Paymaster</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Faucet Link Button */}
          <button
            onClick={onOpenFaucet}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition"
          >
            <Globe className="w-3.5 h-3.5 text-red-400" />
            <span>Claim AVAX</span>
          </button>

          {/* Network Switcher */}
          {account && (
            <button
              onClick={switchToFuji}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                isFuji
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isFuji ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{isFuji ? 'Avalanche Fuji (43113)' : 'Switch to Fuji'}</span>
            </button>
          )}

          {/* Connect / Account Button */}
          {account ? (
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 pl-3 shadow-inner">
              <div className="text-right mr-3 hidden md:block">
                <div className="text-xs font-mono font-medium text-slate-200">
                  {parseFloat(balance).toFixed(3)} AVAX
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-600/30 transition transform active:scale-95 disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              <span>{isConnecting ? 'Connecting...' : 'Connect Core / Web3'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

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
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Tagline */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-500/20 ring-1 ring-white/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight text-white">AvaFence</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
                Fuji C-Chain
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-900 text-slate-400 border border-slate-800 font-semibold">
                v1.4.0
              </span>
            </div>
            <p className="text-xs text-slate-400">AI Agent 资金权限边界 · Financial Boundaries for Autonomous AI Agents</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenFaucet}
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
          >
            <Globe className="w-3 h-3 text-red-400" />
            <span>Fuji Faucet</span>
          </button>

          {account && (
            <button
              onClick={switchToFuji}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                isFuji
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isFuji ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{isFuji ? 'Fuji 测试网 (43113)' : '切换至 Fuji (Switch)'}</span>
            </button>
          )}

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
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-600/30 transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>{isConnecting ? '连接中...' : '连接钱包 (MetaMask / Core)'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

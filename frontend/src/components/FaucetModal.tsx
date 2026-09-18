import { useState } from 'react'
import { X, ExternalLink, Copy, Check, Droplets } from 'lucide-react'


interface FaucetModalProps {
  isOpen: boolean
  onClose: () => void
  account: string | null
}

export const FaucetModal: React.FC<FaucetModalProps> = ({ isOpen, onClose, account }) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Avalanche Fuji Faucets</h3>
            <p className="text-xs text-slate-400">Get free testnet AVAX for hackathon development</p>
          </div>
        </div>

        {/* User Account */}
        {account && (
          <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-1">Your Connected Address:</div>
            <div className="flex items-center justify-between font-mono text-xs text-slate-200">
              <span className="truncate mr-2">{account}</span>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Faucet Links */}
        <div className="space-y-2.5 mb-5">
          <a
            href="https://core.app/tools/testnet-faucet"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-red-500/40 hover:bg-red-500/5 transition group"
          >
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-red-400 transition">
                Core Testnet Faucet (Recommended)
              </div>
              <div className="text-xs text-slate-400">Fastest with Core Wallet integration</div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
          </a>

          <a
            href="https://build.avax.network/console/primary-network/faucet"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-red-500/40 hover:bg-red-500/5 transition group"
          >
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-red-400 transition">
                Avalanche Builder Hub Faucet
              </div>
              <div className="text-xs text-slate-400">Official developer portal faucet</div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-white transition"
        >
          Done
        </button>
      </div>
    </div>
  )
}

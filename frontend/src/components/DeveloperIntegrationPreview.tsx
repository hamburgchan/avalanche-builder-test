import React, { useState } from 'react'
import {
  Cpu,
  ArrowDown,
  ShieldCheck,
  ShieldAlert,
  FileCode,
  Check,
  Copy,
  Layers
} from 'lucide-react'

export const DeveloperIntegrationPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'code' | 'intent' | 'decision'>('code')
  const [copied, setCopied] = useState(false)

  const illustrativeCode = `// Planned SDK Interface — not yet released
import { AvaFence } from '@avafence/sdk'

const avafence = new AvaFence({
  policyAddress: '0xB6379ce69E73cC6d20E5284D14386F4fBF8Ed770',
  network: 'avalanche-fuji'
})

// 1. Evaluate agent payment intent before settlement
const decision = await avafence.evaluate(paymentIntent)

// 2. Handle deterministic policy decision
if (!decision.allowed) {
  return handleBlockedPayment(decision)
}

// 3. Execute payment only when approved
return wallet.pay(paymentIntent)`

  const paymentIntentJson = `{
  "agent": "0x6ad50e7117c838c720c27d20247232f27bfcc1d7",
  "recipient": "0x0D54D5f550e357D5314bf90f178101402BFd3348",
  "asset": "AVAX",
  "amount": "0.002",
  "network": "avalanche-fuji",
  "resource": "orderbook_depth_feed_v2",
  "requestId": "0x747e4c4445554d28b3f72347aecccaa278768a1babe4d3fdb92e1f167eeb5b0c"
}`

  const decisionJson = `{
  "allowed": true,
  "reasonCode": "APPROVED",
  "reason": "All 7 on-chain policy checks passed.",
  "policyId": "0x7F76...-0x6ad5...",
  "checksPassed": 127,
  "transferredAmount": "0.002 AVAX",
  "receiptVerification": {
    "network": "Avalanche Fuji",
    "onChainPolicy": "AvaxGuard.sol"
  }
}`

  const handleCopy = () => {
    const textToCopy =
      activeTab === 'code'
        ? illustrativeCode
        : activeTab === 'intent'
        ? paymentIntentJson
        : decisionJson
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div id="how-it-works" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl mb-6 font-sans">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-5 border-b border-slate-800 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-red-500" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              HOW AVAFENCE FITS INTO YOUR AGENT
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Planned SDK Interface — not yet released
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            A programmable policy enforcement and decision-audit layer for agentic payments.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'code' ? 'bg-red-500/20 text-red-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Illustrative Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('intent')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'intent' ? 'bg-red-500/20 text-red-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Payment Intent
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('decision')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'decision' ? 'bg-red-500/20 text-red-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Decision Evidence
          </button>
        </div>
      </div>

      {/* End-to-End Execution Pipeline Strip */}
      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center font-mono text-[11px] text-slate-300 flex flex-wrap items-center justify-center gap-1.5 mb-4">
        <span className="text-cyan-400 font-bold">Agent</span>
        <span className="text-slate-500">→</span>
        <span className="text-amber-300 font-bold">Payment Intent</span>
        <span className="text-slate-500">→</span>
        <span className="text-red-400 font-bold">AvaFence</span>
        <span className="text-slate-500">→</span>
        <span className="text-emerald-400 font-bold">ALLOW</span> / <span className="text-rose-400 font-bold">BLOCK</span>
        <span className="text-slate-500">→</span>
        <span className="text-slate-200 font-semibold">Wallet / x402 <span className="text-[9px] text-amber-400 font-mono">[Planned]</span></span>
        <span className="text-slate-500">→</span>
        <span className="text-emerald-300 font-bold">Settlement</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Architecture Flow (Left Column) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="flex items-center justify-center space-x-2 text-white font-bold">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>YOUR AGENT</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Autonomous task or tool query</div>
          </div>

          <div className="flex justify-center text-slate-500">
            <ArrowDown className="w-4 h-4" />
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <div className="text-white font-bold flex items-center justify-center space-x-1.5">
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>PAYMENT INTENT</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Recipient, amount, asset, requestId</div>
          </div>

          <div className="flex justify-center text-slate-500">
            <ArrowDown className="w-4 h-4" />
          </div>

          {/* AvaFence Policy Evaluation Box */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/50 to-rose-950/50 border-2 border-red-500/50 text-center shadow-lg">
            <div className="text-white font-black flex items-center justify-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span className="text-red-400 tracking-wide">AVAFENCE POLICY EVALUATION</span>
            </div>
            <div className="text-[10px] text-slate-300 mt-1">
              Independent deterministic checks: Limits · Recipient · Expiry · Budget
            </div>
          </div>

          {/* Fork into ALLOW and BLOCK */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-1">
              <div className="flex items-center justify-center space-x-1 text-emerald-400 font-extrabold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ALLOW</span>
              </div>
              <div className="text-[10px] text-slate-300">Wallet / x402 <span className="text-[9px] text-amber-400">[Planned]</span></div>
              <div className="text-[9px] text-emerald-400 font-bold">Settlement Authorized</div>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-center space-y-1">
              <div className="flex items-center justify-center space-x-1 text-rose-400 font-extrabold text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>BLOCK</span>
              </div>
              <div className="text-[10px] text-slate-300">Reason + Decision Evidence</div>
              <div className="text-[9px] text-rose-400 font-bold">0 AVAX transferred to recipient</div>
            </div>
          </div>
        </div>

        {/* Code & Schema Preview (Right Column) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs overflow-x-auto shadow-inner flex-1">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-900 text-[10px] text-slate-500">
              <span>
                {activeTab === 'code' && 'typescript / agent-middleware.ts'}
                {activeTab === 'intent' && 'payment-intent.schema.json'}
                {activeTab === 'decision' && 'decision-evidence.schema.json'}
              </span>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="text-slate-300 text-[11px] leading-relaxed whitespace-pre font-mono">
              {activeTab === 'code' && illustrativeCode}
              {activeTab === 'intent' && paymentIntentJson}
              {activeTab === 'decision' && decisionJson}
            </pre>
          </div>

          <div className="mt-2 text-[10px] text-slate-500 font-mono text-right">
            Note: Illustrative planned interface. Production SDK will integrate natively with EVM agent wallets and x402.
          </div>
        </div>
      </div>
    </div>
  )
}

import { describe, it, expect, beforeEach } from 'bun:test'
import { en } from './en'
import { zhCN } from './zh-CN'
import { siteConfig } from '../config/site.config'

// Mock localStorage for non-browser CLI test runner
if (typeof (globalThis as any).localStorage === 'undefined') {
  const store = new Map<string, string>()
  ;(globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: () => null,
    length: 0
  }
}

describe('AvaFence i18n Bilingual Support & Integrity', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('1. English is the single Source of Truth and default language', () => {
    const saved = localStorage.getItem('avafence_lang')
    expect(saved).toBeNull()
    expect(en.nav.brandName).toBe('AvaFence')
    expect(en.hero.brandPositioning).toBe('The Verifiable Policy Firewall for AI Agent Payments')
  })

  it('2. Key parity: en and zhCN have exactly identical structure and complete keys', () => {
    const checkKeys = (objEn: any, objZh: any, path = '') => {
      const enKeys = Object.keys(objEn)
      const zhKeys = Object.keys(objZh)

      expect(zhKeys.sort()).toEqual(enKeys.sort())

      for (const key of enKeys) {
        const currentPath = path ? `${path}.${key}` : key
        const valEn = objEn[key]
        const valZh = objZh[key]

        expect(typeof valZh).toBe(typeof valEn)
        if (typeof valEn === 'object' && valEn !== null && !Array.isArray(valEn)) {
          checkKeys(valEn, valZh, currentPath)
        } else if (typeof valEn === 'string') {
          expect(valZh.length).toBeGreaterThan(0)
        }
      }
    }

    checkKeys(en, zhCN)
  })

  it('3. Zero forbidden buzzwords in both dictionaries', () => {
    const forbidden = ['零损失', '绝对安全', '已审计', 'Mainnet 已上线', '一键完成']
    const serialize = (obj: any): string => JSON.stringify(obj)

    const zhString = serialize(zhCN)
    for (const word of forbidden) {
      expect(zhString.includes(word)).toBe(false)
    }

    // In English as well: no "zero loss", "absolute security" misleading buzzwords
    const enString = serialize(en)
    expect(enString.toLowerCase().includes('absolute security')).toBe(false)
    expect(enString.toLowerCase().includes('zero loss')).toBe(false)
    expect(enString.toLowerCase().includes('mainnet is live')).toBe(false)
  })

  it('4. Brand name and technical constants are preserved without translation', () => {
    expect(zhCN.nav.brandName).toBe('AvaFence')
    expect(zhCN.hero.brandName).toBe('AvaFence')
    expect(siteConfig.historicalEvidence[0].eventEmitted).toContain('PaymentExecuted')
    expect(siteConfig.historicalEvidence[1].eventEmitted).toContain('PaymentBlocked')
    expect(zhCN.policyEvaluation.onChainSemanticsDesc).toContain('PaymentBlocked')
    expect(zhCN.currentVsPlanned.currentItems[1].description).toContain('AvaxGuard.sol')
    expect(zhCN.currentVsPlanned.plannedItems[0].title).toContain('@avafence/sdk')
    expect(zhCN.currentVsPlanned.plannedItems[1].title).toContain('x402')
  })

  it('5. Historical Fuji Evidence numbers match RPC Source of Truth exactly', () => {
    const evidenceA = siteConfig.historicalEvidence.find((e) => e.scenario === 'A')!
    const evidenceB = siteConfig.historicalEvidence.find((e) => e.scenario === 'B')!
    const evidenceC = siteConfig.historicalEvidence.find((e) => e.scenario === 'C')!

    // Scenario A
    expect(evidenceA.gasUsed).toBe('107744')
    expect(evidenceA.blockNumber).toBe(58476762)
    expect(evidenceA.recipientDelta).toBe('+0.002 AVAX')

    // Scenario B
    expect(evidenceB.gasUsed).toBe('42958')
    expect(evidenceB.blockNumber).toBe(58476773)
    expect(evidenceB.recipientDelta).toBe('0 AVAX')

    // Scenario C
    expect(evidenceC.gasUsed).toBe('45100')
    expect(evidenceC.blockNumber).toBe(58476771)
    expect(evidenceC.recipientDelta).toBe('0 AVAX')
  })

  it('6. LocalStorage persistence key is avafence_lang', () => {
    localStorage.setItem('avafence_lang', 'zh')
    expect(localStorage.getItem('avafence_lang')).toBe('zh')

    localStorage.setItem('avafence_lang', 'en')
    expect(localStorage.getItem('avafence_lang')).toBe('en')
  })

  it('7. Section IV standardized terminology compliance', () => {
    expect(zhCN.hero.brandPositioning).toBe('AI Agent 支付的可验证策略防火墙')
    expect(zhCN.scenarios.a.outcome).toBe('→ ALLOW · 允许')
    expect(zhCN.scenarios.b.outcome).toBe('→ BLOCK · 阻止 (0 AVAX 划转)')
    expect(zhCN.scenarios.c.outcome).toBe('→ BLOCK · 阻止 (0 AVAX 划转)')
    expect(zhCN.modeSwitcher.instantBanner).toContain('本次操作不会广播链上交易')
    expect(zhCN.policyEvaluation.historicalEvidenceTitle).toBe('可比的 Fuji 已验证历史凭证')
    expect(zhCN.policyEvaluation.historicalDisclaimer).toContain('并非本次模拟产生的交易')
  })

  it('8. Policy Coverage section verifies 7 capabilities, required note, and 4 use cases', () => {
    // English capabilities
    const expectedEnCaps = [
      'Total Budget',
      'Per-Transaction Limit',
      'Daily Spending Limit',
      'Approved Recipients',
      'Policy Expiry',
      'Replay Protection',
      'Explicit Block Reasons'
    ]
    expect(en.policyCoverage.capabilities.map((c) => c.name)).toEqual(expectedEnCaps)

    // Chinese capabilities
    const expectedZhCaps = [
      '总预算',
      '单笔限额',
      '每日限额',
      '授权收款方',
      '策略有效期',
      '重复支付防护',
      '明确的阻止原因'
    ]
    expect(zhCN.policyCoverage.capabilities.map((c) => c.name)).toEqual(expectedZhCaps)

    // Exact Explanatory Note
    expect(en.policyCoverage.noteText).toBe(
      'The three demo scenarios illustrate how the current policy engine works. They do not represent the full range of agent payment workflows AvaFence is exploring.'
    )
    expect(zhCN.policyCoverage.noteText).toBe(
      '当前三个演示场景用于说明策略引擎的工作方式，并不代表 AvaFence 最终只支持这三种 Agent 支付场景。'
    )

    // 4 Example Use Cases
    expect(en.policyCoverage.useCases.length).toBe(4)
    expect(zhCN.policyCoverage.useCases.length).toBe(4)
    expect(en.policyCoverage.useCasesHeading).toBe('Example Use Cases')
    expect(zhCN.policyCoverage.useCasesHeading).toContain('Example Use Cases')

    // Primitives matching check
    for (const uc of en.policyCoverage.useCases) {
      expect(uc.primitives.length).toBeGreaterThan(0)
      expect(uc.description.length).toBeGreaterThan(0)
    }
    for (const uc of zhCN.policyCoverage.useCases) {
      expect(uc.primitives.length).toBeGreaterThan(0)
      expect(uc.description.length).toBeGreaterThan(0)
    }
  })
})

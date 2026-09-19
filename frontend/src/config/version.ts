export interface VersionInfo {
  version: string
  name: string
  date: string
  description: string
}

export const CURRENT_VERSION: VersionInfo = {
  version: '1.4.0',
  name: 'AvaFence State-Machine & Brand Consistency (Final UI Freeze)',
  date: '2026-09-19',
  description: 'AvaFence 品牌升级与单一状态机收敛：完全隔离跨 Scene 状态、统一 DemoStage 状态机驱动、严格三行证据收口与投影优化，最终封版'
}

export const VERSION_HISTORY: VersionInfo[] = [
  {
    version: '1.4.0',
    name: 'AvaFence State-Machine & Brand Consistency (Final UI Freeze)',
    date: '2026-09-19',
    description: 'AvaFence 品牌升级与单一状态机收敛：完全隔离跨 Scene 状态、统一 DemoStage 状态机驱动、严格三行证据收口与投影优化，最终封版'
  },
  {
    version: '1.3.1',
    name: 'Final Demo Polish & Semantic Consistency Pass',
    date: '2026-09-19',
    description: '终版语义与状态一致性收敛：分离判定与网络存证、任务时间线驱动同步、注入叙事强化与证据去噪'
  },
  {
    version: '1.3.0',
    name: 'Product Story & Demo Experience Restructure',
    date: '2026-09-19',
    description: '产品故事重构：以 Autonomous Research Agent 真实任务为主舞台，64/36 主次平衡布局，业务化场景与注入攻击强对比，AvaxGuard 全景链上守护'
  },
  {
    version: '1.2.1',
    name: 'Demo Clarity & Evidence Strengthening Pass',
    date: '2026-09-19',
    description: '全局状态机归一、中央 Demo 流程绝对主线、动态判定流与 Skipped 标记、Live Proof 证据卡强化与全景真实存证'
  },
  {
    version: '1.2.0',
    name: 'Hackathon Demo Stage Optimization',
    date: '2026-09-19',
    description: 'Demo-first 演示舞台级优化：高度压缩首屏、单行架构流、28/46/26 黄金视觉焦点、渐进式决策追踪、巨幕级判决'
  },
  {
    version: '1.1.0',
    name: 'Chinese Localization',
    date: '2026-09-19',
    description: 'UI 风格与中文本地化升级，保留行业通用英文术语与雪崩共识标识'
  },
  {
    version: '1.0.0',
    name: 'Baseline English UI',
    date: '2026-09-19',
    description: 'Initial Hackathon Live Release (Verified on Avalanche Fuji C-Chain)'
  }
]

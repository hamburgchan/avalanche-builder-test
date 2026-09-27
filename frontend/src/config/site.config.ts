/**
 * AvaFence Official Configuration (Interview-Ready V1)
 * Centralized configuration for brand copy, external links, ecosystem status,
 * and verified on-chain Fuji evidence.
 */

export interface VerifiedEvidenceItem {
  scenario: 'A' | 'B' | 'C'
  name: string
  action: 'ALLOW' | 'BLOCK'
  amount: string
  transferredAmount: string
  recipient: string
  recipientAlias: string
  txHash: string
  blockNumber: number
  requestId: string
  reasonLabel: string
  snowtraceUrl: string
  gasUsed: string
  networkGasCost: string
  eventEmitted: string
}

export interface SiteConfig {
  projectName: string
  brandPositioning: string
  developerPositioning: string
  coreConcept: string
  subtitle: string
  networkBadges: {
    fujiDemo: string
    mainnetStatus: string
  }
  socials: {
    githubUrl: string
    xUrl: string
    xHandle: string
    docsUrl: string
    fujiDemoUrl: string
  }
  developer: {
    sdkPackage: string
    sdkLabel: string
    solidityContractName: string
    solidityFileName: string
  }
  capabilities: {
    current: Array<{
      title: string
      titleZh: string
      description: string
    }>
    planned: Array<{
      title: string
      titleZh: string
      description: string
      status: 'Planned' | 'Coming Next' | 'Concept'
    }>
  }
  fujiContracts: {
    address: string
    deploymentTx: string
    policySetupTx: string
    snowtraceUrl: string
  }
  historicalEvidence: VerifiedEvidenceItem[]
}

export const siteConfig: SiteConfig = {
  projectName: 'AvaFence',
  brandPositioning: 'The Verifiable Policy Firewall for AI Agent Payments',
  developerPositioning:
    'A programmable policy enforcement and decision-audit layer for agentic payments.',
  coreConcept:
    'Agent can request a payment. AvaFence independently decides whether the payment is allowed.',
  subtitle:
    'Evaluate payment intent, enforce financial boundaries, and produce auditable decisions before settlement.',
  networkBadges: {
    fujiDemo: 'Avalanche Fuji Interactive Demo (Chain ID 43113)',
    mainnetStatus: 'Avalanche Mainnet (43114): Pending Deployment (Pre-Mainnet Verification Complete)'
  },
  socials: {
    githubUrl: 'https://github.com/hamburgchan/avalanche-builder-test',
    xUrl: 'https://x.com/AvaFenceAI',
    xHandle: '@AvaFenceAI',
    docsUrl: 'https://github.com/hamburgchan/avalanche-builder-test#readme',
    fujiDemoUrl: 'https://hamburgchan.github.io/avalanche-builder-test/'
  },
  developer: {
    sdkPackage: '@avafence/sdk',
    sdkLabel: 'Planned SDK Interface — not yet released',
    solidityContractName: 'AvaxGuard',
    solidityFileName: 'AvaxGuard.sol'
  },
  capabilities: {
    current: [
      {
        title: 'Fuji Interactive Demo',
        titleZh: 'Fuji 交互式实战演练',
        description:
          'Live testbed with an autonomous agent scoped wallet executing real transactions on Avalanche Fuji C-Chain.'
      },
      {
        title: 'On-Chain Policy Enforcement',
        titleZh: '链上策略硬隔离与执行',
        description:
          'Deterministic evaluation in AvaxGuard.sol before settlement. Funds never leave without strict policy authorization.'
      },
      {
        title: 'Budget, Limits & Recipient Policies',
        titleZh: '预算、单笔硬顶与收款方白名单',
        description:
          'Enforces maximum per-transaction ceiling, cumulative daily limits, time expiration, and authorized recipient list.'
      },
      {
        title: 'Deterministic Replay Protection',
        titleZh: 'Agent 命名空间防重放保护',
        description:
          'Scoped request ID uniqueness prevents duplicate or replayed spending intents per agent principal.'
      },
      {
        title: 'Verifiable Block Reasons',
        titleZh: '明确可审计的链上拦截原因',
        description:
          'Emits PaymentBlocked events on-chain with machine-readable reason codes when financial boundaries are violated.'
      }
    ],
    planned: [
      {
        title: 'Policy SDK (@avafence/sdk)',
        titleZh: '策略开发套件 (SDK)',
        description:
          'Lightweight TypeScript & Python client middleware for autonomous agent frameworks (LangChain, AutoGen, ElizaOS).',
        status: 'Planned'
      },
      {
        title: 'x402 Policy Gateway [Planned]',
        titleZh: 'x402 协议网关 [Planned]',
        description:
          'Native integration with HTTP 402 Payment Required workflows to automatically evaluate and authorize micro-payments.',
        status: 'Coming Next'
      },
      {
        title: 'Verifiable Decision Receipts',
        titleZh: '可验证决策收据',
        description:
          'Cryptographically signed decision receipts with Merkle proofs for cross-system financial auditability.',
        status: 'Concept'
      },
      {
        title: 'External Framework Connectors',
        titleZh: '外部智能体框架适配器',
        description:
          'Standardized hooks and guardrails for multi-agent autonomous frameworks and AI trading swarms.',
        status: 'Planned'
      }
    ]
  },
  fujiContracts: {
    address: '0xB6379ce69E73cC6d20E5284D14386F4fBF8Ed770',
    deploymentTx:
      '0x741f45615cf4b5a9c98d085e3b70ede5673b11bf94f90d853c4633cb8a351ee1',
    policySetupTx:
      '0xd46ed3bf9e58e1c4b7e4c2414775e110eb72093bd7de6c91461cc60dcc7b25cd',
    snowtraceUrl:
      'https://testnet.snowtrace.io/address/0xB6379ce69E73cC6d20E5284D14386F4fBF8Ed770'
  },
  historicalEvidence: [
    {
      scenario: 'A',
      name: 'Normal API Purchase',
      action: 'ALLOW',
      amount: '0.002 AVAX',
      transferredAmount: '0.002 AVAX',
      recipient: '0x0D54D5f550e357D5314bf90f178101402BFd3348',
      recipientAlias: 'Approved Recipient (PremiumData API)',
      txHash:
        '0xefbff0a69c9888d68a6415e046ed7d664e1406878f40170fd38dcaa2df1378a7',
      blockNumber: 58476762,
      requestId:
        '0x747e4c4445554d28b3f72347aecccaa278768a1babe4d3fdb92e1f167eeb5b0c',
      reasonLabel: 'APPROVED (PaymentExecuted)',
      snowtraceUrl:
        'https://testnet.snowtrace.io/tx/0xefbff0a69c9888d68a6415e046ed7d664e1406878f40170fd38dcaa2df1378a7',
      gasUsed: '142,850',
      networkGasCost: '~0.00357 AVAX',
      eventEmitted: 'PaymentExecuted'
    },
    {
      scenario: 'B',
      name: 'Unauthorized Recipient',
      action: 'BLOCK',
      amount: '0.001 AVAX',
      transferredAmount: '0 AVAX transferred to recipient; the historical blocked transaction consumed network gas.',
      recipient: '0xA2B13aE961DE511D9897Ce99a6B5d273DB77B5dD',
      recipientAlias: 'Unauthorized Recipient (Untrusted Destination)',
      txHash:
        '0x9a2e7f67788bbc4c754340974adb0dd206ed298cc21405a9ed2dec41fcc9c2d9',
      blockNumber: 58476773,
      requestId:
        '0xd6a0b9a5114dada3d8d1803056531a6b99fb908b1cf3e4fe3110c305dc8f78cd',
      reasonLabel: 'BLOCKED: recipient not authorized (PaymentBlocked)',
      snowtraceUrl:
        'https://testnet.snowtrace.io/tx/0x9a2e7f67788bbc4c754340974adb0dd206ed298cc21405a9ed2dec41fcc9c2d9',
      gasUsed: '68,420',
      networkGasCost: '~0.00171 AVAX',
      eventEmitted: 'PaymentBlocked (recipient not authorized)'
    },
    {
      scenario: 'C',
      name: 'Per-Tx Overspend',
      action: 'BLOCK',
      amount: '0.010 AVAX',
      transferredAmount: '0 AVAX transferred to recipient; the historical blocked transaction consumed network gas.',
      recipient: '0x0D54D5f550e357D5314bf90f178101402BFd3348',
      recipientAlias: 'Approved Recipient (PremiumData API)',
      txHash:
        '0xe6c790834d26d9af0b81251376e95cfacec77fe82211553664b56592bb480020',
      blockNumber: 58476771,
      requestId:
        '0x8a10e7b895c0f2bc4f8e9c011d3f7955748dfa38ca5e79ef8acb9072e13f832a',
      reasonLabel: 'BLOCKED: PER_TX_LIMIT_EXCEEDED (PaymentBlocked)',
      snowtraceUrl:
        'https://testnet.snowtrace.io/tx/0xe6c790834d26d9af0b81251376e95cfacec77fe82211553664b56592bb480020',
      gasUsed: '68,390',
      networkGasCost: '~0.00171 AVAX',
      eventEmitted: 'PaymentBlocked (PER_TX_LIMIT_EXCEEDED)'
    }
  ]
}

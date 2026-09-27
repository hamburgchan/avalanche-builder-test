import { ethers } from 'ethers'
import { DEMO_ADDRESSES, BlockReason } from '../config/avalanche'
import type { FulfillmentResult } from '../services/merchant'

export type DemoScenario = 'A' | 'B' | 'C'

export type DemoStage =
  | 'IDLE'
  | 'PREPARING'
  | 'POLICY_EVALUATING'
  | 'POLICY_VISUALIZING'
  | 'TX_SUBMITTING'
  | 'TX_BROADCAST'
  | 'WAITING_ACCEPTANCE'
  | 'TX_ACCEPTED'
  | 'MERCHANT_VERIFYING'
  | 'SERVICE_RELEASED'
  | 'TASK_COMPLETED'
  | 'BLOCKED_COMPLETED'
  | 'EXECUTION_ERROR'

export interface DemoSpendIntent {
  requestId: string
  serviceName: string
  recipient: string
  recipientAlias: string
  // Legacy aliases for backwards compatibility
  merchant: string
  merchantAlias: string
  amount: string
  taskDescription: string
  sceneType: DemoScenario
  secondaryExplanation?: string
}

export interface DemoExecution {
  executionId: string
  scenario: DemoScenario
  stage: DemoStage
  requestId: string
  spendIntent: DemoSpendIntent
  revealStep: number
  checksPassed: number | null
  previewVerdict: BlockReason | null
  verdict: BlockReason | null
  blockReason: BlockReason | null
  verdictMismatch?: boolean
  transferredAmount: string
  plainReason: string
  networkStatus: 'IDLE' | 'READY' | 'SUBMITTING' | 'BROADCAST' | 'WAITING' | 'ACCEPTED' | 'ERROR'
  txHash: string | null
  blockNumber: number | null
  gasUsed: string | null
  acceptanceLatencyMs: number | null
  latencySource?: 'WSS' | 'POLLING' | 'TIMEOUT'
  networkGasCost: string | null
  merchantResult?: FulfillmentResult | null
  executionLogs: string[]
  errorMessage?: string | null
  errorStage?: DemoStage | null
}

export function createInitialSpendIntent(scenario: DemoScenario, nonce: number): DemoSpendIntent {
  if (scenario === 'A') {
    return {
      requestId: ethers.id(`req_orderbook_${nonce}`),
      serviceName: 'Orderbook API (高频订单簿深度数据)',
      recipient: DEMO_ADDRESSES.MERCHANT,
      recipientAlias: 'Approved Recipient (PremiumData API)',
      merchant: DEMO_ADDRESSES.MERCHANT,
      merchantAlias: 'Approved Recipient (PremiumData API)',
      amount: '0.002',
      taskDescription: 'Agent requests 0.002 AVAX for high-resolution orderbook depth API within authorized limits.',
      sceneType: 'A'
    }
  } else if (scenario === 'B') {
    // Scenario B: Unauthorized Recipient (0.001 AVAX -> BLOCK -> 0 AVAX transferred)
    return {
      requestId: ethers.id(`req_unauthorized_${nonce}`),
      serviceName: 'External Query Payment (第三方工具调用)',
      recipient: DEMO_ADDRESSES.ATTACKER,
      recipientAlias: 'Unauthorized Recipient (Unknown Destination)',
      merchant: DEMO_ADDRESSES.ATTACKER,
      merchantAlias: 'Unauthorized Recipient (Unknown Destination)',
      amount: '0.001',
      taskDescription: 'Untrusted tool response changed the payment destination. Recipient is not authorized by policy.',
      secondaryExplanation: 'Untrusted tool response changed the payment destination.',
      sceneType: 'B'
    }
  } else {
    // Scenario C: Per-Tx Overspend (0.010 AVAX -> BLOCK -> 0 AVAX transferred)
    return {
      requestId: ethers.id(`req_overspend_${nonce}`),
      serviceName: 'Institutional HFT Dataset (机构深度专享数据)',
      recipient: DEMO_ADDRESSES.MERCHANT,
      recipientAlias: 'Approved Recipient (PremiumData API)',
      merchant: DEMO_ADDRESSES.MERCHANT,
      merchantAlias: 'Approved Recipient (PremiumData API)',
      amount: '0.010',
      taskDescription: 'Agent attempts to purchase premium dataset for 0.010 AVAX, exceeding the 0.003 AVAX per-transaction limit.',
      sceneType: 'C'
    }
  }
}

export function createInitialExecution(scenario: DemoScenario, nonce = Date.now() % 1000000): DemoExecution {
  const intent = createInitialSpendIntent(scenario, nonce)
  return {
    executionId: `exec_${scenario}_${nonce}`,
    scenario,
    stage: 'IDLE',
    requestId: intent.requestId,
    spendIntent: intent,
    revealStep: -1,
    checksPassed: null,
    previewVerdict: null,
    verdict: null,
    blockReason: null,
    verdictMismatch: false,
    transferredAmount: '0 AVAX',
    plainReason: '',
    networkStatus: 'IDLE',
    txHash: null,
    blockNumber: null,
    gasUsed: null,
    acceptanceLatencyMs: null,
    latencySource: 'WSS',
    networkGasCost: null,
    merchantResult: null,
    executionLogs: [],
    errorMessage: null,
    errorStage: null
  }
}

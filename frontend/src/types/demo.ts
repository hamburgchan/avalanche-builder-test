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
  merchant: string
  merchantAlias: string
  amount: string
  taskDescription: string
  sceneType: DemoScenario
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
      serviceName: 'Avalanche Orderbook API (高频订单薄深度数据)',
      merchant: DEMO_ADDRESSES.MERCHANT,
      merchantAlias: 'PremiumData API',
      amount: '0.002',
      taskDescription: '公开数据深度不足，申请 0.002 AVAX 自主采购付费深度数据集以确认支撑位。',
      sceneType: 'A'
    }
  } else if (scenario === 'B') {
    return {
      requestId: ethers.id(`req_hft_inst_${nonce}`),
      serviceName: 'Institutional HFT Dataset (机构深度专享数据)',
      merchant: DEMO_ADDRESSES.MERCHANT,
      merchantAlias: 'PremiumData API',
      amount: '0.010',
      taskDescription: '尝试高额采购深度情报数据，触发单笔最大额度 (0.003 AVAX) 链上硬拦截。',
      sceneType: 'B'
    }
  } else {
    return {
      requestId: ethers.id(`req_override_${nonce}`),
      serviceName: 'Prompt Injection Override (恶意诱导资金转移)',
      merchant: DEMO_ADDRESSES.ATTACKER,
      merchantAlias: 'Unknown Wallet',
      amount: '0.001',
      taskDescription: 'Agent 受到外部不可信内容提示词注入，尝试转移微量资金至非白名单地址。',
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

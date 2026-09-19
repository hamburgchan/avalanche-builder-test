import { ethers } from 'ethers'
import { getAvaxGuardAddress, AVAX_GUARD_ABI, DEMO_ADDRESSES } from '../config/avalanche'

export interface FulfillmentResult {
  success: boolean
  message: string
  disclaimer?: string
  dataset?: {
    asset: string
    timestamp: string
    bestBid: number
    bestAsk: number
    liquidityScore: string
    sentimentIndicator: string
    institutionalFlows: string
  }
}

class MerchantFulfillmentService {
  // In-memory client-side replay tracker for hackathon demo
  private usedTxHashes: Set<string> = new Set()
  private iface: ethers.Interface = new ethers.Interface(AVAX_GUARD_ABI)

  public async verifyAndFulfill(
    txHash: string,
    requestId: string,
    expectedAgent: string,
    expectedPriceWei: bigint,
    provider: ethers.BrowserProvider | ethers.JsonRpcProvider,
    customGuardAddress?: string
  ): Promise<FulfillmentResult> {
    const targetGuard = (customGuardAddress || getAvaxGuardAddress()).toLowerCase()
    const normalizedTx = txHash.toLowerCase()

    // 0. Anti-replay check
    if (this.usedTxHashes.has(normalizedTx)) {
      return {
        success: false,
        message: 'Replay rejected: Transaction hash already consumed by merchant service.',
        disclaimer: 'Client-side merchant verifier demo — not production persistent replay protection'
      }
    }

    try {
      // 1. Verify Network Chain ID == 43113 (Fuji)
      const network = await provider.getNetwork()
      if (Number(network.chainId) !== 43113) {
        return {
          success: false,
          message: `Network mismatch: ChainId ${network.chainId} is not Avalanche Fuji (43113).`,
          disclaimer: 'Client-side merchant verifier demo — not production persistent replay protection'
        }
      }

      // 2. Fetch Transaction Receipt
      const receipt = await provider.getTransactionReceipt(normalizedTx)
      if (!receipt) {
        return {
          success: false,
          message: 'Transaction receipt not found on Avalanche Fuji.',
          disclaimer: 'Client-side merchant verifier demo — not production persistent replay protection'
        }
      }

      // 3. Receipt Status must be 1 (Success)
      if (receipt.status !== 1) {
        return {
          success: false,
          message: 'Transaction execution reverted or failed on-chain.',
          disclaimer: 'Client-side merchant verifier demo — not production persistent replay protection'
        }
      }

      // 4. Receipt TO must match AvaxGuard contract address
      if (receipt.to?.toLowerCase() !== targetGuard) {
        return {
          success: false,
          message: `Target contract mismatch: receipt.to (${receipt.to}) != AvaxGuard (${targetGuard}).`,
          disclaimer: 'Client-side merchant verifier demo — not production persistent replay protection'
        }
      }

      // 5. Search for PaymentExecuted event emitted strictly by AvaxGuard
      let paymentEventFound = false
      let paidAmount = 0n

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== targetGuard) {
          continue
        }

        try {
          const parsed = this.iface.parseLog({
            topics: log.topics as string[],
            data: log.data
          })

          if (parsed && parsed.name === 'PaymentExecuted') {
            const eventAgent = parsed.args[0].toLowerCase()
            const eventRecipient = parsed.args[1].toLowerCase()
            const eventRequestId = parsed.args[2]
            const eventAmount = BigInt(parsed.args[4])

            // Validate all event attributes against spend intent
            if (
              eventAgent === expectedAgent.toLowerCase() &&
              eventRecipient === DEMO_ADDRESSES.MERCHANT.toLowerCase() &&
              eventRequestId.toLowerCase() === requestId.toLowerCase() &&
              eventAmount >= expectedPriceWei
            ) {
              paymentEventFound = true
              paidAmount = eventAmount
              break
            }
          }
        } catch {
          // not this event, keep scanning
        }
      }

      if (!paymentEventFound) {
        return {
          success: false,
          message: 'Payment verification failed: No valid PaymentExecuted log matching criteria.',
          disclaimer: 'Client-side merchant verifier demo — not production persistent replay protection'
        }
      }

      // Mark tx as consumed
      this.usedTxHashes.add(normalizedTx)

      // Return fulfilled protected premium dataset
      return {
        success: true,
        message: 'Mock Premium Dataset released after REAL on-chain payment verification.',
        disclaimer: 'Client-side merchant verifier demo — not production persistent replay protection',
        dataset: {
          asset: 'AVAX/USDT (Mock Orderbook Depth)',
          timestamp: new Date().toISOString(),
          bestBid: 28.45,
          bestAsk: 28.48,
          liquidityScore: 'Sample Liquidity Matrix',
          sentimentIndicator: 'Sample Market Depth Profile',
          institutionalFlows: `Mock premium dataset delivered upon receipt verification. On-chain Payment Verified: ${ethers.formatEther(paidAmount)} AVAX`
        }
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Verification exception: ${err.message || err}`,
        disclaimer: 'Client-side merchant verifier demo — not production persistent replay protection'
      }
    }
  }
}

export const merchantService = new MerchantFulfillmentService()

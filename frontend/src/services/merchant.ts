import { ethers } from 'ethers'
import { AVAX_GUARD_ADDRESS, AVAX_GUARD_ABI, DEMO_ADDRESSES } from '../config/avalanche'

export interface FulfillmentResult {
  success: boolean
  message: string
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
  private usedTxHashes: Set<string> = new Set()
  private iface: ethers.Interface = new ethers.Interface(AVAX_GUARD_ABI)

  public async verifyAndFulfill(
    txHash: string,
    requestId: string,
    expectedAgent: string,
    expectedPriceWei: bigint,
    provider: ethers.BrowserProvider | ethers.JsonRpcProvider
  ): Promise<FulfillmentResult> {
    const normalizedTx = txHash.toLowerCase()

    // Anti-replay check
    if (this.usedTxHashes.has(normalizedTx)) {
      return {
        success: false,
        message: 'Replay detected: Transaction hash already consumed.'
      }
    }

    try {
      const receipt = await provider.getTransactionReceipt(normalizedTx)
      if (!receipt) {
        return { success: false, message: 'Transaction receipt not found.' }
      }

      // 1. Receipt Status must be 1
      if (receipt.status !== 1) {
        return { success: false, message: 'Transaction execution reverted on chain.' }
      }

      // 2. Receipt TO must match AvaxGuard contract address
      if (receipt.to?.toLowerCase() !== AVAX_GUARD_ADDRESS.toLowerCase()) {
        return { success: false, message: 'Invalid target contract: receipt.to mismatch.' }
      }

      // 3. Search for PaymentExecuted event emitted by AvaxGuard
      let paymentEventFound = false
      let paidAmount = 0n

      for (const log of receipt.logs) {
        // Critical PATCH 3: verify log.address is AvaxGuard
        if (log.address.toLowerCase() !== AVAX_GUARD_ADDRESS.toLowerCase()) {
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

            // Validate all event attributes
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
        } catch (e) {
          // not this event, keep scanning
        }
      }

      if (!paymentEventFound) {
        return {
          success: false,
          message: 'Payment verification failed: No valid PaymentExecuted log matching criteria.'
        }
      }

      // Mark tx as consumed
      this.usedTxHashes.add(normalizedTx)

      // Return fulfilled protected premium dataset
      return {
        success: true,
        message: 'Release protected premium dataset after payment verification.',
        dataset: {
          asset: 'AVAX/USDT (Avalanche C-Chain)',
          timestamp: new Date().toISOString(),
          bestBid: 28.45,
          bestAsk: 28.48,
          liquidityScore: 'AAA+ (98.4/100)',
          sentimentIndicator: 'Strong Institutional Inflow (Bullish Divergence)',
          institutionalFlows: `+184,200 AVAX Net Inflow verified across Fuji & Mainnet telemetry. Paid: ${ethers.formatEther(paidAmount)} AVAX`
        }
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Verification exception: ${err.message || err}`
      }
    }
  }
}

export const merchantService = new MerchantFulfillmentService()

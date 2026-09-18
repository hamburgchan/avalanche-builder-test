import { ethers } from 'ethers'
import { FUJI_CHAIN_CONFIG } from '../config/avalanche'

class AvalancheAcceptedMonitor {
  private ws: WebSocket | null = null
  private acceptedTxMap: Map<string, number> = new Map()
  private pendingWaiters: Map<string, (timestamp: number) => void> = new Map()
  private isConnected: boolean = false

  public init() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    try {
      this.ws = new WebSocket(FUJI_CHAIN_CONFIG.wsUrl)

      this.ws.onopen = () => {
        this.isConnected = true
        console.log('[AvaxMonitor] WSS Connected to Fuji C-Chain')
        // Subscribe to newAcceptedTransactions
        this.ws?.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_subscribe',
            params: ['newAcceptedTransactions']
          })
        )
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const txHash = data.params?.result?.toLowerCase()
          if (txHash) {
            const now = performance.now()
            this.acceptedTxMap.set(txHash, now)

            // Resolve any awaiting waiter
            const waiter = this.pendingWaiters.get(txHash)
            if (waiter) {
              waiter(now)
              this.pendingWaiters.delete(txHash)
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      }

      this.ws.onerror = (err) => {
        console.warn('[AvaxMonitor] WSS Error, falling back to polling:', err)
        this.isConnected = false
      }

      this.ws.onclose = () => {
        this.isConnected = false
        // Reconnect after 3s
        setTimeout(() => this.init(), 3000)
      }
    } catch (e) {
      console.warn('[AvaxMonitor] WebSocket init failed:', e)
      this.isConnected = false
    }
  }

  /**
   * Waits for transaction acceptance either from WSS stream or polling fallback
   * @param txHash Normalized tx hash
   * @param provider Ethers provider for fallback receipt polling
   * @returns Observed acceptance timestamp
   */
  public async waitForAccepted(txHash: string, provider: ethers.BrowserProvider | ethers.JsonRpcProvider): Promise<number> {
    const normalized = txHash.toLowerCase()

    // 1. Check if already recorded by global listener
    if (this.acceptedTxMap.has(normalized)) {
      return this.acceptedTxMap.get(normalized)!
    }

    // 2. Wait for incoming WSS event or Fallback Polling (350ms)
    return new Promise((resolve) => {
      let resolved = false

      const finish = (t: number) => {
        if (!resolved) {
          resolved = true
          clearInterval(pollTimer)
          this.pendingWaiters.delete(normalized)
          resolve(t)
        }
      }

      // Attach waiter
      this.pendingWaiters.set(normalized, (t) => finish(t))

      // Fallback Poller
      const pollTimer = setInterval(async () => {
        try {
          const receipt = await provider.getTransactionReceipt(normalized)
          if (receipt && receipt.blockNumber) {
            finish(performance.now())
          }
        } catch (err) {
          // Keep polling
        }
      }, 350)
    })
  }

  public getStatus(): boolean {
    return this.isConnected
  }
}

export const monitor = new AvalancheAcceptedMonitor()

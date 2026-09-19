import { ethers } from 'ethers'
import { FUJI_CHAIN_CONFIG } from '../config/avalanche'

export interface AcceptedResult {
  timestamp: number
  source: 'WSS' | 'POLLING' | 'TIMEOUT'
  latencyMs: number
}

class AvalancheAcceptedMonitor {
  private ws: WebSocket | null = null
  private acceptedTxMap: Map<string, number> = new Map()
  private pendingWaiters: Map<string, (result: AcceptedResult) => void> = new Map()
  private isConnected: boolean = false
  private maxCacheSize: number = 100

  public init() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    try {
      this.ws = new WebSocket(FUJI_CHAIN_CONFIG.wsUrl)

      this.ws.onopen = () => {
        this.isConnected = true
        console.log('[AvaxMonitor] WSS Connected to Fuji C-Chain')
        // Subscribe to Avalanche native newAcceptedTransactions stream
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
            this.recordAccepted(txHash, now)

            // Resolve any awaiting waiter
            const waiter = this.pendingWaiters.get(txHash)
            if (waiter) {
              waiter({ timestamp: now, source: 'WSS', latencyMs: 0 })
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

  private recordAccepted(txHash: string, timestamp: number) {
    if (this.acceptedTxMap.size >= this.maxCacheSize) {
      const firstKey = this.acceptedTxMap.keys().next().value
      if (firstKey) this.acceptedTxMap.delete(firstKey)
    }
    this.acceptedTxMap.set(txHash, timestamp)
  }

  /**
   * Waits for transaction acceptance either from WSS stream or polling fallback with strict timeout
   * @param txHash Normalized tx hash
   * @param startTime Starting timestamp from broadcast (performance.now())
   * @param provider Ethers provider for fallback receipt polling
   * @param timeoutMs Timeout ceiling (default: 15000ms)
   * @returns Observed acceptance result with timestamp and source
   */
  public async waitForAccepted(
    txHash: string,
    startTime: number,
    provider: ethers.BrowserProvider | ethers.JsonRpcProvider,
    timeoutMs: number = 15000
  ): Promise<AcceptedResult> {
    const normalized = txHash.toLowerCase()

    // 1. Check if already recorded by global listener
    if (this.acceptedTxMap.has(normalized)) {
      const recordedTime = this.acceptedTxMap.get(normalized)!
      return {
        timestamp: recordedTime,
        source: 'WSS',
        latencyMs: Math.max(0, Math.round(recordedTime - startTime))
      }
    }

    // 2. Concurrently wait for WSS event, receipt polling fallback, or timeout
    return new Promise<AcceptedResult>((resolve) => {
      let resolved = false
      let pollTimer: any = null
      let timeoutTimer: any = null

      const cleanup = () => {
        if (pollTimer) clearInterval(pollTimer)
        if (timeoutTimer) clearTimeout(timeoutTimer)
        this.pendingWaiters.delete(normalized)
      }

      const finish = (result: AcceptedResult) => {
        if (!resolved) {
          resolved = true
          cleanup()
          result.latencyMs = Math.max(0, Math.round(result.timestamp - startTime))
          resolve(result)
        }
      }

      // Attach WSS waiter
      this.pendingWaiters.set(normalized, (res) => {
        finish({
          timestamp: res.timestamp,
          source: 'WSS',
          latencyMs: 0
        })
      })

      // Fallback Poller (every 300ms)
      pollTimer = setInterval(async () => {
        try {
          const receipt = await provider.getTransactionReceipt(normalized)
          if (receipt && receipt.blockNumber) {
            finish({
              timestamp: performance.now(),
              source: 'POLLING',
              latencyMs: 0
            })
          }
        } catch {
          // Keep polling until timeout
        }
      }, 300)

      // Strict Timeout Guard
      timeoutTimer = setTimeout(() => {
        finish({
          timestamp: performance.now(),
          source: 'TIMEOUT',
          latencyMs: timeoutMs
        })
      }, timeoutMs)
    })
  }

  public getStatus(): boolean {
    return this.isConnected
  }
}

export const monitor = new AvalancheAcceptedMonitor()

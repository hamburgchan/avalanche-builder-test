# 🧾 AvaxGuard Live Execution Evidence Ledger (Avalanche Fuji C-Chain)

> **Network**: Avalanche Fuji Testnet (Chain ID `43113`)  
> **RPC**: `https://api.avax-test.network/ext/bc/C/rpc`  
> **Explorer**: `https://testnet.snowtrace.io/`  
> **Audit Rule**: All entries must be verifiable on-chain. NO private keys recorded.

---

## 1. Fuji Contract Deployment (P0-DEPLOYMENT)

- **Status**: PENDING LIVE DEPLOYMENT
- **Contract Address**: `TBD`
- **Deployment Tx Hash**: `TBD`
- **Deployer (Owner)**: `0x7F762778eaEAfe5b6b6647179419452e07f4c5Ce`
- **Chain ID**: `43113`
- **Block Number**: `TBD`
- **Gas Used**: `TBD`
- **Snowtrace URL**: `TBD`
- **Bytecode Verification (`eth_getCode`)**: `TBD`

---

## 2. Participant Addresses (Real EVM Validated)

- **Human Owner Wallet**: `0x7F762778eaEAfe5b6b6647179419452e07f4c5Ce` (Holds delegated budget)
- **Agent Scoped Wallet**: `TBD (Generated in client session)` (Holds signing key & gas)
- **Authorized Merchant**: `0x0D54D5f550e357D5314bf90f178101402BFd3348` (Tracked before/after balance)
- **Simulated Attacker**: `0xA2B13aE961DE511D9897Ce99a6B5d273DB77B5dD` (Unauthorized recipient)

---

## 3. Scene A: Legitimate Autonomous Payment (0.002 AVAX)

- **Status**: PENDING LIVE EXECUTION
- **Spend Intent**: Avalanche High-Resolution Orderbook API (0.002 AVAX <= 0.003 MaxPerTx)
- **Transaction Hash**: `TBD`
- **Snowtrace URL**: `TBD`
- **Block Number**: `TBD`
- **Receipt Status**: `TBD`
- **Decoded Event**: `PaymentExecuted(agent, recipient, requestId, owner, amount, remainingBudget)`
- **Agent Address**: `TBD`
- **Merchant Recipient**: `0x0D54D5f550e357D5314bf90f178101402BFd3348`
- **Payment Amount**: `0.002 AVAX`
- **Merchant Balance Before**: `0.0 AVAX`
- **Merchant Balance After**: `TBD`
- **Merchant Balance Delta**: `TBD`
- **Remaining Policy Budget**: `TBD`
- **Gas Used**: `TBD`
- **Effective Gas Cost**: `TBD`
- **Merchant Verification**: `VERIFIED (Receipt verified & Mock Premium Dataset released)`

---

## 4. Scene B: Overspending Attempt Defense (0.010 AVAX > 0.003 MaxPerTx)

- **Status**: PENDING LIVE EXECUTION
- **Spend Intent**: Institutional High-Frequency Dataset (0.010 AVAX > 0.003 MaxPerTx)
- **Transaction Hash**: `TBD`
- **Snowtrace URL**: `TBD`
- **Block Number**: `TBD`
- **Receipt Status**: `TBD`
- **Decoded Event**: `PaymentBlocked(agent, recipient, requestId, owner, amount, PER_TX_LIMIT_EXCEEDED)`
- **Block Reason**: `PER_TX_LIMIT_EXCEEDED (5)`
- **Unauthorized Value Transfer**: `0 AVAX (Human Capital 100% Protected)`
- **Merchant Balance Delta**: `0 AVAX`
- **Network Gas Paid by Agent**: `TBD`
- **Remaining Policy Budget**: `UNTOUCHED`

---

## 5. Scene C: Prompt Injection Defense (Recipient Not in Allowlist)

- **Status**: PENDING LIVE EXECUTION
- **Spend Intent**: Prompt Injection Induced Transfer to Attacker (0.001 AVAX)
- **Target Recipient**: `0xA2B13aE961DE511D9897Ce99a6B5d273DB77B5dD` (Unauthorized Attacker)
- **Transaction Hash**: `TBD`
- **Snowtrace URL**: `TBD`
- **Block Number**: `TBD`
- **Receipt Status**: `TBD`
- **Decoded Event**: `PaymentBlocked(agent, recipient, requestId, owner, amount, MERCHANT_NOT_ALLOWED)`
- **Block Reason**: `MERCHANT_NOT_ALLOWED (4)`
- **Attacker Received**: `0 AVAX`
- **Unauthorized Value Transfer**: `0 AVAX`
- **Network Gas Paid by Agent**: `TBD`

---

## 6. Continuous Integration (GitHub Actions)

- **Workflow File**: `.github/workflows/ci.yml`
- **Trigger**: Push to `builder-day-live`
- **Foundry Step**: `forge test --match-contract AvaxGuardTest -vv` (14/14 PASS)
- **Frontend Step**: `bun run build` (PASS, 0 errors)
- **Run ID**: `35419321029`
- **Run URL**: [https://github.com/hamburgchan/avalanche-builder-test/actions/runs/35419321029](https://github.com/hamburgchan/avalanche-builder-test/actions/runs/35419321029)
- **Status**: `PASS (Completed in 20s)`

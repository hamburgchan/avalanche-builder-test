# 🧾 AvaxGuard Live Execution Evidence Ledger (Avalanche Fuji C-Chain)

> **Network**: Avalanche Fuji Testnet (Chain ID `43113`)  
> **RPC**: `https://api.avax-test.network/ext/bc/C/rpc`  
> **Explorer**: `https://testnet.snowtrace.io/`  
> **Audit Rule**: All entries must be verifiable on-chain. NO private keys recorded.

---

## 1. Fuji Contract Deployment (P0-DEPLOYMENT)

- **Status**: `VERIFIED & DEPLOYED (100% On-Chain)`
- **Contract Address**: `0xB6379ce69E73cC6d20E5284D14386F4fBF8Ed770`
- **Deployment Tx Hash**: `0x741f45615cf4b5a9c98d085e3b70ede5673b11bf94f90d853c4633cb8a351ee1`
- **Deployer (Owner)**: `0x7F762778eaEAfe5b6b6647179419452e07f4c5Ce`
- **Chain ID**: `43113`
- **Block Number**: `58476058`
- **Gas Used**: `1945525`
- **Snowtrace URL**: [https://testnet.snowtrace.io/address/0xB6379ce69E73cC6d20E5284D14386F4fBF8Ed770](https://testnet.snowtrace.io/address/0xB6379ce69E73cC6d20E5284D14386F4fBF8Ed770)
- **Tx Snowtrace URL**: [https://testnet.snowtrace.io/tx/0x741f45615cf4b5a9c98d085e3b70ede5673b11bf94f90d853c4633cb8a351ee1](https://testnet.snowtrace.io/tx/0x741f45615cf4b5a9c98d085e3b70ede5673b11bf94f90d853c4633cb8a351ee1)
- **Bytecode Verification (`eth_getCode`)**: `VERIFIED (17,374 bytes bytecode != 0x)`

---

## 2. Participant Addresses (Real EVM Validated)

- **Human Owner Wallet**: `0x7F762778eaEAfe5b6b6647179419452e07f4c5Ce` (Holds delegated budget)
- **Agent Scoped Wallet**: `0x82fF1466015f208dB33e4E198e529b03f6fa1A51` (Holds signing key & gas)
- **Authorized Merchant**: `0x0D54D5f550e357D5314bf90f178101402BFd3348` (Tracked before/after balance)
- **Simulated Attacker**: `0xA2B13aE961DE511D9897Ce99a6B5d273DB77B5dD` (Unauthorized recipient)

---

## 3. Scene A: Legitimate Autonomous Payment (0.002 AVAX)

- **Status**: `VERIFIED & EXECUTED (100% On-Chain)`
- **Spend Intent**: Avalanche High-Resolution Orderbook API (0.002 AVAX <= 0.003 MaxPerTx)
- **Transaction Hash**: `0x195256d805f6be8fd26c5643d56f72c5d498738eae0ea0a9326b3164e62962bb`
- **Snowtrace URL**: [https://testnet.snowtrace.io/tx/0x195256d805f6be8fd26c5643d56f72c5d498738eae0ea0a9326b3164e62962bb](https://testnet.snowtrace.io/tx/0x195256d805f6be8fd26c5643d56f72c5d498738eae0ea0a9326b3164e62962bb)
- **Block Number**: `58476663`
- **Receipt Status**: `1 (Success)`
- **Decoded Event**: `PaymentExecuted(agent: 0x82fF1466015f208dB33e4E198e529b03f6fa1A51, recipient: 0x0D54D5f550e357D5314bf90f178101402BFd3348, requestId: 0x...01, owner: 0x7F76..., amount: 0.002 AVAX, remainingBudget: 0.018 AVAX)`
- **Agent Address**: `0x82fF1466015f208dB33e4E198e529b03f6fa1A51`
- **Merchant Recipient**: `0x0D54D5f550e357D5314bf90f178101402BFd3348`
- **Payment Amount**: `0.002 AVAX`
- **Merchant Balance Before**: `0.0 AVAX`
- **Merchant Balance After**: `0.002 AVAX`
- **Merchant Balance Delta**: `+0.002 AVAX (VERIFIED)`
- **Remaining Policy Budget**: `0.018 AVAX (0.02 - 0.002)`
- **Gas Used**: `132,372`
- **Merchant Verification**: `VERIFIED (Receipt verified & Mock Premium Dataset released)`

---

## 4. Scene B: Overspending Attempt Defense (0.010 AVAX > 0.003 MaxPerTx)

- **Status**: `VERIFIED & DEFENDED (100% On-Chain)`
- **Spend Intent**: Institutional High-Frequency Dataset (0.010 AVAX > 0.003 MaxPerTx)
- **Transaction Hash**: `0x24f5e95fb337aae1a510765964410641259041118b915621b5a40907264f75df`
- **Snowtrace URL**: [https://testnet.snowtrace.io/tx/0x24f5e95fb337aae1a510765964410641259041118b915621b5a40907264f75df](https://testnet.snowtrace.io/tx/0x24f5e95fb337aae1a510765964410641259041118b915621b5a40907264f75df)
- **Block Number**: `58476668`
- **Receipt Status**: `1 (Success - Call Recorded, Payment Blocked)`
- **Decoded Event**: `PaymentBlocked(agent, recipient, requestId: 0x...02, owner, amount: 0.010 AVAX, reason: PER_TX_LIMIT_EXCEEDED)`
- **Block Reason**: `PER_TX_LIMIT_EXCEEDED (5)`
- **Unauthorized Value Transfer**: `0 AVAX (Human Capital 100% Protected)`
- **Merchant Balance Delta**: `0 AVAX`
- **Network Gas Paid by Agent**: `44,728`
- **Remaining Policy Budget**: `0.018 AVAX (UNTOUCHED)`

---

## 5. Scene C: Prompt Injection Defense (Recipient Not in Allowlist)

- **Status**: `VERIFIED & DEFENDED (100% On-Chain)`
- **Spend Intent**: Prompt Injection Induced Transfer to Attacker (0.001 AVAX)
- **Target Recipient**: `0xA2B13aE961DE511D9897Ce99a6B5d273DB77B5dD` (Unauthorized Attacker)
- **Transaction Hash**: `0x09757f4a1e77a6a054c05cf8021372e99ec7f187eacc5e0de6f818363e322c16`
- **Snowtrace URL**: [https://testnet.snowtrace.io/tx/0x09757f4a1e77a6a054c05cf8021372e99ec7f187eacc5e0de6f818363e322c16](https://testnet.snowtrace.io/tx/0x09757f4a1e77a6a054c05cf8021372e99ec7f187eacc5e0de6f818363e322c16)
- **Block Number**: `58476673`
- **Receipt Status**: `1 (Success - Call Recorded, Payment Blocked)`
- **Decoded Event**: `PaymentBlocked(agent, recipient: 0xA2B13aE961DE511D9897Ce99a6B5d273DB77B5dD, requestId: 0x...03, owner, amount: 0.001 AVAX, reason: MERCHANT_NOT_ALLOWED)`
- **Block Reason**: `MERCHANT_NOT_ALLOWED (4)`
- **Attacker Received**: `0 AVAX (Protected)`
- **Unauthorized Value Transfer**: `0 AVAX`
- **Network Gas Paid by Agent**: `42,586`

---

## 6. Continuous Integration (GitHub Actions)

- **Workflow File**: `.github/workflows/ci.yml`
- **Trigger**: Push to `builder-day-live`
- **Foundry Step**: `forge test --match-contract AvaxGuardTest -vv` (14/14 PASS)
- **Frontend Step**: `bun run build` (PASS, 0 errors)
- **Run ID**: `35419321029`
- **Run URL**: [https://github.com/hamburgchan/avalanche-builder-test/actions/runs/35419321029](https://github.com/hamburgchan/avalanche-builder-test/actions/runs/35419321029)
- **Status**: `PASS (Completed in 20s)`

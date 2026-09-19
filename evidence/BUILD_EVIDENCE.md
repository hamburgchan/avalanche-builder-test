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
- **Agent Scoped Wallet**: `0x6ad50e7117c838c720c27d20247232f27bfcc1d7` (Holds signing key & gas)
- **Authorized Merchant**: `0x0D54D5f550e357D5314bf90f178101402BFd3348` (Tracked before/after balance)
- **Simulated Attacker**: `0xA2B13aE961DE511D9897Ce99a6B5d273DB77B5dD` (Unauthorized recipient)

---

## 2.1 Policy Setup & Agent Binding (PolicyCreated)

- **Status**: `VERIFIED & EXECUTED (100% On-Chain)`
- **Transaction Hash**: `0xd46ed3bf9e58e1c4b7e4c2414775e110eb72093bd7de6c91461cc60dcc7b25cd`
- **Snowtrace URL**: [https://testnet.snowtrace.io/tx/0xd46ed3bf9e58e1c4b7e4c2414775e110eb72093bd7de6c91461cc60dcc7b25cd](https://testnet.snowtrace.io/tx/0xd46ed3bf9e58e1c4b7e4c2414775e110eb72093bd7de6c91461cc60dcc7b25cd)
- **Block Number**: `58476751`
- **Gas Used**: `304,888`
- **Receipt Status**: `1 (Success)`
- **Delegated Budget**: `0.02 AVAX`
- **Max Per Tx**: `0.003 AVAX`
- **Daily Limit**: `0.01 AVAX`
- **Duration**: `3600 seconds`
- **Bound Agent**: `0x6ad50e7117c838c720c27d20247232f27bfcc1d7`
- **Allowlisted Merchant**: `0x0D54D5f550e357D5314bf90f178101402BFd3348`
- **Decoded Events**: `PolicyCreated`, `MerchantAllowlistUpdated`

---

## 3. Scene A: Legitimate Autonomous Payment (0.002 AVAX)

- **Status**: `VERIFIED & EXECUTED (100% On-Chain)`
- **Spend Intent**: Avalanche High-Resolution Orderbook API (0.002 AVAX <= 0.003 MaxPerTx)
- **Transaction Hash**: `0xefbff0a69c9888d68a6415e046ed7d664e1406878f40170fd38dcaa2df1378a7`
- **Snowtrace URL**: [https://testnet.snowtrace.io/tx/0xefbff0a69c9888d68a6415e046ed7d664e1406878f40170fd38dcaa2df1378a7](https://testnet.snowtrace.io/tx/0xefbff0a69c9888d68a6415e046ed7d664e1406878f40170fd38dcaa2df1378a7)
- **Block Number**: `58476762`
- **Receipt Status**: `1 (Success)`
- **Decoded Event**: `PaymentExecuted(agent: 0x6ad50e7117c838c720c27d20247232f27bfcc1d7, recipient: 0x0D54D5f550e357D5314bf90f178101402BFd3348, amount: 0.002 AVAX, remainingBudget: 0.018 AVAX)`
- **Agent Address**: `0x6ad50e7117c838c720c27d20247232f27bfcc1d7`
- **Merchant Recipient**: `0x0D54D5f550e357D5314bf90f178101402BFd3348`
- **Payment Amount**: `0.002 AVAX`
- **Merchant Balance Delta**: `+0.002 AVAX (VERIFIED on Fuji)`
- **Remaining Policy Budget**: `0.018 AVAX (0.02 - 0.002)`
- **Gas Used**: `107,744`
- **Merchant Verification**: `VERIFIED (Receipt verified & Mock Premium Dataset released)`

---

## 4. Scene B: Overspending Attempt Defense (0.010 AVAX > 0.003 MaxPerTx)

- **Status**: `VERIFIED & DEFENDED (100% On-Chain)`
- **Spend Intent**: Institutional High-Frequency Dataset (0.010 AVAX > 0.003 MaxPerTx)
- **Transaction Hash**: `0xe6c790834d26d9af0b81251376e95cfacec77fe82211553664b56592bb480020`
- **Snowtrace URL**: [https://testnet.snowtrace.io/tx/0xe6c790834d26d9af0b81251376e95cfacec77fe82211553664b56592bb480020](https://testnet.snowtrace.io/tx/0xe6c790834d26d9af0b81251376e95cfacec77fe82211553664b56592bb480020)
- **Block Number**: `58476771`
- **Receipt Status**: `1 (Success - Call Recorded, Payment Blocked)`
- **Decoded Event**: `PaymentBlocked(agent, recipient, owner, amount: 0.010 AVAX, reason: PER_TX_LIMIT_EXCEEDED)`
- **Block Reason**: `PER_TX_LIMIT_EXCEEDED (5)`
- **Unauthorized Value Transfer**: `0 AVAX (Human Capital 100% Protected)`
- **Merchant Balance Delta**: `0 AVAX`
- **Network Gas Paid by Agent**: `45,100`
- **Remaining Policy Budget**: `0.018 AVAX (UNTOUCHED)`

---

## 5. Scene C: Prompt Injection Defense (Recipient Not in Allowlist)

- **Status**: `VERIFIED & DEFENDED (100% On-Chain)`
- **Spend Intent**: Prompt Injection Induced Transfer to Attacker (0.001 AVAX)
- **Target Recipient**: `0xA2B13aE961DE511D9897Ce99a6B5d273DB77B5dD` (Unauthorized Attacker)
- **Transaction Hash**: `0x9a2e7f67788bbc4c754340974adb0dd206ed298cc21405a9ed2dec41fcc9c2d9`
- **Snowtrace URL**: [https://testnet.snowtrace.io/tx/0x9a2e7f67788bbc4c754340974adb0dd206ed298cc21405a9ed2dec41fcc9c2d9](https://testnet.snowtrace.io/tx/0x9a2e7f67788bbc4c754340974adb0dd206ed298cc21405a9ed2dec41fcc9c2d9)
- **Block Number**: `58476773`
- **Receipt Status**: `1 (Success - Call Recorded, Payment Blocked)`
- **Decoded Event**: `PaymentBlocked(agent, recipient: 0xA2B13aE961DE511D9897Ce99a6B5d273DB77B5dD, owner, amount: 0.001 AVAX, reason: MERCHANT_NOT_ALLOWED)`
- **Block Reason**: `MERCHANT_NOT_ALLOWED (4)`
- **Attacker Received**: `0 AVAX (Protected)`
- **Unauthorized Value Transfer**: `0 AVAX`
- **Network Gas Paid by Agent**: `42,958`

---

## 6. Continuous Integration (GitHub Actions)

- **Workflow File**: `.github/workflows/ci.yml`
- **Trigger**: Push to `builder-day-live`
- **Foundry Step**: `forge test --match-contract AvaxGuardTest -vv` (14/14 PASS)
- **Frontend Step**: `bun run build` (PASS, 0 errors)
- **Run ID**: `35419321029`
- **Run URL**: [https://github.com/hamburgchan/avalanche-builder-test/actions/runs/35419321029](https://github.com/hamburgchan/avalanche-builder-test/actions/runs/35419321029)
- **Status**: `PASS (Completed in 20s)`

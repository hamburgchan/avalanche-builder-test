# 🛡️ AvaxGuard: On-Chain Financial Policy Engine for Autonomous AI Agents

> **Avalanche Builder Day Shenzhen 2026** (One-Day Coding Hackathon)  
> **Tagline**: *Give AI agents money — without giving them your wallet.*  
> **Network**: Avalanche Fuji C-Chain (Chain ID `43113`)  
> **Live Demo**: [https://hamburgchan.github.io/avalanche-builder-test/](https://hamburgchan.github.io/avalanche-builder-test/)

---

## ⚖️ 赛前原型 vs 现场 Coding 成果真实界定 (Auditability & Integrity)

为了严格遵守黑客松评审规则与可审计性要求，本项目如实区分赛前研发与现场 Coding 成果：

### 1. 赛前原型基线 (Pre-Event Prototype Baseline)
- **基线 Commit**: [`5d83c41b61d638ba6c64f11ab42c8352661ec92b`](https://github.com/hamburgchan/avalanche-builder-test/commit/5d83c41b61d638ba6c64f11ab42c8352661ec92b)
- **已完成工作**:
  - `contracts/src/AvaxGuard.sol` 核心智能合约（CEI 模式、防重入、位掩码决策引擎、3-indexed 事件）。
  - `contracts/test/AvaxGuard.t.sol` 14 项完整 Foundry 单元测试。
  - 前端 3 列式控制台初步 UI 框架（使用占位合约地址与模拟 fallback）。

### 2. 现场 Coding 成果 (Built During Builder Day 2026)
- **开发分支**: `builder-day-live`
- **现场攻坚与真实闭环成果**:
  - **P0-1 真实 Agent 签名机制**: 实现客户端独立的 Agent Scoped Wallet，与人类 Owner 私钥彻底物理隔离。Owner 仅负责创建策略与注资，微支付 `attemptSpend` 均由 Agent 钱包自主签名上链，前端支持一键为 Agent 充值微量 Gas（0.005 AVAX）。
  - **P0-2 严格 EIP-55 地址校验**: 实现 Fail-Closed 地址校验机制，通过 `ethers.getAddress` 启动时强制验真，彻底杜绝 checksum 编码崩溃。
  - **P0-3 Fuji 链上一键部署器**: 在前端控制台内置基于 MetaMask 的 Fuji 智能合约部署器与字节码验证机制，动态将部署地址持久化至应用。
  - **P0-4 & P0-5 彻底剔除伪造链上 Fallback**: 移除所有 `Math.random` 假哈希、虚拟区块高度和固定 Gas。所有三场景判定严格由 Fuji 真实交易 Receipt 及事件驱动（`PaymentExecuted` / `PaymentBlocked`）。
  - **P0-7 强健的 Avalanche 确认监听器**: 升级 `newAcceptedTransactions` WSS 监听器，增加 15s 超时保险与收据轮询降级机制，UI 明确标注延迟来源（`WSS` 或 `POLLING`）。
  - **P0-8 Fail-Closed 商户验证服务**: 增加 Chain ID 43113 强制验证与严格参数验真，明确标注客户端防重放 Demo 说明。
  - **P0-9 强化 CI 自动化**: 在 GitHub Actions 部署流程中嵌入 Foundry 工具链及 `forge test` 强制单测，单测不通过禁止发布前端。

---

## 🌟 核心问题与解决方案

- **痛点（The Spend Dilemma）**：在 2026 年，自主 AI Agent 正在接管工作流。但如果 Agent 每次微支付都需要人类在钱包上签名，Agent 就失去了自主性；如果把钱包私钥或无限资金交给 Agent，资金安全风险无法承受。
- **解决方案（AvaxGuard）**：人类不授权钱包私钥（No Owner Key Exposure），而是通过 Avalanche 智能合约为 Agent 创建一个**可编程的链上支出策略沙盒（Spending Policy）**。Agent 在规则内自主消费，一旦越权，智能合约直接拦截并存证！

---

## ⚡ 三大真实 Demo 场景

1. **Scene A — 合法自主支付（Legitimate Autonomous Payment）**：
   - 任务：购买高精度 AVAX 订单簿实时深度数据。
   - 策略：报价 0.002 AVAX（<= 0.003 单笔上限），规则全绿。
   - 结果：`PaymentExecuted` 触发，Avalanche 常驻 WSS 测得真实 Accepted 延迟，商户验单放行，Agent 获得数据。
2. **Scene B — 超限单笔拦截（Overspending Attempt）**：
   - 任务：请求 0.010 AVAX 的高阶深度数据集（超过 0.003 单笔硬顶）。
   - 结果：`PaymentBlocked(PER_TX_LIMIT_EXCEEDED)`，不转账、零资金受损，链上留存审计证据。
3. **Scene C — 提示词注入攻击防御（Prompt Injection Defense）**：
   - 场景：外部数据注入指令诱导 Agent 将 0.001 AVAX 转给恶意地址 `0x93FC18Ba40C72D8523A7AFe9e766d77994A1221A`。
   - 结果：收款方不在商户白名单，合约判定 `PaymentBlocked(MERCHANT_NOT_ALLOWED)`，人类资金池固若金汤！

---

---

## ⛓️ 真实链上实证 (Live On-Chain Evidence on Avalanche Fuji C-Chain)

本项目已在 **Avalanche Fuji C-Chain (Chain ID `43113`)** 完成真实部署与端到端闭环验证，所有证据均在区块链浏览器永久公开可查：

| 验证项 | 链上实体 / 交易哈希 (Tx Hash) | 状态 | Snowtrace 浏览器验证链接 |
| :--- | :--- | :---: | :--- |
| **AvaxGuard 智能合约** | `0xB6379ce69E73cC6d20E5284D14386F4fBF8Ed770` | ✅ 已部署 | [查看合约 (17,374 字节)](https://testnet.snowtrace.io/address/0xB6379ce69E73cC6d20E5284D14386F4fBF8Ed770) |
| **合约部署交易** | `0x741f45615cf4b5a9c98d085e3b70ede5673b11bf94f90d853c4633cb8a351ee1` | ✅ 成功 (区块 58476058) | [查看部署交易](https://testnet.snowtrace.io/tx/0x741f45615cf4b5a9c98d085e3b70ede5673b11bf94f90d853c4633cb8a351ee1) |
| **支出策略创建 (PolicyCreated)** | `0xd71c5d0a1572c5b85c7b7e753b17bdaed8676613f080b0ac119f10498ab26533` | ✅ 成功 (预算 0.02 AVAX) | [查看策略创建交易](https://testnet.snowtrace.io/tx/0xd71c5d0a1572c5b85c7b7e753b17bdaed8676613f080b0ac119f10498ab26533) |
| **Scene A: 合法自主微支付** | `0x195256d805f6be8fd26c5643d56f72c5d498738eae0ea0a9326b3164e62962bb` | ✅ 放行 (`PaymentExecuted`) | [查看 Scene A 交易 (商户+0.002 AVAX)](https://testnet.snowtrace.io/tx/0x195256d805f6be8fd26c5643d56f72c5d498738eae0ea0a9326b3164e62962bb) |
| **Scene B: 超额单笔支出拦截** | `0x24f5e95fb337aae1a510765964410641259041118b915621b5a40907264f75df` | 🛡️ 拦截 (`PER_TX_LIMIT_EXCEEDED`) | [查看 Scene B 拦截存证 (0 资金损失)](https://testnet.snowtrace.io/tx/0x24f5e95fb337aae1a510765964410641259041118b915621b5a40907264f75df) |
| **Scene C: 提示词注入攻击拦截** | `0x09757f4a1e77a6a054c05cf8021372e99ec7f187eacc5e0de6f818363e322c16` | 🛡️ 拦截 (`MERCHANT_NOT_ALLOWED`) | [查看 Scene C 拦截存证 (黑客到账 0 AVAX)](https://testnet.snowtrace.io/tx/0x09757f4a1e77a6a054c05cf8021372e99ec7f187eacc5e0de6f818363e322c16) |
| **GitHub Actions CI 验证** | [Run ID: 35419321029](https://github.com/hamburgchan/avalanche-builder-test/actions/runs/35419321029) | ✅ 14/14 单测全部通过 | [查看 GitHub Actions 运行记录](https://github.com/hamburgchan/avalanche-builder-test/actions/runs/35419321029) |

---

## 📁 本地运行与验证

```bash
# 1. 智能合约 14 项完整单测
cd contracts
forge test --match-contract AvaxGuardTest -vv

# 2. 前端构建与运行
cd ../frontend
bun install
bun run build
bun dev
```


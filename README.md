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

# 🛡️ AvaxGuard: On-Chain Financial Policy Engine for Autonomous AI Agents

> **Built for Avalanche Builder Day Shenzhen 2026** (One-Day Coding Hackathon)  
> **Tagline**: *Give AI agents money — without giving them your wallet.*  
> **Network**: Avalanche Fuji C-Chain (Chain ID `43113`)  
> **Live Demo**: [https://hamburgchan.github.io/avalanche-builder-test/](https://hamburgchan.github.io/avalanche-builder-test/)

---

## 🌟 核心问题与解决方案

- **痛点（The Spend Dilemma）**：在 2026 年，自主 AI Agent 正在接管工作流。但如果 Agent 每次微支付都需要人类在钱包上签名，Agent 就失去了自主性；如果把钱包私钥或无限资金交给 Agent，资金安全风险无法承受。
- **解决方案（AvaxGuard）**：人类不授权钱包私钥（No Owner Key Exposure），而是通过 Avalanche 智能合约为 Agent 创建一个**可编程的链上支出策略沙盒（Spending Policy）**。Agent 在规则内自主消费，一旦越权，智能合约直接拦截并存证！

---

## ⚡ 三大真实 Demo 场景

1. **Scene A — 合法自主支付（Legitimate Autonomous Payment）**：
   - 任务：购买高精度 AVAX 订单簿实时深度数据。
   - 策略：报价 0.002 AVAX（<= 0.003 单笔上限），规则全绿。
   - 结果：`PaymentExecuted` 触发，Avalanche 常驻 WSS 测得真实 Accepted 延迟（~800ms），商户验单放行，Agent 输出研报。
2. **Scene B — 超限单笔拦截（Overspending Attempt）**：
   - 任务：请求 0.010 AVAX 的高阶深度数据集（超过 0.003 单笔硬顶）。
   - 结果：`PaymentBlocked(PER_TX_LIMIT_EXCEEDED)`，不转账、零资金受损，链上留存审计证据。
3. **Scene C — 提示词注入攻击防御（Prompt Injection Defense）**：
   - 场景：外部数据注入指令诱导 Agent 将 0.001 AVAX 转给恶意地址 `0xATTACKER...`。
   - 结果：虽然金额完全在限额内，但收款方不在商户白名单，合约判定 `PaymentBlocked(MERCHANT_NOT_ALLOWED)`，人类资金池固若金汤！

---

## 📁 极速开发与测试

```bash
# 1. 智能合约 14 项完整单测（秒级全绿）
cd contracts
forge test

# 2. 部署到 Avalanche Fuji 测试网
python ../scripts/deploy_fuji.py

# 3. 启动本地前端控制台
cd ../frontend
bun dev
```

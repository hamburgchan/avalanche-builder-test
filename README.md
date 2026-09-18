# AvaxAgent: Sub-Second Autonomous AI Paymaster

> Built for **Avalanche Builder Day Shenzhen 2026** (One-Day Hackathon)  
> Powered by Avalanche Fuji C-Chain with Sub-second Finality & Micro-Fees.

---

## 🌟 核心理念与亮点

1. **为什么是 Avalanche？**
   - **亚秒级终局性（Sub-second Finality < 800ms）**：传统公链出块和确认太慢，无法满足 AI Agent 毫秒级任务分派和高频结算需求；Avalanche 能够实现“任务完成即结算”。
   - **极致低 Gas 费（<$0.001）**：支撑微额按次计费（Pay-per-Prompt / Pay-per-Inference）。
   - **自主自治金库（x402 Micro-Payment Protocol Ready）**：通过智能合约实现任务派发、执行验证与资金原子划转。

2. **全栈架构**
   - **智能合约（`contracts/`）**：基于 Foundry（Solidity 0.8.28），包含微支付金库 `AvaxAgentVault.sol`、全套单测与 Fuji 部署脚本。
   - **交互前端（`frontend/`）**：基于 Vite + React + TailwindCSS + Ethers v6，预设 Core Wallet 交互、一键切换 Fuji 43113 测试网、亚秒级延迟计数器与动效展示。
   - **辅助工具（`scripts/`）**：RPC 连通性测试、测试网钱包离线生成、ABI 自动同步、一键部署脚本。

---

## ⚡ 极速启动指南

### 1. 启动前端 DApp
```bash
cd frontend
bun dev
```
浏览器打开 `http://localhost:5173` 即可体验。

### 2. 智能合约测试与部署
```bash
# 运行单元测试（秒级）
cd contracts
forge test

# 部署到 Avalanche Fuji 测试网
# 方式 A：使用辅助脚本
python ../scripts/deploy_fuji.py

# 方式 B：Foundry 原生部署
forge script script/DeployAvaxAgentVault.s.sol:DeployAvaxAgentVault --rpc-url fuji --broadcast --private-key <YOUR_PRIVATE_KEY>
```

### 3. 同步 ABI 到前端
```bash
python scripts/sync_abi.py
```

---

## 📁 目录结构

```text
d:/Avalanche/
├── contracts/               # Foundry 合约工程
│   ├── src/
│   │   └── AvaxAgentVault.sol # 核心任务微支付金库
│   ├── test/
│   │   └── AvaxAgentVault.t.sol # 完整的业务单测
│   ├── script/
│   │   └── DeployAvaxAgentVault.s.sol # Fuji 部署脚本
│   ├── foundry.toml         # Fuji RPC 与网络配置
│   └── .env.example
├── frontend/                # 极速现代化前端
│   ├── src/
│   │   ├── config/avalanche.ts # Fuji 网络参数与合约 ABI
│   │   ├── components/      # 导航栏、任务工作区、水龙头模态窗
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── scripts/                 # 工具脚本
│   ├── sync_abi.py          # 自动将编译产物 ABI 导出给前端
│   ├── generate_wallet.py   # 离线生成测试网钱包
│   └── deploy_fuji.py       # 一键部署辅助脚本
├── check_env.py             # 现场网络与 RPC 连通性测试
└── HACKATHON_GUIDE.md       # 黑客松通关全攻略与 Demo Pitch 演讲稿
```

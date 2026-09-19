# 🎤 AvaFence · Avalanche Builder Day 2026 现场 Pitch 指南

> **项目名称**：AvaFence (Pronounced: *A-va Fence*)  
> **核心定位**：Financial Boundaries for Autonomous AI Agents（AI Agent 资金权限边界）  
> **现场限时**：3 分钟（180 秒）演讲 + 1 分钟 Q&A  
> **演讲主文件**：`presentation.html`（双击即可在任意浏览器直接全屏运行）

---

## ⏱️ 一、3 分钟精密时间轴与现场节奏

| 时间段 | 幻灯片编号 | 核心主题 | Presenter 动作要点 |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:20 (20s)** | **Page 1: Hook** | Would you give an AI agent your wallet? | 眼神锁定评委，语气平稳，抛出钱包与 AI 的核心安全困境。 |
| **0:20 - 0:45 (25s)** | **Page 2: The Real Problem** | AI agents need to spend money. | 讲述 Agent 在真实工作流中购买 0.002 AVAX 数据的刚需，引出三大风险。 |
| **0:45 - 1:05 (20s)** | **Page 3: Insight / Innovation** | It is a Financial Permission Layer. | 读出核心对比句：“钱包控制谁能签名，AvaFence 控制在什么规则下可以花钱”。 |
| **1:05 - 1:20 (15s)** | **Page 4: Why Limited Wallet Fails** | Why a limited wallet is not enough. | 击碎“小额钱包就够了”的偏见，强调“小额不等于安全，模型会被忽悠，围栏不会”。 |
| **1:20 - 2:20 (60s)** | **Page 5: Live Demo** | Let’s see it on Avalanche Fuji. | **点击按钮切屏！现场连跑两场（Normal + Injection）真实 Fuji 交互。** |
| **2:20 - 2:40 (20s)** | **Page 6: Why Avalanche** | Why Avalanche? | 讲透雪崩对机器支付经济的三大支撑：快速确认、极低成本与完全可验证性。 |
| **2:40 - 3:00 (20s)** | **Page 7: Vision / Close** | Freedom for agents. Boundaries for money. | 念出愿景与收尾金句，定格在带有合约地址与 GitHub 的致谢画面。 |

---

## ⌨️ 二、演讲 HTML 快捷键操作手册

在浏览器中打开 `presentation.html` 即可使用以下原生快捷键：

- **`F` 键**：进入 / 退出全屏演示模式（推荐在连上投影仪后立即按 `F` 进入全屏）。
- **`Space` 或 `→` / `PageDown`**：下一页。
- **`←` / `PageUp`**：上一页。
- **`1` ~ `7` 键**：数字键直接跳到对应幻灯片。
- **`N` 键**：**开启 / 关闭 Speaker Notes 提词悬浮窗**（屏幕右下角会出现半透明黑底提词板，实时显示当前页的简单英文短句与中文提示，现场若紧张随时可按 `N` 唤醒）。

---

## ⚡ 三、现场 60 秒 Live Demo 极简操作协议（严防超时）

为了避免现场 60 秒内运行 3 次交易造成超时风险，**现场仅运行 2 场，Overspending 仅作能力展示**：

1. **切屏前垫话（Slide 5）**：
   > *"We support three cases. I will show you the normal flow and the attack case."*
2. **点击页面上的红色按钮 `OPEN LIVE DEMO ↗`**：
   - 浏览器将在新标签页中打开 AvaFence 控制台（本地 `http://localhost:5173` 或线上 Vercel 地址）。
3. **第 1 场：Normal Purchase（合法自主微支付，约 25 秒）**：
   - 确认停在 **Scene A**，直接点击 **Trigger Autonomous Agent**。
   - 英文台词：
     > *"The agent needs market data for 0.002 AVAX. All rules pass on Fuji. Payment executed. Mock data released. Task completed."*
4. **第 2 场：Injection Attack（提示词注入攻击防御，约 25 秒）**：
   - 鼠标点击切换到 **Scene C**，直接点击 **Trigger Autonomous Agent**。
   - 英文台词：
     > *"Now, prompt injection. The prompt tricks the agent to pay an attacker. The recipient is not allowed. The transaction was accepted by Avalanche, but the value transfer was BLOCKED by AvaFence. 0 AVAX was transferred to the attacker."*
5. **切回 PPT 标签页**：
   - 浏览器自动停留在 Slide 5，直接按键盘 `→` 键切到 Slide 6（Why Avalanche）。

---

## 🛡️ 四、网络异常或 RPC 拥堵保底预案 (Backup Plan)

- **保底 1（优先推荐）**：由于当前代码已集成真实的本地服务，若现场投影仪无外网或外网卡顿，`http://localhost:5173` 依然可以在本地通过公开 RPC 顺畅运行。
- **保底 2（录屏保底）**：若现场连不上外网，可以提前录制好 1 分钟高清两场景操作 MP4 视频备用。
- **保底 3（Slide 5 静态说明）**：Slide 5 卡片已清晰注明了 3 个场景的输入与期望结果，即使断网也可以指着屏幕上的 3 张场景卡片，结合合约真实地址进行口头讲解，同样极具说服力。

---

## 🗣️ 五、7 页极简口语化英文逐字稿 (Speaker Notes)

### Page 1 — Hook
- **EN**:
  - AI agents can think and call APIs.
  - Now, what if an agent can spend money?
  - Would you give it your wallet?
  - If you approve every payment, it is not autonomous.
  - If you give it your keys, it is not safe.
  - There is a missing layer.
- **中文提示**：眼神扫视评委，短句之间停顿 1 秒，让评委看清两张卡片。

### Page 2 — The Real Problem
- **EN**:
  - AI agents are starting to spend money.
  - To finish a task, our agent needs market data.
  - The data costs 0.002 AVAX.
  - Spending money is required to get the job done.
  - Who decides if the agent is allowed to pay?
- **中文提示**：讲真实需求。Agent 买数据才能干活，花钱是业务刚需。

### Page 3 — Insight / Innovation
- **EN**:
  - The answer is not another wallet.
  - AvaFence is a Financial Permission Layer.
  - A wallet controls access to money.
  - AvaFence controls the conditions for spending it.
  - We give agents freedom inside hard boundaries.
- **中文提示**：必须字正腔圆念出“A wallet controls access to money. AvaFence controls the conditions for spending it.”

### Page 4 — Why a Limited Wallet is Not Enough
- **EN**:
  - People say: just give the agent a small wallet.
  - That is not enough.
  - A small wallet limits how much you lose.
  - It does not control where money goes.
  - Small payment does not mean safe payment.
  - The model can be manipulated. The fence cannot.
- **中文提示**：有力反击。指出小额钱包管不住去向。强调“围栏不能被忽悠”。

### Page 5 — Live Demo
- **EN**:
  - We support three cases.
  - I will show you the normal flow and the attack case.
  - *(切到 Live Demo，跑 Scene A & Scene C)*
  - The transaction was accepted by Avalanche.
  - The payment was blocked by AvaFence.
  - 0 AVAX was transferred to the attacker.
- **中文提示**：切屏操作。强调：0 AVAX was transferred to the attacker.

### Page 6 — Why Avalanche
- **EN**:
  - Why Avalanche?
  - Autonomous agents cannot wait for slow chains.
  - Avalanche gives machine workflows fast and final settlement.
  - Fees are low for micro-payments.
  - Anyone can verify the rules and payments on-chain.
- **中文提示**：讲透雪崩对机器支付的三大刚需：快、便宜、可验证。

### Page 7 — Vision / Close
- **EN**:
  - In the future, AI agents will have wallets.
  - They will also need boundaries.
  - AvaFence is the financial permission layer for the agent economy.
  - Freedom for agents. Boundaries for money.
  - Thank you!
- **中文提示**：自信鞠躬致谢，定格在带有合约地址与开源仓库的主视觉页。

# 🏔️ AvaFence · Avalanche Builder Day 2026 决赛现场演讲指南 (中文全景实战手册)

> **项目名称**：AvaFence（发音：*A-va Fence*）  
> **中文定义**：AI Agent 资金权限边界 / 链上财务权限层  
> **英文定位**：Financial Boundaries for Autonomous AI Agents  
> **比赛性质**：Avalanche Builder Day 2026 深圳站（3 分钟极速 Pitch + 1 分钟 Q&A）  
> **核心工具**：`presentation.html`（双击直接在任意浏览器全屏演示）

---

## 一、Pitch 核心目标（评委心智占领节奏）

现场评委（投资人、Avalanche 官方布道师、资深架构师）在 3 分钟内听完数十个项目，注意力极度稀缺。我们的演讲必须精准达成以下四个心智节点：

1. **前 20 秒**：评委秒懂痛点——AI Agent 能干活了，但一旦让它花钱，要么人肉审核累死，要么给私钥被偷光。
2. **第 40 秒**：评委理解 AvaFence 的创新——这不是又一个钱包，而是**钱包之上的资金权限围栏（Financial Permission Layer）**。
3. **第 60～120 秒**：看到真实的 Avalanche Fuji 链上交互——不是静态 Mock，而是**真实签发交易、真实拦截注入攻击、0 未授权资金损失**。
4. **最后 30 秒**：理解为什么必须是 Avalanche——机器经济高频微支付依赖雪崩的快速终局、极低 Gas 与完全可验证性。

---

## 二、3 分钟（180 秒）精准倒计时推进表

| 时间轴 | 幻灯片编号 | 核心主题 | 讲者动作与评委心智 |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:20 (20s)** | **Page 1: Hook** | Would you give an AI agent your wallet? | 提出困境，眼神直视评委，产生共鸣与好奇。 |
| **0:20 - 0:45 (25s)** | **Page 2: The Real Problem** | AI agents need to spend money. | 讲述 Agent 真实买数据任务，证明花钱是业务刚需而非玩具。 |
| **0:45 - 1:05 (20s)** | **Page 3: Insight / Innovation** | It is a Financial Permission Layer. | 抛出核心对比金句，展示架构层级与 5 大权限维度。 |
| **1:05 - 1:20 (15s)** | **Page 4: Why Limited Wallet Fails** | Why a limited wallet is not enough. | 击碎“给个小额钱包就够了”的质疑，确立防御护城河。 |
| **1:20 - 2:20 (60s)** | **Page 5: Live Demo** | Let’s see it on Avalanche Fuji. | **点击按钮切屏！现场连续演练 Normal 放行 + 注入拦截。** |
| **2:20 - 2:40 (20s)** | **Page 6: Why Avalanche** | Why Avalanche? | 讲透雪崩对机器支付经济的 3 大支柱支持。 |
| **2:40 - 3:00 (20s)** | **Page 7: Vision / Close** | Freedom for agents. Boundaries for money. | 升华愿景，念出收官金句，定格在带有合约地址与 GitHub 的致谢页。 |

---

## 三、Page 1–7 深度解析与中英对照演讲台词

> ⚠️ **英文台词原则**：全篇经过严格口语化适配，每句话 ≤ 12 个英文单词，绝无长难从句与绕口生僻词。

---

### Page 1 — HOOK（抛出困境）

#### 页面中文解析
不要寒暄，不要介绍自己叫什么，开门见山抛出所有人都在担心但没人解决的核心矛盾：AI Agent 越来越聪明，能调 API、能做决策，但如果它开始自己花钱，你敢不敢把钱包私钥交给它？
- 左边卡片：每笔让人批准（Safe, but Not Autonomous）
- 右边卡片：直接给私钥（Autonomous, but Not Safe）
- 底部引出：中间缺失了一层关键基础设施。

#### 讲者现场英文台词 (<= 12 words / sentence)
> "AI agents can think and call APIs."  
> "Now, what if an agent can spend money?"  
> "Would you give it your wallet?"  
> "If you approve every payment, it is not autonomous."  
> "If you give it your keys, it is not safe."  
> "There is a missing layer."

---

### Page 2 — THE REAL PROBLEM（真实业务刚需）

#### 页面中文解析
打消评委认为“Agent 花钱只是小众玩具功能”的误解。用一个最简单的研究员场景：
用户让 Agent 去分析 AVAX 流动性，公开数据不够用，Agent 必须购买价值 0.002 AVAX 的深度数据。这时核心问题来了：谁来决定 Agent 在什么条件下被允许付款？引出提示词注入、无限死循环超额支出、恶意商户三大真实风险。

#### 讲者现场英文台词
> "AI agents are starting to spend money."  
> "To finish a task, our agent needs market data."  
> "The data costs 0.002 AVAX."  
> "Spending money is required to get the job done."  
> "Who decides if the agent is allowed to pay?"

---

### Page 3 — INSIGHT / INNOVATION（核心创新定位）

#### 页面中文解析
本页是全场得分核心！告诉评委：缺失的这一层绝不是又一个钱包，而是**资金权限层（Financial Permission Layer）**。
讲透本质区别：
- 钱包控制**谁能签名**（Who can sign）
- AvaFence 控制**在什么条件下可以花钱**（The conditions for spending it）
智能合约硬编码拦截规则：谁能花、花多少、多久花一次、只能付给谁、哪个请求。

#### 讲者现场英文台词
> "The answer is not another wallet."  
> "AvaFence is a Financial Permission Layer."  
> "A wallet controls access to money."  
> "AvaFence controls the conditions for spending it."  
> "We give agents freedom inside hard boundaries."

---

### Page 4 — WHY A LIMITED WALLET IS NOT ENOUGH（打消质疑）

#### 页面中文解析
很多评委第一时间会想：“我只给 Agent 一个只有 0.02 AVAX 的小钱包不就安全了吗？”
在这页直接用严密的逻辑反击：
小额钱包只能限制**最多损失多少钱**，根本无法控制**钱流向哪里**！
如果 Agent 遭遇提示词注入（Prompt Injection），被黑客诱骗转账 0.001 AVAX，小额钱包会直接放行扣款。
而在 AvaFence 体系下，即使金额只有 0.001 AVAX，只要收款方不在白名单，链上直接熔断拦截！
点出金句：**Small payment ≠ Safe payment. The model can be tricked. The rules still hold.**

#### 讲者现场英文台词
> "People say: just give the agent a small wallet."  
> "That is not enough."  
> "A small wallet limits how much you lose."  
> "It does not control where money goes."  
> "Small payment does not mean safe payment."  
> "The model can be tricked. The rules still hold."

---

### Page 5 — LIVE DEMO TRANSITION（实证实测过渡）

#### 页面中文解析
展示 3 个完整能力卡片：Normal Purchase（正常购买放行）、Overspending（超限拦截）、Injection Attack（注入攻击拦截）。
但现场明确告诉评委：时间紧凑，我们现场演练最核心的正常工作流与最致命的注入攻击防御。
点击红色大按钮 `OPEN LIVE DEMO ↗`，无缝切到运行中的 AvaFence 控制台。

#### 讲者现场英文台词
> "We support three cases."  
> "I will show you the normal flow and the attack case."  
> *(点击切屏，进入 Live Demo 界面)*

---

### Page 6 — WHY AVALANCHE（雪崩网络价值）

#### 页面中文解析
从 Demo 切回 PPT，讲清楚 AvaFence 不是随便找个链部署，而是产品体验深度依赖 Avalanche 的特性：
1. **Fast Finality**：机器工作流不能忍受缓慢的确认，雪崩提供快速、不可逆的确定性结算。
2. **Low-Cost Transactions**：Agent 高频购买数据、算力、API，必须依赖极低且可预测的微支付手续费。
3. **Verifiable Execution**：人类、Agent、商户都能独立在链上验证策略状态与执行结果。

#### 讲者现场英文台词
> "Why Avalanche?"  
> "Autonomous agents cannot wait for slow chains."  
> "Avalanche gives machine workflows fast and final settlement."  
> "Fees are low for micro-payments."  
> "Anyone can verify the rules and payments on-chain."

---

### Page 7 — VISION / CLOSE（未来愿景与收官）

#### 页面中文解析
未来展望：今天我们跑通了单个 Research Agent + Avalanche Fuji + 1 个商户。
明天，所有的 Coding Agents、采购 Agent、企业级 Agent 集群都会拥有自主支付钱包。
AvaFence 的愿景是成为未来自主 Agent 经济的底层资金权限标准。
念出收尾金句：**Freedom for agents. Boundaries for money.** 定格致谢。

#### 讲者现场英文台词
> "In the future, AI agents will have wallets."  
> "They will also need boundaries."  
> "AvaFence is the financial permission layer for the agent economy."  
> "Freedom for agents. Boundaries for money."  
> "Thank you!"

---

## 四、Live Demo 现场 60 秒极简操作顺序

在 Slide 5 点击 `OPEN LIVE DEMO ↗`，浏览器会自动在新标签页打开控制台（`http://localhost:5173`）：

### 1. 第一场：Normal Purchase（合法购买，约 25 秒）
- **操作**：默认停留在 **Scene A**，直接点击左侧红色大按钮 **`Trigger Autonomous Agent`**。
- **看点**：右侧 8 项 Policy Checks 依次顺序打勾亮绿，下方出现绿色 `APPROVED` 判定，Avalanche Fuji 真实出块（显示交易哈希与毫秒延迟），商户验单放行，左侧释放付费数据集并弹出彩带礼花。
- **讲者英文**：
  > *"The agent needs market data for 0.002 AVAX. All rules pass on Fuji. Payment executed. Mock data released. Task completed."*

### 2. 第二场：Injection Attack（提示词注入防御，约 25 秒）
- **操作**：鼠标点击切换到 **Scene C**，直接点击红色大按钮 **`Trigger Autonomous Agent`**。
- **看点**：左侧出现黄色攻击警告（Simulated Attack Input），意图向黑客地址转账 0.001 AVAX。右侧 Policy Checks 检查到第 5 项 `Merchant Allowed` 瞬间变红 `FAIL`，后续检查自动 `SKIPPED` 短路跳过。下方出现红色 `BLOCKED` 判定。
- **关键事实强调**：
  > *"Now, prompt injection. The prompt tricks the agent to pay an attacker. The recipient is not allowed. The transaction was accepted by Avalanche, but the value transfer was BLOCKED by AvaFence. 0 AVAX was transferred to the attacker."*

### 3. 切回 PPT
- 直接用鼠标关掉或切回 `presentation.html` 标签页（依然停留在 Slide 5），按键盘 `→` 键切到 Slide 6。

---

## 五、为什么现场不演示 Overspending（超限拦截）？

- **时间控制严苛**：黑客松 Demo 限时极紧（通常总共只有 3 分钟），在 Avalanche Fuji 测试网上发起一笔真实交易、等待广播与收据确认平均需要 2～4 秒。
- **连跑 3 笔真实交易有超时风险**：如果现场连续跑 3 笔真实链上交易，光等待 RPC 响应与出块就需要 12～18 秒，极易打乱演讲节奏。
- **能力完整性已在 UI 展示**：Slide 5 中间卡片已经明确展示了 `02 · OVERSPENDING (0.010 AVAX > 0.003 Cap ➔ BLOCKED)`，评委一眼就能看懂单笔超额逻辑。
- **最能打动评委的是安全注入防御**：Normal 证明系统能干活，Injection 证明 AvaFence 的不可替代价值。把宝贵的时间留给 Injection Attack 是最具性价比的策略。

---

## 六、全套键盘快捷键与投影操作注意事项

### 1. 快捷键
- **`F` 键**：进入 / 退出全屏（投屏连接后第一时间按 `F`）。
- **`Space` 或 `→` / `PageDown`**：下一页。
- **`←` / `PageUp`**：上一页。
- **`1` ～ `7` 键**：数字键直接跳到对应幻灯片。
- **`N` 键**：开启 / 关闭半透明 Speaker Notes 提词悬浮板。

### 2. 投影仪核心避坑指南
- 🚨 **切勿在大屏幕镜像模式下按 `N` 键**：如果您是屏幕复制模式（Mirror Screen），按 `N` 会把提词器直接投影在评委眼前的幕布上！提词器仅建议在您个人电脑演练时使用，或在屏幕扩展模式（主屏 PPT，副屏提词）下使用。
- 🚨 **提前关闭操作系统休眠与通知**：关闭微信、QQ、钉钉弹窗，避免演示中断。
- 🚨 **浏览器预热**：演示前在 Chrome 中将 `presentation.html` 和 `http://localhost:5173` 都提前打开并排好标签页，确保切屏只需 `Ctrl + Tab` 或鼠标轻点。

---

## 七、Fuji 链上赛前 15 分钟 Checklist

在 Demo Day 上台前 15 分钟，必须打开控制台检查三项链上健康度：

1. **测试币余额充足**：
   - 检查 Owner 钱包余额是否 ≥ 0.05 AVAX。
   - 检查 Agent 独立钱包是否留有微量 Gas（≥ 0.005 AVAX）。若不足，在页面顶部点击一键充值小按钮充值。
2. **Demo Policy 有效性检查**：
   - 检查当前策略状态是否为 `ACTIVE`。
   - 检查 `Remaining Budget` 是否足够支撑 2～3 次测试（建议 ≥ 0.01 AVAX）。
   - 检查 `Expiry` 有效期是否未过期。
3. **RPC 网络连通性**：
   - 观察页面左上角是否有绿色 `[DEMO READY · Fuji Verified]` 徽章。如果有红色提示，刷新页面重新连接 RPC。

---

## 八、Backup Demo 使用与链上异常应急预案

万一现场发生会场 Wi-Fi 断开、RPC 限流或 Avalanche 测试网极度拥堵：

### 1. 静态卡片讲解（无需断网惊慌）
如果点击 Trigger 后由于网络问题菊花转圈超过 8 秒：
立刻淡定切回 Slide 5，指着屏幕上的 3 张卡片对评委说：
> *"Our Fuji smart contract is deployed at `0xB637...770`. Due to the venue network latency, you can see our verified logic right here: For legitimate requests, all 8 bitmask checks pass atomically. When an injection attack occurs, the recipient check fails, and zero value is transferred. All past transaction hashes are verified on Snowtrace."*

### 2. 本地备用录屏播放
若提前在本地录制了 1 分钟两场景的无缝操作视频（如 `demo_backup.mp4`）：
可将视频链接填入 `presentation.html` 顶部的 `CONFIG.backupDemoUrl`，点击 `PLAY BACKUP DEMO ▷` 即可秒开本地视频解说。

---

## 九、关于项目真实性的严谨边界声明

评委提问非常尖锐，我们如实说明真实与模拟的边界，更显工程师素养与可信度：

1. **真实部分 (100% Real)**：
   - **智能合约真实**：Solidity 合约运行在 Avalanche Fuji C-Chain（地址：`0xB6379ce69E73cC6d20E5284D14386F4fBF8Ed770`）。
   - **签名与交易真实**：每一笔交易都是 Agent 钱包在本地私钥真实签署并广播上链的真实交易。
   - **拦截事件真实**：链上真实触发 `PaymentBlocked(MERCHANT_NOT_ALLOWED)` 事件，转账金额严格为 0。
2. **模拟部分 (Transparent Mocks)**：
   - **付费数据集 (Mock Premium Dataset)**：Agent 购买的订单簿深度数据是本地模拟的优质数据包，我们的核心验证点在于**真实链上付款成功后商户才交货**。
   - **注入攻击输入 (Simulated Attack Prompt)**：Scene C 的攻击提示词是预先配置的经典注入测试样本，用于模拟 Agent 模型被诱导越权时的防御表现。

---

## 十、评委常见 Q&A 杀手锏应答

### Q1: “这和多签钱包（Gnosis Safe）有什么区别？”
> **应答**：“多签钱包解决的是‘多个人如何共同批准一笔钱’，依然需要人类持续签名；而 AvaFence 解决的是‘**在人类不介入的情况下，如何让 AI Agent 在预设的安全围栏内自主花钱**’。人类只需在开头设定一次规则，Agent 就能在规则内自主运行。”

### Q2: “为什么不直接用 ERC-4337 账户抽象的 Session Key？”
> **应答**：“Session Key 只能控制调用哪个合约函数或限制粗粒度的时间与金额；而 AvaFence 是一个**专门针对 AI Agent 行为特征设计的应用级权限策略引擎**，支持单笔硬顶、动态日预算滚算、商户严格白名单比对、非对称防重放 Nonce 与商户端闭环核验。未来我们可以无缝封装为 ERC-4337 验证器插件。”

### Q3: “商户如何确认 Agent 真的付款了？”
> **应答**：“商户提供轻量级验证服务，通过监听 Avalanche Fuji 的 `PaymentExecuted` 事件，严格核对交易哈希、RequestId、Agent 地址与付款金额。只有全部吻合，商户才释放付费 API 或数据资产。”

---

## 十一、演讲者必须牢记的 3 句英文（哪怕其他全忘也要念对）

1. **核心差异（第 1 分钟）**：
   > *"A wallet controls access to money. AvaFence controls the conditions for spending it."*
   > （钱包控制谁能签名，AvaFence 控制在什么条件下可以花钱。）

2. **安全本质（第 2 分钟）**：
   > *"Small payment does not mean safe payment. The model can be tricked. The rules still hold."*
   > （小额支付不等于安全支付。模型会被忽悠，但链上规则永远坚守。）

3. **收官愿景（第 3 分钟）**：
   > *"Freedom for agents. Boundaries for money."*
   > （让 Agent 拥有自由，把边界留给金钱。）

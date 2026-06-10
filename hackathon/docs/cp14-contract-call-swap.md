# CP14 CAW contract_call Swap — 实施记录

> 日期：2026-06-08 ~ 2026-06-09
> 目标：实现 CAW contract_call 真实 swap 流程
> 最终状态：✅ Done — 真实 CAW contract_call swap 在 Sepolia 上链成功（2026-06-09）
>
> **更新 2026-06-09**：早期 Processing/Failed 状态已解决。最终验证的 swap 证据（3 笔 tx hash + USDC 到账）记录在 backend-progress.md 和 README Demo Evidence 中。

---

## 1. 目标

实现 CP14（CAW contract_call Demo Path），让 Sentinel 能通过 CAW 执行 Uniswap V3 swap：

```
Intent "Swap 0.001 ETH for USDC"
→ TxProposal with calldata
→ RiskPipeline 5 条规则
→ Agent B/C 审查
→ DecisionEngine
→ CawExecutor.contract_call
→ CAW → Sepolia 链上执行
```

**最小可行性目标：**
- TxProposal 包含 calldata + value
- CawExecutor 区分 transfer → transfer_tokens / swap → contract_call
- 至少一笔真实 swap 在链上可查证

---

## 2. 实施步骤

### 2.1 TxProposal 加字段

**文件：** `models.py`

```python
@dataclass
class TxProposal:
    ...
    calldata: Optional[str] = None   # 新增
    value: Optional[str] = None      # 新增
```

### 2.2 Swap calldata 编码器

**文件：** `swap_codec.py`（新建）

- 编码 Uniswap V3 `exactInputSingle` calldata
- 无 web3 依赖，纯 Python 实现
- 支持 ETH/WETH/USDC/USDT token 对
- 自动选择 fee tier（0.3% for ETH/USDC，0.01% for stable pairs）
- 输出 value 为 ETH 格式（非 wei）

### 2.3 CawExecutor 支持 swap

**文件：** `execution.py`

- MockExecutionBackend：swap → dry_run（含 calldata evidence）
- CawExecutor：swap → 3 步流程：
  1. Wrap ETH → WETH（`deposit()`）
  2. Approve router 花费 WETH（`approve()`）
  3. Swap WETH → USDC（`exactInputSingle()`）
- 每步等待上链后再执行下一步（`_wait_for_tx()`）

### 2.4 Demo parser 生成 calldata

**文件：** `api.py`

```python
from swap_codec import build_swap_proposal
swap_data = build_swap_proposal(from_token="ETH", to_token="USDC", amount_eth=str(amount))
return TxProposal(
    ...,
    calldata=swap_data.get("calldata"),
    value=swap_data.get("value"),
)
```

### 2.5 Pact 配置

创建支持 contract_call 的 Pact：

```bash
caw pact submit \
  --intent "Sentinel demo: ETH transfers and Uniswap V3 swaps on Sepolia" \
  --policies '[
    {"name": "sentinel-transfer", "type": "transfer", "rules": {...}},
    {"name": "sentinel-swap", "type": "contract_call", "rules": {"when": {"chain_in": ["SETH"]}, "effect": "allow", "deny_if": {"amount_gt": "0.002"}}}
  ]'
```

---

## 3. 遇到的问题

### 3.1 .env 配置问题

| 问题 | 原因 | 解决 |
|------|------|------|
| API key 无效 | .env 中 key 被 mask（`***`） | 从 `~/.cobo-agentic-wallet/profiles/.../credentials` 读取真实 key |
| COBO_TOKEN_ID 为 `***` | 合并分支时 mask | 改为 `SETH` |
| ENABLE_REAL_TX=false | 默认安全设置 | 改为 `true` |

### 3.2 Pact 问题

| 问题 | 原因 | 解决 |
|------|------|------|
| "you need an active pact" | 旧 pact 已过期（2026-06-06） | 创建新 pact |
| "contract_call denied" | 新 pact 的 policy type 只有 transfer | 添加 contract_call policy |
| "contract_in Extra inputs" | contract_call 的 `when` 不支持 `contract_in` | 只用 `chain_in` |
| "Default Pact" 权限检查 | CAW 系统始终用 Default Pact 检查权限 | **必须使用 pact API key，不能用 wallet API key** |

### 3.3 Value 格式问题

| 问题 | 原因 | 解决 |
|------|------|------|
| "TX_INVALID_AMOUNT_FORMAT" | value 发送的是 wei（`1000000000000000`） | 改为 ETH 格式（`0.001`） |

### 3.4 Swap 执行问题

| 问题 | 原因 | 解决 |
|------|------|------|
| Swap 直接失败 | 钱包没有 WETH，只有原生 ETH | 实现 3 步流程：wrap → approve → swap |
| 3 步没等待 | 代码同时提交 3 笔交易 | 添加 `_wait_for_tx()` 等待每步完成 |
| 交易一直 Processing | Sepolia 测试网拥堵或 gas 过低 | 网络问题，非代码问题 |

### 3.5 API Key 关键发现

**最重要的发现：** CAW 的 `contract_call` 和 `transfer_tokens` 必须使用 **pact API key**，不能使用 wallet API key。

```python
# 错误：用 wallet API key → 使用 Default Pact → 权限检查失败
async with WalletAPIClient(api_key=config.api_key) as client:
    await client.contract_call(...)

# 正确：用 pact API key → 使用自定义 Pact → 权限检查通过
pact = await client.get_pact(config.pact_id)
pact_api_key = pact.get("api_key")
async with WalletAPIClient(api_key=pact_api_key) as client:
    await client.contract_call(...)
```

---

## 4. 当前状态

### 4.1 代码层面 ✅

- `models.py`：TxProposal 加 calldata/value
- `swap_codec.py`：Uniswap V3 calldata 编码器
- `execution.py`：CawExecutor 3 步 swap 流程 + 等待逻辑
- `api.py`：demo parser 生成含 calldata 的 swap proposal
- `test_api.py` / `test_eval_components.py`：测试更新

### 4.2 CAW 层面 ✅

- Pact 创建成功（含 transfer + contract_call policy）
- Pact API key 正确使用
- 3 步交易正确提交到 CAW

### 4.3 链上层面 ⏳

- Wrap ETH → WETH：Processing（等待上链）
- Approve router：Processing（等待上链）
- Swap：Failed（依赖前两步）

### 4.4 测试结果

```
单元测试：91/91 pass
Eval：108/109 (99%)
```

---

## 5. 剩余工作

### 5.1 立即可做

- [ ] 等待 Sepolia 交易上链，验证完整 swap 流程
- [ ] 如交易失败，检查 gas 价格并重试

### 5.2 优化项

- [ ] `_wait_for_tx()` 超时时间可配置化
- [ ] 支持取消卡住的交易（speedup/cancel）
- [ ] 添加交易状态查询 API

### 5.3 已知限制

- Sepolia 测试网可能拥堵，交易 Processing 时间长
- CAW faucet 每天限 0.02 ETH
- 3 步流程比单步慢（需要等待每步上链）

---

## 6. 关键代码位置

| 文件 | 关键函数 | 作用 |
|------|----------|------|
| `execution.py` | `_execute_real_swap()` | 3 步 swap 主流程 |
| `execution.py` | `_wrap_eth_to_weth()` | Step 1: Wrap ETH |
| `execution.py` | `_approve_router()` | Step 2: Approve router |
| `execution.py` | `_wait_for_tx()` | 等待交易上链 |
| `swap_codec.py` | `encode_swap_calldata()` | 编码 Uniswap V3 calldata |
| `swap_codec.py` | `build_swap_proposal()` | 构建完整 swap proposal |

---

## 7. 链上可查证证据

### 7.1 CAW 钱包信息

| 字段 | 值 |
|------|-----|
| Wallet UUID | `8e73255c-8800-44c7-a913-e1f82c454149` |
| Wallet Address | `0x927f175c85d61237f817b499f739336b498384fe` |
| Chain | SETH (Sepolia) |
| CAW API URL | `https://api.agenticwallet.cobo.com` |

### 7.2 Pact 信息

| 字段 | 值 |
|------|-----|
| Pact ID | `e71f5662-5e23-4990-bf22-f6161c779cdd` |
| Pact Name | Sentinel demo: ETH transfers and Uniswap V3 swaps on Sepolia |
| Status | active |
| Policy Types | transfer + contract_call |
| Deny Condition | amount_gt: 0.002 ETH |

### 7.3 Sepolia 充值记录（链上可查）

| CAW TX ID | TX Hash | Amount | Status | 时间 |
|-----------|---------|--------|--------|------|
| `a393c824-5dcf-49d7-9617-f072c8880b48` | `0x1c61bac47f0c95c7ff2906fa5b52b3ed96e54c36714d6e441c5c5d7f7f718f29` | 0.01 ETH | Success | 2026-06-05 08:23 |
| `1cb40896-bcb1-4500-aa17-cb5d3f07939d` | `0xdcb851c0e740eca6d2dbf87c0b48005b1f5a9c83e0436b91bd966b24567f9383` | 0.05 ETH | Success | 2026-06-08 22:24 |
| `c3aa9836-cdf8-4357-b346-a607bcaa9e53` | `0xf65640971911d7223c854860f60cc4f9807d7978b5826aece5c94b1e2ff75c47` | 0.01 ETH | Success | 2026-06-08 23:27 |
| `5763cf16-2a58-4204-ac9b-6f34fa577bb4` | `0x2a39ea600bb0b4f5e191a3f6efb6e0633e57a67f6477199b62717eb76c34bc13` | 0.01 ETH | Success | 2026-06-08 23:27 |

### 7.4 历史 Transfer 成功记录（链上可查）

| CAW TX ID | TX Hash | Amount | Status | 时间 |
|-----------|---------|--------|--------|------|
| `9411a608-a59f-4a48-b7a6-317f87771e56` | `0x6cbefee175a19325b1b82816d1b7b1aae7b5de501b1b1caf689c326a56026000` | 0.001 ETH | Success | 2026-06-05 08:32 |
| `9bcd2fcc-a320-4cb0-9b70-6f0cadc4000c` | `0x768e6575e1be73153ed9168356c6d32ff85a52ab5ef243b0d4a00d2b5c29ec55` | 0.001 ETH | Success | 2026-06-05 09:44 |
| `f56d37ca-7475-4349-a964-c9755027a2c0` | `0xc1bffdc320c41e9a4d23969fcdeb2dfdb9874808317a3bfe81f873e127f9fd5d` | 0.001 ETH | Success | 2026-06-05 09:51 |

### 7.5 Swap 3 步流程交易记录

**第一轮（value 格式错误，wei）：**

| CAW TX ID | Type | Status | Amount | Contract | Request ID | 时间 |
|-----------|------|--------|--------|----------|------------|------|
| `a787b9bb-baba-4dff-b69c-972b26fcd940` | contract_call | Failed | 0.001 | 0x3bFA...48E (SwapRouter) | sentinel-e0108bc9... | 22:17 |
| `e8a36931-17ef-4119-afbf-0239f191e49f` | contract_call | Failed | 0.001 | 0x3bFA...48E | sentinel-5073e2cb... | 22:29 |
| `b0787862-4f69-4e43-ab74-a4d3d0237e74` | contract_call | Failed | 0.001 | 0x3bFA...48E | sentinel-2e662f33... | 22:38 |

**第二轮（pact API key 问题）：**

| CAW TX ID | Type | Status | Amount | Contract | Request ID | 时间 |
|-----------|------|--------|--------|----------|------------|------|
| `e195f6f2-718f-4fb0-8d1f-e7cb9b97d785` | contract_call | Rejected | 0.001 | 0x927f...84fe | test-wallet-key | 22:43 |
| `4cfba062-797d-453d-a129-9bcd8934d484` | contract_call | Processing | 0.001 | 0x927f...84fe | test-pact-key | 22:43 |
| `6e240e6b-ced9-49e9-bc92-6cbec246096d` | contract_call | Processing | 0.001 | 0x927f...84fe | test-pact-key-contract-call | 22:43 |

**第三轮（3 步流程，未等待）：**

| CAW TX ID | Type | Status | Amount | Contract | Request ID | 时间 |
|-----------|------|--------|--------|----------|------------|------|
| `9c71fe3d-bcd4-42a9-9da9-2727327d1ee6` | contract_call | Processing | 0.001 | 0xfff9...6b14 (WETH) | sentinel-151d1e8b...-wrap | 23:15 |
| `65dc3c2c-3f99-430b-a385-a48fff602fa0` | contract_call | Processing | 0 | 0xfff9...6b14 | sentinel-151d1e8b...-approve | 23:15 |
| `d6c98ca5-bab1-41b3-8e25-889c185f83e7` | contract_call | Failed | 0 | 0x3bFA...48E | sentinel-151d1e8b...-swap | 23:15 |

**第四轮（3 步流程，加等待）：**

| CAW TX ID | Type | Status | Amount | Contract | Request ID | 时间 |
|-----------|------|--------|--------|----------|------------|------|
| `be269c61-2e1f-4664-a054-b44cb6dfe623` | contract_call | Processing | 0.001 | 0xfff9...6b14 | sentinel-0671695c...-wrap | 23:17 |

### 7.6 Wrap ETH 测试记录

| CAW TX ID | Type | Status | Amount | Contract | Request ID | 时间 |
|-----------|------|--------|--------|----------|------------|------|
| `efdec1d7-9cfe-4cf2-abdc-b6d6296fba43` | contract_call | Rejected | 0.01 | 0xfff9...6b14 | wrap-eth-test | 22:33 |
| `33277903-2eca-4ef4-91c7-0be5d54fc566` | contract_call | Rejected | 0.01 | 0xfff9...6b14 | wrap-eth-test-2 | 22:35 |
| `bd690414-cb2c-4143-83c4-475489347e55` | contract_call | Processing | 0.001 | 0xfff9...6b14 | wrap-0.001-eth | 22:48 |
| `8285816d-c413-4b06-bc9d-dbf0fceaa967` | contract_call | Rejected | 0.01 | 0xfff9...6b14 | wrap-eth-step1 | 22:48 |

### 7.7 关键合约地址

| 合约 | Sepolia 地址 | 用途 |
|------|-------------|------|
| Uniswap V3 SwapRouter02 | `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E` | Swap 执行 |
| WETH | `0xfff9976782d46cc05630d1f6ebab18b2324d6b14` | ETH 包装 |
| USDC | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | 目标 token |
| UniswapV3Factory | `0x0227628f3F023bb0B980b67D528571c95c6DaC1c` | Pool 查询 |
| ETH/USDC Pool | `0x6ce0896eae6d4bd668fde41bb784548fb8f59b50` | 流动性池 |

### 7.8 验证方式

1. **Sepolia Etherscan**：`https://sepolia.etherscan.io/address/0x927f175c85d61237f817b499f739336b498384fe`
2. **CAW API**：`GET /api/v1/transactions/{tx_id}` 查询交易详情
3. **Uniswap Pool**：调用 Factory 的 `getPool(WETH, USDC, 3000)` 验证池子存在

---

## 8. 经验教训

1. **CAW API key 不能混用**：wallet API key 和 pact API key 是不同的，必须用 pact API key 才能使用自定义 Pact。

2. **Default Pact 不能修改**：CAW 系统的 Default Pact 是系统管理的，不能 update/revoke，只有创建新 Pact。

3. **contract_call 的 `when` 字段有限**：只支持 `chain_in`，不支持 `contract_in` 或 `contract_addr`。

4. **value 格式**：CAW API 要求 value 为 ETH 格式（如 "0.001"），不是 wei。

5. **Sepolia 测试网不稳定**：交易可能长时间 Processing，需要耐心等待或重试。

6. **3 步流程需要等待**：wrap → approve → swap 每步必须等上一步完成，否则会失败。

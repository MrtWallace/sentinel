# Sentinel — Post-MVP 需求文档

> **目的**：记录从黑客松 MVP 到真实产品需要补齐的架构和功能。
> **当前状态**：MVP 已完成（后端 CP1-7.6，前端 CP0-7），demo-ready。
> **适用对象**：Codex / Claude Code 接手开发时的任务输入。

---

## 1. 背景

当前 MVP 使用共享 CAW 钱包、硬编码阈值、本地 JSON 审计日志。这些在 demo 中足够，但离"真实产品"有以下关键差距：

| 维度 | MVP 现状 | 真实产品要求 |
|------|----------|-------------|
| 钱包 | 所有用户共享一个 CAW | 每个用户独立 CAW 钱包 |
| 风控配置 | 硬编码阈值 | 用户可自定义风险偏好 |
| 执行容灾 | CAW 不可用直接报错 | 降级到 SmartAccount 或 pending 队列 |
| 审计存储 | 本地 JSON 文件 | SQLite/PostgreSQL，支持查询和分页 |
| 安全防护 | LLM 输入输出无校验 | 输入清洗 + 输出 schema 验证 |
| API 安全 | 无认证无限制 | JWT 认证 + Rate Limiting |

---

## 2. 需求清单

### 2.1 Per-User CAW 钱包注册

**优先级**：P0 — 架构基础，后续全依赖

**目标**：每个用户通过 MetaMask 连接后，绑定自己的 CAW 钱包。Sentinel 风控层只做判断，执行时路由到用户自己的 CAW。

**数据模型**：

```python
@dataclass
class UserWallet:
    user_address: str          # MetaMask 地址（主键）
    caw_wallet_id: str         # CAW 钱包 ID
    caw_api_key: str           # CAW API Key（加密存储）
    pact_id: str | None        # 当前活跃 Pact ID
    pact_status: Literal["none", "pending", "active", "expired", "revoked"]
    created_at: str
    updated_at: str
```

**API 端点**：

```
POST /api/wallet/register
  请求：{ "user_address": "0x..." }
  行为：调用 CAW SDK 创建钱包，返回 pairing 信息
  响应：{ "wallet_id": "...", "pairing_url": "...", "status": "pending_pairing" }

GET /api/wallet/status?user_address=0x...
  响应：{ "wallet_id": "...", "pact_status": "active", "pact_limits": {...} }

POST /api/wallet/pact
  请求：{ "user_address": "0x...", "limits": { "max_amount_eth": "0.1", ... } }
  行为：提交 PactSpec 到 CAW，等待用户在 App 审批
  响应：{ "pact_id": "...", "status": "pending_approval" }
```

**执行路由改造**：

```python
# 现在
def _execute_if_allowed(result, tx_id):
    return build_execution_backend().execute(final_tx, tx_id)

# 改为
def _execute_if_allowed(result, tx_id, user_address):
    wallet = db.get_wallet(user_address)
    if not wallet or wallet.pact_status != "active":
        return ExecutionResult(status="no_wallet", reason="请先绑定 CAW 钱包并激活 Pact")
    backend = build_execution_backend(wallet.caw_api_key, wallet.caw_wallet_id)
    return backend.execute(final_tx, tx_id, wallet.pact_id)
```

**前端改造**：
- SentinelShell 顶部栏：已连接钱包时显示用户 CAW 地址 + Pact 状态
- 未绑定时：显示"绑定 CAW 钱包"按钮 → 展示 pairing 流程
- `/api/execute` 请求时自动携带 `user_address`

**Pitfalls**：
- CAW 钱包创建需要用户在手机 App 上完成 pairing，后端无法全自动
- Pact 提交后需要 owner 在 App 上审批，不是即时生效
- CAW API Key 需要加密存储，不能明文写数据库
- Demo 时应预创建 2-3 个已 pairing + 已审批的钱包，避免现场卡在 pairing

---

### 2.2 用户风控配置（Settings 页）

**优先级**：P0 — 评委必问

**目标**：用户可以在前端调整风险参数，不再依赖硬编码阈值。

**可配置项**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `swap_amount_threshold_pass` | Decimal | 0.05 ETH | 低于此值自动通过 |
| `swap_amount_threshold_confirm` | Decimal | 0.2 ETH | 低于此值需确认，高于则拒绝 |
| `transfer_amount_threshold_pass` | Decimal | 0.02 ETH | 同上 |
| `transfer_amount_threshold_confirm` | Decimal | 0.1 ETH | 同上 |
| `slippage_threshold_pass` | float | 0.03 (3%) | 滑点阈值 |
| `slippage_threshold_confirm` | float | 0.05 (5%) | |
| `frequency_limit` | int | 3 | 24h 内同目标最大次数 |
| `whitelist_mode` | Literal["strict", "open"] | "strict" | 白名单模式 |
| `custom_whitelist` | list[str] | [] | 用户自定义白名单合约 |
| `auto_approve_low_risk` | bool | true | 低风险是否自动执行 |

**API 端点**：

```
GET /api/config?user_address=0x...
  响应：当前用户的风险配置

PUT /api/config
  请求：{ "user_address": "0x...", "config": { ... } }
  响应：更新后的配置

POST /api/config/reset
  请求：{ "user_address": "0x..." }
  响应：恢复默认配置
```

**前端**：
- 新增 `/settings` 页面
- 分区展示：金额阈值、滑点设置、白名单管理、频率限制
- 每个参数有说明文字和合理范围提示
- 修改后实时生效，不需要重启后端

**实现要点**：
- RiskPipeline 初始化时从 config 读取阈值，不硬编码
- AmountRule、SlippageRule、FrequencyRule、WhitelistRule 都需要支持动态配置
- config 存储在 SQLite `user_configs` 表
- 未配置的用户使用全局默认值

---

### 2.3 CAW 降级策略

**优先级**：P1 — 故障处理能力

**目标**：CAW 不可用时自动降级到备用执行路径，不直接报错。

**降级链**：

```
CAW (primary)
  → 超时 / API 错误 / policy deny
SmartAccount.sol (fallback)
  → 不可用 / 网络错误
Pending Queue (last resort)
  → 入队等待，CAW 恢复后自动重试
```

**实现**：

```python
class FallbackExecutor(ExecutionBackend):
    def __init__(self, backends: list[ExecutionBackend]):
        self.backends = backends
    
    def execute(self, tx, tx_id):
        for backend in self.backends:
            try:
                result = backend.execute(tx, tx_id)
                if result.status not in ("failed", "timeout"):
                    return result
            except Exception as e:
                log.warning(f"{backend.name} failed: {e}, trying next")
                continue
        
        # All backends failed → pending queue
        return self._enqueue(tx, tx_id)
```

**审计日志**：
- 记录使用了哪个 backend
- 如果降级了，记录降级原因
- pending 状态的交易有重试计数

**前端展示**：
- 执行结果显示 backend 名称（"CAW" / "SmartAccount" / "Pending"）
- 降级时显示警告提示

---

### 2.4 审计日志 SQLite 持久化

**优先级**：P1 — 比 JSON 更真实

**目标**：审计日志从本地 JSON 文件迁移到 SQLite，支持结构化查询。

**数据模型**：

```sql
CREATE TABLE audit_logs (
    tx_id TEXT PRIMARY KEY,
    user_address TEXT NOT NULL,
    intent TEXT NOT NULL,
    status TEXT NOT NULL,           -- executed / rejected / confirm_needed / failed
    decision TEXT NOT NULL,         -- execute / confirm / reject
    decision_reason TEXT,
    sentinel_decision TEXT,
    execution_backend TEXT,         -- caw / smartaccount / mock / pending
    execution_status TEXT,
    tx_hash TEXT,
    caw_wallet_id TEXT,
    caw_pact_id TEXT,
    caw_request_id TEXT,
    policy_denied BOOLEAN DEFAULT FALSE,
    policy_reason TEXT,
    attempts_json TEXT NOT NULL,    -- JSON array of attempts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_address);
CREATE INDEX idx_audit_status ON audit_logs(status);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

**API 改造**：

```
GET /api/audit-log?user_address=0x...&status=executed&limit=20&offset=0
  响应：分页的审计列表，支持按用户/状态过滤

GET /api/audit-log/{tx_id}
  响应：单条完整审计记录（不变）
```

---

### 2.5 Prompt Injection 防护

**优先级**：P2 — 安全叙事加分

**目标**：对 LLM Agent 的输入输出做安全校验，防止注入攻击和异常输出。

**输入清洗**：

```python
def sanitize_user_input(intent: str) -> str:
    # 长度限制
    if len(intent) > 500:
        raise ValueError("Intent too long (max 500 chars)")
    # 过滤控制字符
    intent = ''.join(c for c in intent if c.isprintable() or c in '\n\t')
    # 过滤常见注入模式
    dangerous_patterns = [
        "ignore previous instructions",
        "you are now",
        "system prompt",
        "forget your rules",
    ]
    for pattern in dangerous_patterns:
        if pattern in intent.lower():
            raise ValueError(f"Potentially malicious input detected")
    return intent.strip()
```

**输出验证**：

```python
def validate_agent_output(raw_json: dict, expected_schema: type) -> Any:
    # 严格 schema 校验
    try:
        return expected_schema(**raw_json)
    except (TypeError, ValueError) as e:
        raise ValueError(f"Agent output failed schema validation: {e}")
    
    # 二次检查：proposal 字段不能和输入差异过大
    # action 不能改变（transfer 不能变成 swap）
    # to_contract 必须在白名单内
    # amount 不能超过输入金额的 200%
```

**异常检测**：

```python
def detect_anomaly(original_intent: str, proposal: TxProposal) -> list[str]:
    warnings = []
    # 如果输入是 transfer 但 proposal 是 swap
    if "transfer" in original_intent.lower() and proposal.action == "swap":
        warnings.append("Action mismatch: input says transfer, proposal says swap")
    # 如果金额差异过大
    # 如果合约地址不在白名单
    return warnings
```

---

### 2.6 API 认证

**优先级**：P3 — 基础安全

**目标**：`/api/execute` 等端点需要 JWT 认证。

**实现**：

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def verify_token(token = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/api/execute")
async def execute(request: ExecuteRequest, user=Depends(verify_token)):
    ...
```

**端点**：

```
POST /api/auth/login
  请求：{ "user_address": "0x...", "signature": "0x..." }  # MetaMask 签名登录
  响应：{ "token": "jwt...", "expires_in": 86400 }
```

---

### 2.7 Rate Limiting

**优先级**：P3 — 防滥用

**目标**：每用户每分钟最多 N 次请求。

**实现**：

```python
from fastapi import Request
from collections import defaultdict
import time

class RateLimiter:
    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)
    
    def check(self, key: str) -> bool:
        now = time.time()
        self.requests[key] = [t for t in self.requests[key] if now - t < self.window]
        if len(self.requests[key]) >= self.max_requests:
            return False
        self.requests[key].append(now)
        return True

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    if not rate_limiter.check(client_ip):
        return JSONResponse(status_code=429, content={"error": "Rate limit exceeded"})
    return await call_next(request)
```

---

## 3. Codex 任务指令

### Batch 1（P0，先做）

```
Task 1: Per-user CAW wallet registration
- Add user_wallets table (SQLite)
- POST /api/wallet/register: call CAW SDK to create wallet, return pairing info
- GET /api/wallet/status: query user binding status + pact status  
- POST /api/wallet/pact: submit PactSpec
- Refactor /api/execute: route to user's own CAW via user_address
- Frontend: connect wallet → check binding → show registration flow if unbound
- Reference: agent/execution.py for existing CawExecutor pattern

Task 2: User risk configuration (Settings page)
- Add user_configs table (SQLite)
- GET /api/config + PUT /api/config + POST /api/config/reset
- Refactor RiskPipeline rules to read thresholds from config, not hardcoded
- Frontend: /settings page with editable risk parameters
- Reference: agent/risk/rules.py for current hardcoded thresholds
```

### Batch 2（P1）

```
Task 3: CAW fallback strategy
- FallbackExecutor: CAW → SmartAccount → pending queue
- Log fallback reason in audit
- Frontend: show which backend was used

Task 4: Audit log SQLite persistence  
- Migrate AuditLogger from JSON files to SQLite
- Support filtering by user/status with pagination
- Reference: agent/audit.py for current JSON implementation
```

### Batch 3（P2-P3）

```
Task 5: Prompt injection protection
- Input sanitizer: length limit, control char filter, pattern detection
- Output validator: strict schema check on LLM JSON output
- Anomaly detector: compare proposal vs original intent

Task 6: API authentication (JWT)
- MetaMask signature login
- JWT middleware on /api/execute, /api/config, /api/wallet/*

Task 7: Rate limiting
- 30 requests/minute per IP
- FastAPI middleware
```

---

## 4. 不在范围内

以下功能明确不在本次迭代范围：

- ❌ 多链支持（只做 Sepolia）
- ❌ 通知系统（Telegram bot / 邮件）
- ❌ x402 支付协议集成
- ❌ 多 Agent 独立 CAW 钱包（每个 Agent 一个钱包）
- ❌ DAO 治理 / 多签审批
- ❌ 生产级部署（Docker / K8s / CI/CD）

---

## 5. 验收标准

每个任务完成后需要满足：

1. **现有测试不回归**：`PYTHONPATH=agent python3 -m unittest discover -s agent -p 'test_*.py'` 全部通过
2. **新功能有测试**：每个新增 API 端点至少 2 个测试（成功 + 失败）
3. **前端不报错**：`yarn check-types && yarn lint && yarn build` 全部通过
4. **Demo 路径不破坏**：4 条 demo 路径（safe / retry / reject / confirm）仍然可用
5. **文档更新**：新 API 端点更新到本文件

---

## 6. 架构参考

```text
用户 (MetaMask)
  │
  ▼
Sentinel Frontend (Next.js)
  │
  ▼
Sentinel Backend (FastAPI)
  ├── /api/auth/*          → JWT 认证
  ├── /api/wallet/*        → CAW 钱包管理
  ├── /api/config/*        → 风控配置
  ├── /api/execute         → 风控 + 执行
  ├── /api/confirm         → 确认流程
  └── /api/audit-log       → 审计查询
  │
  ├── RiskPipeline         → 从 config 读取阈值
  ├── Agent B/C (LLM)      → 输入清洗 + 输出验证
  ├── DecisionEngine       → 不变
  ├── AgenticLoop          → 不变
  ├── FallbackExecutor     → CAW → SmartAccount → pending
  └── AuditLogger          → SQLite
  │
  ▼
Cobo Agentic Wallet (per-user)
  ├── 用户 A 的钱包 + Pact
  ├── 用户 B 的钱包 + Pact
  └── 用户 C 的钱包 + Pact
```

---

> **Last updated**: 2026-06-06
> **Author**: MrtWallace
> **Status**: 待开发

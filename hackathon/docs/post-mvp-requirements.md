# Sentinel — Post-MVP 需求文档

> **目的**：记录从黑客松 MVP 到真实产品需要补齐的架构和功能。
> **当前状态**：MVP 已完成（后端 CP1-7.6，前端 CP0-7），demo-ready。
> **适用对象**：Codex / Claude Code 接手开发时的任务输入。
> **API Contract**：前后端接口字段以 `shared-api-contract.md` 为准，本文件只记录需求和优先级。

---

## 1. 背景

当前 MVP 使用共享 CAW 钱包、硬编码阈值、本地 JSON 审计日志。这些在 demo 中足够，但离"真实产品"有以下关键差距：

| 维度 | MVP 现状 | 真实产品要求 |
|------|----------|-------------|
| 钱包 | 所有用户共享一个 CAW | 每个用户独立 CAW 钱包 |
| 风控配置 | 硬编码阈值 | 用户可自定义风险偏好 |
| 执行容灾 | CAW 不可用直接报错 | CAW timeout/API 错误可 pending/fallback；CAW policy deny 必须拒绝 |
| 审计存储 | 本地 JSON 文件 | SQLite/PostgreSQL，支持查询和分页 |
| 安全防护 | LLM 输入输出无校验 | 输入清洗 + 输出 schema 验证 |
| API 安全 | 无认证无限制 | JWT 认证 + Rate Limiting |

---

## 2. 需求清单

### 2.1 Per-User CAW 钱包生命周期

**优先级**：P0 — 架构基础，后续全依赖

**目标**：每个用户通过 MetaMask 连接后绑定自己的 CAW 钱包。已有 CAW 钱包走 connect/import；没有 CAW 钱包走 create/pairing。新创建的钱包是持久化用户钱包，不是一次性临时 demo 钱包。Sentinel 风控层只做判断，执行时路由到用户自己的 CAW。

**数据模型**：

```python
@dataclass
class UserWallet:
    user_address: str          # MetaMask 地址（主键）
    caw_wallet_id: str         # CAW 钱包 ID
    caw_wallet_address: str    # CAW 钱包地址
    caw_api_key: str           # CAW API Key（加密存储）
    pact_id: str | None        # 当前活跃 Pact ID
    pairing_status: Literal["none", "pending", "paired", "failed"]
    pact_status: Literal["none", "pending_approval", "active", "expired", "revoked"]
    created_at: str
    updated_at: str
```

**API 端点**：

```
POST /api/wallet/connect-existing
  请求：{ "user_address": "0x...", "caw_wallet_id": "..." }
  行为：绑定已有 CAW 钱包，返回 pairing / pact 状态

POST /api/wallet/create
  请求：{ "user_address": "0x..." }
  行为：调用 CAW SDK 创建持久化钱包，返回 pairing 信息
  响应：{ "wallet_id": "...", "pairing_url": "...", "status": "pairing_pending" }

GET /api/wallet/status?user_address=0x...
  响应：{ "wallet_id": "...", "pact_status": "active", "pact_limits": {...} }

POST /api/wallet/pact
  请求：{ "user_address": "0x...", "limits": { "max_amount_eth": "0.1", ... } }
  行为：提交 PactSpec 到 CAW，等待用户在 App 审批
  响应：{ "pact_id": "...", "status": "pending_approval" }

POST /api/wallet/refresh-status
  请求：{ "user_address": "0x..." }
  行为：从 CAW 拉取最新 pairing / pact 状态
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
- 未绑定时：显示 "Connect existing CAW" 和 "Create CAW wallet" 两个入口
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

**目标**：CAW timeout / API 错误时自动进入 pending 或可控 fallback，不直接报错。CAW policy deny 是资金安全边界，必须拒绝，不能 fallback 到 SmartAccount 执行。

**降级链**：

```
CAW (primary)
  → 超时 / API 错误
SmartAccount.sol (fallback)
  → 不可用 / 网络错误
Pending Queue (last resort)
  → 入队等待，CAW 恢复后自动重试

CAW policy deny
  → reject，不 fallback
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
- POST /api/wallet/connect-existing: bind an existing CAW wallet
- POST /api/wallet/create: call CAW SDK to create a persistent wallet, return pairing info
- GET /api/wallet/status: query user binding status + pact status  
- POST /api/wallet/pact: submit PactSpec
- POST /api/wallet/refresh-status: refresh pairing/pact status from CAW
- Refactor /api/execute: route to user's own CAW via user_address
- Frontend: connect wallet → check binding → show connect-existing/create-wallet flow if unbound
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
- FallbackExecutor: CAW timeout/API error → SmartAccount or pending queue
- CAW policy_denied must reject and must not fallback
- Log fallback reason in audit
- Frontend: show which backend was used

Task 4: Audit log SQLite persistence  
- Migrate AuditLogger from JSON files to SQLite
- Support filtering by user/status with pagination
- Reference: agent/audit.py for current JSON implementation
```

### Batch 3（P1 — Agent 系统增强）

```
Task 5: Agent tool calling framework
- agent/tools.py: AgentTool dataclass + tool registry
- agent/tools_chain.py: check_contract_verified, check_address_history, get_token_price, estimate_swap_output, check_gas_price
- agent/llm.py: add complete_with_tools() method (OpenAI function calling)
- agent/reviewers.py: refactor LLMSecurityAuditor/LLMRiskAnalyst to use tools
- Tests for each tool (mock API responses) + tool-calling integration test
- Reference: agent/llm.py for existing LLMClient, agent/reviewers.py for existing reviewers

Task 6: Agent memory system
- agent/memory.py: AgentMemory class with SQLite storage
- record(): save each transaction decision
- get_patterns(): analyze user history (avg amount, typical contracts, rejection rate)
- detect_anomaly(): compare current proposal against user patterns
- Integrate into reviewers: inject memory context into LLM prompt
- Tests for pattern detection and anomaly detection

Task 7: MCP tool interface
- agent/mcp_server.py: standalone MCP server wrapping Sentinel capabilities
- Tools: evaluate_transaction, get_risk_config, update_risk_config, get_audit_log
- Uses existing AgenticLoop, AuditLogger, RiskPipeline
- Independent process, no changes to existing backend
- Test: MCP client can call tools and get valid responses
```

### Batch 4（P2 — 高级 Agent）

```
Task 8: Agent planner (task decomposition)
- agent/planner.py: AgentPlanner class
- Decompose multi-step intents into ExecutionPlan with ordered ExecutionSteps
- AgenticLoop.run() accepts ExecutionPlan, processes steps sequentially
- Stop on first reject, return merged results
- Tests: single-step passthrough, multi-step decomposition, stop-on-reject

Task 9: Agent reflection
- agent/reflection.py: AgentReflector class
- After execution, compare Agent prediction vs actual outcome
- Write reflection results to AgentMemory
- Demo: show Agent self-critique after transaction completes
```

### Batch 5（P2-P3 — 基础设施）

```
Task 10: Prompt injection protection
- Input sanitizer: length limit, control char filter, pattern detection
- Output validator: strict schema check on LLM JSON output
- Anomaly detector: compare proposal vs original intent

Task 11: API authentication (JWT)
- MetaMask signature login
- JWT middleware on /api/execute, /api/config, /api/wallet/*

Task 12: Rate limiting
- 30 requests/minute per IP
- FastAPI middleware
```

---

## 3.5 Agent 系统增强

### 3.8 MCP Tool 接口

**优先级**：P1 — 生态互操作性

**目标**：将 Sentinel 风控能力暴露为 MCP (Model Context Protocol) Tool，让其他 AI Agent 可以调用 Sentinel 评估交易风险。

**暴露的 Tools**：

```python
# sentinel_mcp_server.py

@mcp_tool("evaluate_transaction")
def evaluate_transaction(intent: str) -> dict:
    """评估一笔 DeFi 交易的风险。返回决策和推理过程。"""
    proposal = parse_tx_proposal(intent)
    result = agentic_loop.run(proposal)
    return {
        "decision": result.final_decision.decision,
        "reason": result.final_decision.reason,
        "attempts": len(result.attempts),
        "risk_summary": _summarize_risks(result)
    }

@mcp_tool("get_risk_config")
def get_risk_config(user_address: str) -> dict:
    """读取用户的风控配置。"""
    return db.get_user_config(user_address)

@mcp_tool("update_risk_config")
def update_risk_config(user_address: str, config: dict) -> dict:
    """更新用户的风控配置。"""
    return db.update_user_config(user_address, config)

@mcp_tool("get_audit_log")
def get_audit_log(tx_id: str) -> dict:
    """查询审计记录。"""
    return db.get_audit(tx_id)
```

**实现要点**：
- 使用 `mcp` Python SDK
- 独立进程运行，通过 stdio 或 HTTP 与 MCP client 通信
- 复用现有 `AgenticLoop`、`AuditLogger`、`RiskPipeline`
- 不需要改动现有后端代码，是独立的 MCP server 包装层

**Demo 效果**：
```
其他 Agent: "我要 swap 0.5 ETH，先问问 Sentinel"
  → 调用 MCP tool: evaluate_transaction("swap 0.5 ETH to USDC")
  → Sentinel 返回: { decision: "reject", reason: "AmountRule: 超过 0.2 ETH 上限" }
  → 其他 Agent: "Sentinel 说不行，我降金额到 0.1 ETH 再试"
```

**工时**：1 天

---

### 3.9 Agent 工具调用

**优先级**：P1 — Agent 从"猜"变成"查"

**目标**：Agent B/C 可以调用链上查询工具收集证据，基于真实数据做判断。

**工具列表**：

| 工具 | 功能 | 数据源 | Agent |
|---|---|---|---|
| `check_contract_verified` | 合约是否在 Etherscan 验证 | Etherscan API | B |
| `check_address_history` | 地址交易历史和标记 | Etherscan API | B |
| `get_token_price` | token 当前价格 | CoinGecko / Chainlink | C |
| `estimate_swap_output` | swap 预期输出量 | Uniswap Quote API | C |
| `check_gas_price` | 当前 gas 价格 | RPC call | C |

**工具框架**：

```python
# agent/tools.py
@dataclass
class AgentTool:
    name: str
    description: str
    parameters: dict  # JSON Schema
    func: Callable

# agent/tools_chain.py — 链上查询工具
def check_contract_verified(address: str) -> dict:
    """查询合约是否在 Etherscan 验证了源码。"""
    resp = requests.get(ETHERSCAN_API, params={
        "module": "contract", "action": "getabi", "address": address
    })
    return {"verified": resp.status_code == 200, "address": address}

def get_token_price(token_symbol: str) -> dict:
    """查询 token 当前 USD 价格。"""
    resp = requests.get(f"https://api.coingecko.com/api/v3/simple/price", params={
        "ids": TOKEN_MAP.get(token_symbol, token_symbol), "vs_currencies": "usd"
    })
    return {"token": token_symbol, "price_usd": resp.json()}

def estimate_swap_output(amount_eth: float, to_token: str) -> dict:
    """估算 Uniswap swap 输出量。"""
    # Uniswap Quote API 或链上 quoter 合约调用
    ...
```

**LLM Tool Calling 集成**：

```python
# agent/llm.py 增加
class OpenAICompatibleLLMClient:
    def complete_with_tools(self, messages, tools: list[AgentTool]) -> dict:
        tool_schemas = [{
            "type": "function",
            "function": {"name": t.name, "description": t.description, "parameters": t.parameters}
        } for t in tools]
        
        response = self.client.chat.completions.create(
            model=self.model, messages=messages, tools=tool_schemas, tool_choice="auto"
        )
        
        message = response.choices[0].message
        if message.tool_calls:
            results = []
            for call in message.tool_calls:
                tool = next(t for t in tools if t.name == call.function.name)
                result = tool.func(**json.loads(call.function.arguments))
                results.append({"tool": call.function.name, "result": result})
            # 把工具结果喂回 LLM 做最终判断
            messages.append({"role": "assistant", "tool_calls": message.tool_calls})
            for tc_result in results:
                messages.append({"role": "tool", "content": json.dumps(tc_result["result"])})
            final = self.client.chat.completions.create(model=self.model, messages=messages)
            return {"tool_calls": results, "final_content": final.choices[0].message.content}
        
        return {"tool_calls": [], "final_content": message.content}
```

**Reviewer 改造**：

```python
# agent/reviewers.py 改造
class LLMSecurityAuditor:
    TOOLS = [check_contract_verified, check_address_history]
    
    def review(self, intent, proposal):
        messages = [
            {"role": "system", "content": SECURITY_AUDITOR_PROMPT},
            {"role": "user", "content": f"Intent: {intent}\nProposal: {proposal}"}
        ]
        result = self.llm.complete_with_tools(messages, self.TOOLS)
        return self._parse_result(result["final_content"])

class LLMRiskAnalyst:
    TOOLS = [get_token_price, estimate_swap_output, check_gas_price]
    
    def review(self, intent, proposal):
        # 同上模式
        ...
```

**工时**：3 天（工具框架 1 天 + 5 个工具实现 1 天 + Reviewer 改造 1 天）

---

### 3.10 Agent 记忆系统

**优先级**：P1 — Agent 从历史中学习

**目标**：Agent 记住每个用户的交易历史和行为模式，检测异常交易。

**数据模型**：

```python
# agent/memory.py
class AgentMemory:
    """Per-user transaction memory with pattern detection."""
    
    def __init__(self, db_path: str = "memory.db"):
        self.db = sqlite3.connect(db_path)
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS transaction_memory (
                id INTEGER PRIMARY KEY,
                user_address TEXT NOT NULL,
                action TEXT NOT NULL,
                amount TEXT NOT NULL,
                token TEXT,
                target_contract TEXT,
                decision TEXT NOT NULL,
                risk_level TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
    
    def record(self, user_address: str, proposal: TxProposal, decision: DecisionResult):
        """记录交易决策到记忆。"""
        self.db.execute(
            "INSERT INTO transaction_memory (user_address, action, amount, token, target_contract, decision, risk_level) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_address, proposal.action, proposal.amount, proposal.to_token, proposal.to_contract, decision.decision, ...)
        )
        self.db.commit()
    
    def get_patterns(self, user_address: str) -> dict:
        """分析用户历史交易模式。"""
        rows = self.db.execute(
            "SELECT action, amount, token, target_contract FROM transaction_memory WHERE user_address = ? ORDER BY timestamp DESC LIMIT 50",
            (user_address,)
        ).fetchall()
        return {
            "avg_amount": sum(float(r[1]) for r in rows) / len(rows) if rows else 0,
            "typical_contracts": list(set(r[3] for r in rows if r[3])),
            "typical_tokens": list(set(r[2] for r in rows if r[2])),
            "total_transactions": len(rows),
            "rejection_rate": sum(1 for r in rows if r[4] == "reject") / len(rows) if rows else 0
        }
    
    def detect_anomaly(self, user_address: str, proposal: TxProposal) -> list[str]:
        """检测当前交易是否偏离用户历史模式。"""
        patterns = self.get_patterns(user_address)
        anomalies = []
        if patterns["total_transactions"] >= 3:
            if float(proposal.amount) > patterns["avg_amount"] * 3:
                anomalies.append(f"金额 ({proposal.amount}) 是历史平均 ({patterns['avg_amount']:.4f}) 的 {float(proposal.amount)/patterns['avg_amount']:.1f} 倍")
            if proposal.to_contract and proposal.to_contract not in patterns["typical_contracts"]:
                anomalies.append(f"目标合约 {proposal.to_contract[:10]}... 不在用户常用列表")
        return anomalies
```

**Agent 使用记忆**：

```python
class LLMSecurityAuditor:
    def review(self, intent, proposal, user_address):
        memory = AgentMemory()
        patterns = memory.get_patterns(user_address)
        anomalies = memory.detect_anomaly(user_address, proposal)
        
        context = f"用户历史模式：{json.dumps(patterns, ensure_ascii=False)}\n"
        if anomalies:
            context += f"⚠️ 异常检测：{'、'.join(anomalies)}\n"
        
        messages = [
            {"role": "system", "content": SECURITY_AUDITOR_PROMPT},
            {"role": "user", "content": f"{context}\n当前交易：{proposal}"}
        ]
        # ... LLM 调用
```

**Demo 效果**：
```
用户历史：10 笔交易，平均 0.02 ETH，常用 Uniswap
当前交易：swap 0.5 ETH → Agent B: "金额是历史平均 25 倍，建议确认"
```

**工时**：2 天（记忆框架 1 天 + 异常检测 1 天）

---

### 3.11 Agent 规划系统（任务分解）

**优先级**：P2 — 复杂任务处理

**目标**：将包含多步操作的复杂 intent 分解为独立的执行步骤。

**数据模型**：

```python
# agent/planner.py
@dataclass
class ExecutionStep:
    step_index: int
    proposal: TxProposal
    depends_on: list[int]  # 前置步骤索引

@dataclass
class ExecutionPlan:
    steps: list[ExecutionStep]
    reasoning: str
    is_multi_step: bool
```

**实现**：

```python
class AgentPlanner:
    """将复杂 intent 分解为可执行步骤。"""
    
    PLANNER_PROMPT = """你是一个交易规划器。分析用户的意图，判断是单步还是多步操作。
    
    多步操作的典型模式：
    - "swap A to B then transfer to address" → 两步
    - "approve and swap" → 两步
    - "bridge and swap" → 两步
    
    输出 JSON:
    {
        "is_multi_step": true/false,
        "steps": [
            {"step_index": 0, "action": "swap", "amount": "0.1", ...},
            {"step_index": 1, "action": "transfer", "depends_on": [0], ...}
        ],
        "reasoning": "..."
    }
    """
    
    def plan(self, intent: str) -> ExecutionPlan:
        result = self.llm.complete_json([
            {"role": "system", "content": self.PLANNER_PROMPT},
            {"role": "user", "content": intent}
        ])
        return self._parse_plan(result)
```

**AgenticLoop 集成**：

```python
class AgenticLoop:
    def run(self, tx_or_plan):
        if isinstance(tx_or_plan, ExecutionPlan):
            results = []
            for step in tx_or_plan.steps:
                step_result = self._run_single(step.proposal)
                results.append(step_result)
                if step_result.final_decision.decision == "reject":
                    break  # 某步被拒，停止后续步骤
            return self._merge_plan_results(results)
        else:
            return self._run_single(tx_or_plan)
```

**Demo 效果**：
```
用户: "Swap 0.1 ETH to USDC then send to 0x742d..."

Execution Plan (2 steps):
  Step 1: swap 0.1 ETH → USDC
  Step 2: transfer USDC → 0x742d... (depends on Step 1)

  Step 1 → Agent B PASS, Agent C PASS → EXECUTE ✓
  Step 2 → Agent B: "大额 transfer 需确认" → CONFIRM ⚠️
```

**工时**：2 天（Planner 1 天 + AgenticLoop 改造 1 天）

---

### 3.12 Agent 反思系统

**优先级**：P2 — 自我改进

**目标**：交易执行后，Agent 回顾自己的判断是否准确，记录学习。

**实现**：

```python
# agent/reflection.py
class AgentReflector:
    """交易执行后，Agent 反思自己的判断。"""
    
    REFLECTION_PROMPT = """你之前对一笔交易做了风险评估。
    
    你的判断：passed={passed}, risk_level={risk_level}
    你的理由：{reasoning}
    
    实际结果：status={outcome_status}, gas_used={gas}, reverted={reverted}
    
    反思：
    1. 你的判断准确吗？
    2. 有什么信息是你当时没考虑到的？
    3. 下次类似交易你会怎么调整？
    
    输出 JSON: {{"was_correct": true/false, "confidence": 0-1, "lessons": "...", "would_adjust": "..."}}
    """
    
    def reflect(self, agent_result: AgentResult, outcome: dict) -> dict:
        prompt = self.REFLECTION_PROMPT.format(
            passed=agent_result.passed,
            risk_level=agent_result.risk_level,
            reasoning=agent_result.reasoning,
            outcome_status=outcome.get("status"),
            gas=outcome.get("gas_used"),
            reverted=outcome.get("reverted", False)
        )
        return self.llm.complete_json([{"role": "user", "content": prompt}])
```

**记忆集成**：反思结果写入 `AgentMemory`，影响后续判断。

**Demo 效果**：
```
交易执行后 Agent B 自动反思：
  "我判断为 medium risk，因为金额略高于用户平均。
   实际交易成功，gas 正常。
   教训：对于该用户，0.05-0.1 ETH 范围应视为 low risk。
   下次调整：类似金额降为 low risk。"
```

**工时**：1-2 天

---

## 4. 不在范围内

以下功能明确不在本次迭代范围：

- ❌ 多链支持（只做 Sepolia）
- ❌ 通知系统（Telegram bot / 邮件）
- ❌ x402 支付协议集成（口头叙事，不写代码）
- ❌ 多 Agent 独立 CAW 钱包（每个 Agent 一个钱包）
- ❌ DAO 治理 / 多签审批
- ❌ 生产级部署（Docker / K8s / CI/CD）
- ❌ Agent 声誉系统（仅 2 个 Agent B/C，加权投票无实际意义）

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
  ├── AgentPlanner         → 多步意图分解
  ├── AgentMemory          → 用户历史模式 + 异常检测
  ├── RiskPipeline         → 从 config 读取动态阈值
  ├── Agent B (Security)   → 工具调用（合约验证、地址历史）+ LLM 推理
  ├── Agent C (Risk)       → 工具调用（价格、滑点、gas）+ LLM 推理
  ├── DecisionEngine       → 执行/确认/拒绝
  ├── AgenticLoop          → bounded retry + MutationGuard
  ├── AgentReflector       → 执行后反思 + 记忆更新
  ├── FallbackExecutor     → CAW → SmartAccount → pending
  └── AuditLogger          → SQLite
  │
  ▼
MCP Server (独立进程)
  └── evaluate_transaction / get_risk_config / get_audit_log
      → 外部 Agent 可调用 Sentinel 风控能力
  │
  ▼
Cobo Agentic Wallet (per-user)
  ├── 用户 A 的钱包 + Pact
  ├── 用户 B 的钱包 + Pact
  └── 用户 C 的钱包 + Pact
```

---

> **Last updated**: 2026-06-06 (v2 — added Agent system: MCP, tool calling, memory, planner, reflection)
> **Author**: MrtWallace
> **Status**: 待开发

from dataclasses import dataclass, field
from typing import Optional, Literal


@dataclass
class Suggestion:
    field: str
    suggested_value: str | float | int
    reason: str
    rejection_code: Optional[str] = None

@dataclass
class ToolCallEvidence:
    agent: str
    tool: str
    status: Literal["succeeded", "failed", "skipped"]
    result: dict
    reason: Optional[str] = None

@dataclass
class MemoryAnomaly:
    kind: str
    severity: Literal["info", "warning", "critical"]
    reason: str

@dataclass
class TxProposal:
    action: Literal["swap", "transfer", "approve", "deposit", "withdraw", "unknown"]
    amount: str
    from_token: Optional[str] = None
    to_token: Optional[str] = None
    to_contract: Optional[str] = None
    slippage: Optional[float] = None
    expected_output: Optional[str] = None
    deadline: Optional[int] = None
    reasoning: Optional[str] = None
    recipient: Optional[str] = None
    calldata: Optional[str] = None
    value: Optional[str] = None

@dataclass
class RuleResult:
    rule_name: str
    status: Literal["passed", "rejected", "confirm", "skipped"]
    reason: str
    severity: Literal["info", "warning", "critical"] = "info"

@dataclass
class AgentResult:
    agent_name: str
    passed: bool
    risk_level: Literal["low", "medium", "high"]
    findings: list[str]
    reasoning: str
    suggestions: list[Suggestion] = field(default_factory=list)
    tool_calls: list[ToolCallEvidence] = field(default_factory=list)

@dataclass
class DecisionResult:
    decision: Literal["execute", "confirm", "reject"]
    reason: str
    suggestions: list[Suggestion] = field(default_factory=list)

@dataclass
class SimulationResult:
    success: bool
    gas_estimate: Optional[int] = None
    error: Optional[str] = None

@dataclass
class AuditRecord:
    tx_id: str
    timestamp: str
    user_intent: str
    tx_proposal: TxProposal
    hard_rules: list[RuleResult]
    security_audit: Optional[AgentResult] = None
    risk_analysis: Optional[AgentResult] = None
    decision: Optional[DecisionResult] = None
    simulation: Optional[SimulationResult] = None
    tx_hash: Optional[str] = None

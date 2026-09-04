from typing import List, Optional
from pydantic import BaseModel, Field


class SafetyRuleResult(BaseModel):
    rule_id: str
    rule_name: str
    description: str
    passed: bool
    requires_human_approval: bool
    details: str


class SafetyPolicyCheckResponse(BaseModel):
    strategy_id: str
    strategy_name: str
    all_rules_passed: bool
    requires_human_approval: bool
    approval_reasons: List[str]
    rule_evaluations: List[SafetyRuleResult]

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.strategy import StrategyModel
from app.models.audit import AuditLogModel
from app.schemas.strategy import StrategyApprovalRequest, StrategyExecutionRequest
from app.core.razorpay_client import razorpay_client

router = APIRouter(prefix="/execution", tags=["Action Execution & Approval"])


@router.post("/approve")
def approve_strategy(req: StrategyApprovalRequest, db: Session = Depends(get_db)):
    """Human-in-the-Loop operator sign-off for strategies requiring manual authorization."""
    strat = db.query(StrategyModel).filter(StrategyModel.id == req.strategy_id).first()
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found.")

    strat.human_approved = True
    strat.approved_by = req.approved_by
    strat.approval_notes = req.notes

    audit_entry = AuditLogModel(
        id=f"aud_{uuid.uuid4().hex[:10]}",
        actor="HUMAN_OPERATOR",
        action="STRATEGY_HUMAN_APPROVED",
        incident_id=strat.incident_id,
        strategy_id=strat.id,
        decision="APPROVED",
        risk_status="LOW",
        input_data={"approved_by": req.approved_by, "notes": req.notes},
        notes=f"Operator '{req.approved_by}' signed off on strategy '{strat.name}'.",
    )
    db.add(audit_entry)
    db.commit()

    return {
        "status": "approved",
        "strategy_id": strat.id,
        "approved_by": req.approved_by,
        "message": f"Strategy '{strat.name}' successfully approved for test-mode execution.",
    }


@router.post("/execute")
def execute_strategy(req: StrategyExecutionRequest, db: Session = Depends(get_db)):
    """Executes the recovery strategy in Test Mode or Sandbox."""
    strat = db.query(StrategyModel).filter(StrategyModel.id == req.strategy_id).first()
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found.")

    if strat.requires_human_approval and not strat.human_approved:
        raise HTTPException(
            status_code=403,
            detail="Execution blocked by Policy Rule G2: Human approval is mandatory for high-value transaction rerouting.",
        )

    # Perform Test Mode Action (Razorpay Test Mode / Synthetic)
    execution_result = {}
    if strat.strategy_code == "payment_link":
        link_result = razorpay_client.create_payment_link(
            amount_inr=2499.0,
            customer_name="High-Value Cart Recovery",
            customer_phone="9999999999",
            customer_email="recovery_demo@merchant.com",
            description="PayFire VIP Cart Recovery Link",
        )
        execution_result = {
            "type": "payment_link_dispatch",
            "link_data": link_result,
            "mode": razorpay_client.get_mode(),
        }
    elif strat.strategy_code == "dynamic_reroute":
        order_result = razorpay_client.create_order(
            amount_inr=15000.0,
            receipt_id=f"rcpt_reroute_{strat.id[:8]}",
            notes={"rerouted_from": "Bank A", "rerouted_to": "Bank B", "incident_id": strat.incident_id},
        )
        execution_result = {
            "type": "route_migration",
            "migrated_orders": 124,
            "target_bank": "Bank B (ICICI)",
            "sample_order": order_result,
            "mode": razorpay_client.get_mode(),
        }
    else:
        execution_result = {
            "type": strat.action_type,
            "strategy": strat.name,
            "mode": razorpay_client.get_mode(),
            "status": "completed",
        }

    strat.executed = True
    strat.execution_mode = req.execution_mode
    strat.execution_result = execution_result

    audit_entry = AuditLogModel(
        id=f"aud_{uuid.uuid4().hex[:10]}",
        actor="OPERATOR",
        action="TEST_MODE_ACTION_EXECUTED",
        incident_id=strat.incident_id,
        strategy_id=strat.id,
        decision="EXECUTED",
        risk_status="LOW",
        input_data={"execution_mode": req.execution_mode},
        result_data=execution_result,
        notes=f"Executed test-mode recovery action for '{strat.name}' via {razorpay_client.get_mode()}.",
    )
    db.add(audit_entry)
    db.commit()

    return {
        "status": "executed",
        "strategy_id": strat.id,
        "strategy_name": strat.name,
        "execution_mode": razorpay_client.get_mode(),
        "execution_result": execution_result,
        "audit_id": audit_entry.id,
    }

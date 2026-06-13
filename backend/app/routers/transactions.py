import csv
import os
from datetime import date as date_type
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..models.transaction import Transaction
from ..schemas import TransactionResponse, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["transactions"])

SAMPLE_CSV = os.path.join(
    os.path.dirname(__file__), "..", "..", "data", "sample_transactions.csv"
)

@router.post("/seed-demo", summary="Load sample data for demo user")
def seed_demo(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Loads the Phase 0 CSV into the database for the logged-in user.
    Safe to call multiple times — clears existing transactions first.
    """
    if not os.path.exists(SAMPLE_CSV):
        raise HTTPException(status_code=404, detail="Sample CSV not found. Run scripts/generate_sample_data.py first.")

    db.query(Transaction).filter(Transaction.user_id == current_user.id).delete()

    loaded = 0
    with open(SAMPLE_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            db.add(Transaction(
                user_id     = current_user.id,
                date        = date_type.fromisoformat(row["date"]),
                description = row["description"],
                amount      = float(row["amount"]),
                type        = row["type"],
                source      = row.get("source") or None,
                account     = row.get("account") or None,
                category    = row.get("category") or None,
                merchant    = row.get("merchant") or None,
            ))
            loaded += 1

    db.commit()
    return {"message": f"Loaded {loaded} transactions for user '{current_user.name}'"}

@router.get("", response_model=list[TransactionResponse])
def list_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=2000),
    category: Optional[str] = None,
    type: Optional[str] = None,
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if category:
        q = q.filter(Transaction.category == category)
    if type:
        q = q.filter(Transaction.type == type)
    if month:
        q = q.filter(Transaction.date.between(
            date_type(year or 2025, month, 1),
            date_type(year or 2025, month, 28 if month == 2 else 30 if month in (4,6,9,11) else 31)
        ))
    return q.order_by(Transaction.date.desc()).offset(skip).limit(limit).all()

@router.get("/summary")
def get_summary(
    year: int = Query(2025),
    month: Optional[int] = Query(None, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns income, expenses, savings, and category totals for a month or full year."""
    from sqlalchemy import func, extract
    q = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        extract("year", Transaction.date) == year,
    )
    if month:
        q = q.filter(extract("month", Transaction.date) == month)

    txns = q.all()
    EXCLUDED_FROM_EXPENSES = {"Transfers", "Investments", "EMI", "Cash Withdrawal", "Taxes"}
    income   = sum(t.amount for t in txns if t.type == "credit" and t.category not in ("Transfers",))
    expenses = sum(t.amount for t in txns if t.type == "debit"  and t.category not in EXCLUDED_FROM_EXPENSES)
    emi      = sum(t.amount for t in txns if t.category == "EMI")
    invest   = sum(t.amount for t in txns if t.category == "Investments")

    by_cat: dict[str, float] = {}
    for t in txns:
        if t.type == "debit" and t.category not in ("Transfers",):
            by_cat[t.category or "Miscellaneous"] = round(by_cat.get(t.category or "Miscellaneous", 0) + t.amount, 2)

    return {
        "year": year, "month": month,
        "income": round(income, 2),
        "expenses": round(expenses, 2),
        "emi": round(emi, 2),
        "investments": round(invest, 2),
        "savings": round(income - expenses - emi - invest, 2),
        "savings_ratio": round((income - expenses - emi - invest) / income * 100, 1) if income else 0,
        "by_category": by_cat,
        "transaction_count": len(txns),
    }

@router.patch("/{txn_id}", response_model=TransactionResponse)
def update_transaction(
    txn_id: int,
    body: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txn = db.query(Transaction).filter(
        Transaction.id == txn_id, Transaction.user_id == current_user.id
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(txn, field, value)
    db.commit()
    db.refresh(txn)
    return txn

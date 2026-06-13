from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import extract
from ..core.database import get_db
from ..core.deps import get_current_user
from ..core.config import settings
from ..models.user import User
from ..models.transaction import Transaction

router = APIRouter(prefix="/advisor", tags=["advisor"])

def _rule_based_summary(stats: dict) -> str:
    lines = ["## Your Financial Summary (6-Month Analysis)\n"]
    lines.append(f"**Average Monthly Income:** ₹{stats['avg_income']:,.0f}")
    lines.append(f"**Average Monthly Expenses:** ₹{stats['avg_expenses']:,.0f}")
    lines.append(f"**Average Monthly Savings:** ₹{stats['avg_savings']:,.0f} ({stats['savings_pct']:.1f}% of income)\n")

    lines.append("### Key Observations")
    if stats['savings_pct'] < 10:
        lines.append("⚠️ **Low Savings:** Your savings rate is below 10%. Aim for at least 20% to build financial security.")
    elif stats['savings_pct'] < 20:
        lines.append("📈 **Moderate Savings:** You're saving, but below the recommended 20%. Small cuts in discretionary spend can help.")
    else:
        lines.append("✅ **Good Savings Rate:** You're saving over 20% — keep it up!")

    if stats['food_pct'] > 15:
        lines.append(f"🍔 **Food Spending:** {stats['food_pct']:.1f}% of income goes to food & dining. Consider meal planning to reduce this.")

    if stats['emi_pct'] > 30:
        lines.append(f"🏦 **High EMI Burden:** EMIs consume {stats['emi_pct']:.1f}% of income. Try to avoid new loans until existing ones are cleared.")

    lines.append("\n### 3 Recommendations")
    lines.append(f"1. **Automate savings:** Set up a recurring transfer of ₹{max(5000, int(stats['avg_income']*0.05)):,} on salary day.")
    lines.append(f"2. **Increase SIP:** Add ₹1,000–₹2,000 to your monthly SIP. At 12% CAGR, ₹2,000/month becomes ₹{2000*12*((1.12**10-1)/0.12):,.0f} in 10 years.")
    lines.append(f"3. **Food delivery audit:** Review Swiggy/Zomato orders. Cooking 3 extra meals/week can save ₹1,500–₹2,500/month.")

    return "\n".join(lines)

@router.get("/summary")
async def get_advice(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    txns = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        extract("year", Transaction.date) == 2025,
    ).all()

    if not txns:
        return {"advice": "No transaction data found. Please load sample data or upload your transactions first."}

    income   = sum(t.amount for t in txns if t.type == "credit" and t.category not in ("Transfers",)) / 6
    expenses = sum(t.amount for t in txns if t.type == "debit"  and t.category not in ("Transfers","Investments","EMI")) / 6
    emi      = sum(t.amount for t in txns if t.category == "EMI") / 6
    invest   = sum(t.amount for t in txns if t.category == "Investments") / 6
    food     = sum(t.amount for t in txns if t.category == "Food & Dining") / 6
    savings  = income - expenses - emi - invest

    stats = {
        "avg_income":   income,
        "avg_expenses": expenses + emi,
        "avg_savings":  savings,
        "savings_pct":  (savings / income * 100) if income else 0,
        "food_pct":     (food / income * 100) if income else 0,
        "emi_pct":      (emi / income * 100) if income else 0,
    }

    if settings.OPENAI_API_KEY:
        import httpx
        prompt = (
            f"You are a friendly Indian financial advisor. Analyse this 6-month financial data:\n"
            f"Avg monthly income: ₹{income:,.0f}\n"
            f"Avg monthly expenses (ex-EMI): ₹{expenses:,.0f}\n"
            f"Avg EMI: ₹{emi:,.0f}\n"
            f"Avg investments/SIP: ₹{invest:,.0f}\n"
            f"Avg food & dining: ₹{food:,.0f}\n"
            f"Net savings: ₹{savings:,.0f}\n\n"
            f"Write a 150-word plain-English summary covering: spending trend, key risk, and 2-3 specific actionable recommendations. "
            f"Use Indian context (INR, SIPs, PPF, UPI). Be direct and friendly."
        )
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    f"{settings.OPENAI_BASE_URL}/chat/completions",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={"model": settings.OPENAI_MODEL,
                          "messages": [{"role": "user", "content": prompt}],
                          "max_tokens": 300},
                )
                advice = resp.json()["choices"][0]["message"]["content"].strip()
                return {"advice": advice, "source": "ai"}
        except Exception:
            pass  # fall through to rule-based

    return {"advice": _rule_based_summary(stats), "source": "rules"}

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

# ── Auth ──────────────────────────────────────────────────────────────────────
class UserSignup(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str

# ── Profile ───────────────────────────────────────────────────────────────────
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    monthly_income: Optional[float] = None
    city: Optional[str] = None
    financial_goal: Optional[str] = None

class ProfileResponse(BaseModel):
    id: int
    email: str
    name: str
    age: Optional[int]
    occupation: Optional[str]
    monthly_income: Optional[float]
    city: Optional[str]
    financial_goal: Optional[str]

    class Config:
        from_attributes = True

# ── Transaction ───────────────────────────────────────────────────────────────
class TransactionResponse(BaseModel):
    id: int
    date: date
    description: str
    amount: float
    type: str
    source: Optional[str]
    account: Optional[str]
    category: Optional[str]
    merchant: Optional[str]

    class Config:
        from_attributes = True

class TransactionUpdate(BaseModel):
    category: Optional[str] = None
    merchant: Optional[str] = None

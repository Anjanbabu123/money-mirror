from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    id             = Column(Integer, primary_key=True, index=True)
    email          = Column(String, unique=True, index=True, nullable=False)
    hashed_password= Column(String, nullable=False)
    name           = Column(String, nullable=False)
    age            = Column(Integer, nullable=True)
    occupation     = Column(String, nullable=True)
    monthly_income = Column(Float, nullable=True)
    city           = Column(String, nullable=True)
    financial_goal = Column(String, nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    transactions   = relationship("Transaction", back_populates="user")

from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date        = Column(Date, nullable=False, index=True)
    description = Column(String, nullable=False)
    amount      = Column(Float, nullable=False)
    type        = Column(String, nullable=False)       # debit | credit
    source      = Column(String, nullable=True)        # UPI | NEFT | Credit Card …
    account     = Column(String, nullable=True)
    category    = Column(String, nullable=True, index=True)
    merchant    = Column(String, nullable=True)

    user = relationship("User", back_populates="transactions")

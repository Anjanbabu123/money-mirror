from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import engine, Base
from .models import user, transaction   # ensure models are registered before create_all
from .routers import auth, users, transactions, upload, advisor

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MoneyMirror API",
    description="Personal Finance & Spending Analytics — Academic Demo",
    version="1.0.0",
)

import os as _os
_allowed_origins = _os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(transactions.router)
app.include_router(upload.router)
app.include_router(advisor.router)

@app.get("/")
def root():
    return {"message": "MoneyMirror API is running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..schemas import ProfileUpdate, ProfileResponse

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=ProfileResponse)
def update_profile(
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user

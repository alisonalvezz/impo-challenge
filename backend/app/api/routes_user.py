from fastapi import APIRouter, Depends, HTTPException
from models.user import UserMetadata
from services import user_service
from core.auth import verify_token

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
def list_users(user=Depends(verify_token)):
    return user_service.list_users()

@router.get("/me")
def get_current_user(user=Depends(verify_token)):
    user_data = user_service.get_user(user["uid"])
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return user_data

@router.post("/me")
def create_or_update_current_user(data: UserMetadata, user=Depends(verify_token)):
    user_service.create_or_update_user(user["uid"], data.dict())
    return {"status": "ok"}

@router.delete("/me")
def delete_current_user(user=Depends(verify_token)):
    user_service.delete_user(user["uid"])
    return {"status": "deleted"}

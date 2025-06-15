from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from firebase_admin import auth
from core.auth import verify_token, check_admin
from core.firebase import db
from services import user_service

router = APIRouter(prefix="/admin", tags=["admin"])

class NewUserRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str | None = None
    role: str = "user"

@router.get("/")
def list_users(user=Depends(verify_token)):
    check_admin(user)
    return user_service.list_users()

@router.post("/create-user")
def create_user(new_user: NewUserRequest, user=Depends(verify_token)):
    check_admin(user)

    try:
        user_record = auth.create_user(
            email=new_user.email,
            password=new_user.password,
            display_name=new_user.display_name,
        )

        db.collection("users").document(user_record.uid).set({
            "email": new_user.email,
            "name": new_user.display_name or "",
            "role": new_user.role,
        })

        auth.set_custom_user_claims(user_record.uid, {"role": new_user.role})

        return {"uid": user_record.uid, "email": user_record.email}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

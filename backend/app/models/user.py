from pydantic import BaseModel, EmailStr

class UserMetadata(BaseModel):
    name: str
    email: EmailStr
    role: str = "user"

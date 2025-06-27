from fastapi import Request, HTTPException
from firebase_admin import auth

async def verify_token(request: Request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No auth token")
    
    token = auth_header.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token  # contiene uid, email, claims, etc.
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def check_admin(user_token):
    if user_token.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only access")

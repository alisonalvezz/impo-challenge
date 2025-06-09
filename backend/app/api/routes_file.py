from fastapi import APIRouter, Depends, HTTPException
from models.file import FileMetadata
from core.auth import verify_token
from services import file_service

router = APIRouter(prefix="/files", tags=["files"])

@router.get("/")
async def list_files(user=Depends(verify_token)):
    return file_service.list_user_files(user["uid"])

@router.post("/")
def create_file(data: FileMetadata, user=Depends(verify_token)):
    file_id = file_service.create_user_file(user["uid"], data.dict())
    return {"id": file_id}



@router.delete("/{file_id}")
async def delete_file(file_id: str, user=Depends(verify_token)):
    success = file_service.delete_user_file(user["uid"], file_id)
    if not success:
        raise HTTPException(status_code=403, detail="Not allowed")
    return {"status": "deleted"}

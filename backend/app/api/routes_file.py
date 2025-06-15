from fastapi import APIRouter, Depends, HTTPException
from models.file import FileMetadata
from core.auth import verify_token
from services import file_service
from fastapi import UploadFile, File
import uuid
from google.cloud import storage

BUCKET_NAME = "impo-equipo1.firebasestorage.app" 

router = APIRouter(prefix="/files", tags=["files"])

@router.get("/")
async def list_files(user=Depends(verify_token)):
    return file_service.list_user_files(user["uid"])

@router.delete("/{file_id}")
async def delete_file(file_id: str, user=Depends(verify_token)):
    success = file_service.delete_user_file(user["uid"], file_id)
    if not success:
        raise HTTPException(status_code=403, detail="Not allowed")
    return {"status": "deleted"}

def upload_file_to_storage(file: UploadFile, user_id: str) -> str:
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)

    ext = file.filename.split(".")[-1]
    blob_name = f"{user_id}/{uuid.uuid4()}.{ext}"
    blob = bucket.blob(blob_name)
    blob.upload_from_file(file.file, content_type=file.content_type)
    blob.make_public()

    return blob.public_url

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user=Depends(verify_token)
):
    existing_files = file_service.list_user_files(user["uid"])
    if any(f["name"] == file.filename for f in existing_files):
        raise HTTPException(status_code=409, detail="Archivo ya fue subido.")

    public_url = upload_file_to_storage(file, user["uid"])
    
    file_data = {
        "name": file.filename,
        "description": "",
        "url": public_url
    }
    file_id = file_service.create_user_file(user["uid"], file_data)

    return {"id": file_id, "url": public_url}

from pydantic import BaseModel

class FileMetadata(BaseModel):
    name: str
    description: str

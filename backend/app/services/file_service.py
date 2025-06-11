from core.firebase import db

def list_user_files(user_id: str):
    docs = db.collection("files").where("owner", "==", user_id).stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

def create_user_file(user_id: str, data: dict):
    print("Creando archivo para:", user_id, data)
    doc_ref = db.collection("files").document()
    doc_ref.set({**data, "owner": user_id})
    return doc_ref.id


def delete_user_file(user_id: str, file_id: str):
    doc_ref = db.collection("files").document(file_id)
    doc = doc_ref.get()
    if not doc.exists or doc.to_dict().get("owner") != user_id:
        return False
    doc_ref.delete()
    return True

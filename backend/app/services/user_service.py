from core.firebase import db

def get_user(uid: str):
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        return None
    return doc.to_dict()

def create_or_update_user(uid: str, data: dict):
    db.collection("users").document(uid).set(data, merge=True)

def delete_user(uid: str):
    db.collection("users").document(uid).delete()

def list_users():
    docs = db.collection("users").stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

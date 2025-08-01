import firebase_admin
from firebase_admin import credentials, firestore

cred_path = "/app/firebase-credentials.json"
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

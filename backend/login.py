from google.cloud import secretmanager
import json
import firebase_admin
from firebase_admin import credentials, auth

def get_firebase_credentials_from_secret(secret_name: str, project_id: str) -> dict:
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"
    response = client.access_secret_version(name=name)
    secret_string = response.payload.data.decode("UTF-8")
    return json.loads(secret_string)

if not firebase_admin._apps:
    creds_dict = get_firebase_credentials_from_secret("FIREBASE_CREDENTIALS_JSON", "impo-equipo1")
    cred = credentials.Certificate(creds_dict)
    firebase_admin.initialize_app(cred)

user = auth.create_user(
    email="hola@ejemplo.com",
    password="tu_contraseña"
)
print(f"Usuario creado con uid: {user.uid}")

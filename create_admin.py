import firebase_admin
from firebase_admin import credentials, auth

cred_path = "./backend/credenciales/clave-gcp.json"

cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

admin_email = "admin@tudominio.com"
admin_password = "admin1234"

def create_admin():
    try:
        user = auth.get_user_by_email(admin_email)
        print(f"Usuario admin ya existe: {user.uid}")
    except auth.UserNotFoundError:
        user = auth.create_user(email=admin_email, password=admin_password)
        print(f"Usuario admin creado: {user.uid}")

    auth.set_custom_user_claims(user.uid, {"role": "admin"})
    print(f"Claim 'admin' asignado a usuario {user.uid}")

if __name__ == "__main__":
    create_admin()

import requests

API_KEY = "tu-api-key"
EMAIL = "tu_email@ejemplo.com"
PASSWORD = "tu_contraseña"

def get_firebase_id_token(email, password, api_key):
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    response = requests.post(url, json=payload)
    if not response.ok:
        print("Error response:", response.json())
    response.raise_for_status()
    id_token = response.json()["idToken"]
    return id_token

if __name__ == "__main__":
    token = get_firebase_id_token(EMAIL, PASSWORD, API_KEY)
    print("Firebase ID Token:", token)
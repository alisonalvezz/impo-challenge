from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from api.routes_file import router as files_router
from api.routes_user import router as users_router
from api.routes_admin import router as admin_router
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "https://frontend-217609179837.us-central1.run.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app = FastAPI()
app.include_router(files_router)
app.include_router(users_router)
app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="API de Archivos IMPO",
        version="1.0.0",
        description="a",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    for path in openapi_schema["paths"].values():
        for operation in path.values():
            operation.setdefault("security", [{"BearerAuth": []}])

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

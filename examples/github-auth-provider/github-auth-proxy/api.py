import os

import requests
import uvicorn
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",
]


def create_app() -> FastAPI:
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.post("/api/token")
    def get_github_token(code: str = Form()):
        parameters = {
            "client_id": os.getenv("CLIENT_ID"),
            "client_secret": os.getenv("CLIENT_SECRET"),
            "code": code
        }
        response = requests.post(
            "https://github.com/login/oauth/access_token",
            params=parameters,
            headers={"Accept": "application/json"}
        )
        response.raise_for_status()
        return response.json()

    return app


if __name__ == "__main__":
    uvicorn.run(
        "api:create_app",
        host="0.0.0.0",
        port=5000,
        reload=True,
        log_level='debug',
    )

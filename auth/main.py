from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordRequestForm
from auth_service import AuthService

app = FastAPI()

# Предположим, у тебя есть инстанс AuthService
auth_service = AuthService()

@app.post("/api/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    return auth_service.login(form_data.username, form_data.password)
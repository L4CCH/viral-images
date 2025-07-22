from fastapi import FastAPI
from .routers import data

app = FastAPI()

@app.get("/hello")
async def read_hello():
    return {"message": "Hello World!"}

app.include_router(data.router)

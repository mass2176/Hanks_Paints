import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.routes import router
from app.core.config import settings
from app.db.session import Base, engine
from app.models import domain  # noqa: F401

Base.metadata.create_all(bind=engine)
os.makedirs(settings.media_root, exist_ok=True)

app = FastAPI(title="Hanks Paints MVP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.mount("/media", StaticFiles(directory=settings.media_root), name="media")


@app.get("/")
def root():
    return {"name": "Hanks Paints MVP API", "docs": "/docs"}


@app.get("/healthz")
def healthz():
    return {"status": "ok"}

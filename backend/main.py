from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.api import auth, clients, invoices, dashboard, templates, recurring
from app.services.scheduler import start_scheduler, stop_scheduler

os.makedirs("pdfs", exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="Invoice Generator & Payment Tracker",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/pdfs", StaticFiles(directory="pdfs"), name="pdfs")

app.include_router(auth.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(invoices.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(recurring.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Invoice Generator API", "docs": "/docs"}

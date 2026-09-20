import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.routes import auth, products, machines, orders, schedules, reports

app = FastAPI(
    title="IPSS - Intelligent Product Scheduling System API",
    description="Backend API for manufacturing floor scheduling, machine monitoring, and production analytics.",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(machines.router)
app.include_router(orders.router)
app.include_router(schedules.router)
app.include_router(reports.router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

# Serve frontend HTML, CSS, JS directly
workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app.mount("/", StaticFiles(directory=workspace_dir, html=True), name="static")

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
app.include_router(schedules.router, prefix="/api/schedule")
app.include_router(schedules.router, prefix="/api/schedules")
app.include_router(reports.router)

from fastapi.responses import JSONResponse

@app.exception_handler(RuntimeError)
async def runtime_error_handler(request, exc: RuntimeError):
    msg = str(exc)
    if "Supabase credentials" in msg:
        return JSONResponse(status_code=503, content={"detail": msg})
    return JSONResponse(status_code=500, content={"detail": msg})

@app.get("/api/health")
def health_check():
    import os
    has_url = bool(os.getenv("SUPABASE_URL"))
    has_key = bool(os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_API_KEY"))
    return {
        "status": "healthy",
        "supabase_configured": has_url and has_key
    }

# Serve frontend HTML, CSS, JS directly
workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app.mount("/", StaticFiles(directory=workspace_dir, html=True), name="static")

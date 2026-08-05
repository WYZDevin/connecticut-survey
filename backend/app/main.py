from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .assignment import NoBlockAvailable
from .config import settings
from .routers import health, sessions

app = FastAPI(title="Connecticut Street-View Survey API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

app.include_router(health.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")

if settings.local_image_dir:
    app.mount(
        "/static/images",
        StaticFiles(directory=settings.local_image_dir),
        name="images",
    )


@app.exception_handler(NoBlockAvailable)
def no_block_handler(request: Request, exc: NoBlockAvailable) -> JSONResponse:
    return JSONResponse(
        status_code=503, content={"detail": "No survey blocks available"}
    )

"""AMBROS - API de Controle de Acesso (FastAPI)."""
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import acessos, auth, dashboard, moradores, veiculos, visitantes
from .security import get_current_user

# Cria as tabelas no startup (para produção, prefira Alembic para migrações)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AMBROS - Controle de Acesso",
    description="API do sistema inteligente de controle de acesso para condomínios.",
    version="1.0.0",
)

# Libera o frontend (AdminLTE/Bootstrap). Restrinja allow_origins em produção.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

# Rotas de dados exigem usuário autenticado (Bearer token do /auth/login)
protegido = [Depends(get_current_user)]
app.include_router(moradores.router, dependencies=protegido)
app.include_router(visitantes.router, dependencies=protegido)
app.include_router(veiculos.router, dependencies=protegido)
app.include_router(acessos.router, dependencies=protegido)
app.include_router(dashboard.router, dependencies=protegido)


@app.get("/", tags=["Health"])
def raiz():
    return {"app": "AMBROS", "status": "ok", "docs": "/docs"}

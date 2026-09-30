"""Configuração da conexão com o banco de dados.

Por padrão usa PostgreSQL (conforme o projeto). A URL pode ser sobrescrita
pela variável de ambiente DATABASE_URL — útil para rodar testes locais com
SQLite (ex.: DATABASE_URL=sqlite:///./ambros.db).
"""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Carrega variáveis do arquivo .env (se existir) para os.environ
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://ambros:ambros@localhost:5432/ambros",
)

# check_same_thread só é relevante para SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    """Dependência do FastAPI que fornece uma sessão por requisição."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

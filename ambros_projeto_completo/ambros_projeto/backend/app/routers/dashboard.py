from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]


@router.get("", response_model=schemas.DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    hoje_ini = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    hoje_fim = hoje_ini + timedelta(days=1)

    def contar_acessos(sentido: models.SentidoAcesso) -> int:
        return db.scalar(
            select(func.count())
            .select_from(models.Acesso)
            .where(
                models.Acesso.sentido == sentido,
                models.Acesso.registrado_em >= hoje_ini,
                models.Acesso.registrado_em < hoje_fim,
            )
        ) or 0

    # ---- Cards ----
    moradores_ativos = db.scalar(
        select(func.count()).select_from(models.Morador).where(models.Morador.ativo.is_(True))
    ) or 0
    veiculos = db.scalar(select(func.count()).select_from(models.Veiculo)) or 0
    visitantes_hoje = db.scalar(
        select(func.count())
        .select_from(models.Visitante)
        .where(models.Visitante.criado_em >= hoje_ini, models.Visitante.criado_em < hoje_fim)
    ) or 0
    dentro = db.scalar(
        select(func.count()).select_from(models.Visitante).where(models.Visitante.presente.is_(True))
    ) or 0
    agendadas = db.scalar(
        select(func.count())
        .select_from(models.Visitante)
        .where(
            models.Visitante.agendado_para >= hoje_ini,
            models.Visitante.agendado_para < hoje_fim,
        )
    ) or 0
    ultimo = db.scalar(
        select(models.Acesso).order_by(models.Acesso.registrado_em.desc()).limit(1)
    )

    cards = schemas.CardsDashboard(
        moradores_ativos=moradores_ativos,
        visitantes_hoje=visitantes_hoje,
        veiculos_cadastrados=veiculos,
        entradas_hoje=contar_acessos(models.SentidoAcesso.entrada),
        saidas_hoje=contar_acessos(models.SentidoAcesso.saida),
        dentro_condominio=dentro,
        visitas_agendadas=agendadas,
        ultimo_acesso=ultimo,
    )

    # ---- Movimentação de hoje por faixa de 3h ----
    faixas = [0, 3, 6, 9, 12, 15, 18, 21]
    entradas, saidas = [], []
    for h in faixas:
        ini = hoje_ini + timedelta(hours=h)
        fim = ini + timedelta(hours=3)
        label = f"{h:02d}h"
        for sentido, bucket in ((models.SentidoAcesso.entrada, entradas), (models.SentidoAcesso.saida, saidas)):
            n = db.scalar(
                select(func.count())
                .select_from(models.Acesso)
                .where(
                    models.Acesso.sentido == sentido,
                    models.Acesso.registrado_em >= ini,
                    models.Acesso.registrado_em < fim,
                )
            ) or 0
            bucket.append(schemas.PontoGrafico(label=label, valor=n))

    # ---- Visitantes nos últimos 7 dias ----
    visitantes_7 = []
    for i in range(6, -1, -1):
        dia = (datetime.utcnow().date() - timedelta(days=i))
        ini = datetime.combine(dia, datetime.min.time())
        fim = ini + timedelta(days=1)
        n = db.scalar(
            select(func.count())
            .select_from(models.Visitante)
            .where(models.Visitante.criado_em >= ini, models.Visitante.criado_em < fim)
        ) or 0
        visitantes_7.append(schemas.PontoGrafico(label=dia.strftime("%d/%m"), valor=n))

    ultimos = db.scalars(
        select(models.Acesso).order_by(models.Acesso.registrado_em.desc()).limit(5)
    ).all()

    return schemas.DashboardOut(
        cards=cards,
        movimentacao_hoje=schemas.MovimentacaoDia(entradas=entradas, saidas=saidas),
        visitantes_7dias=visitantes_7,
        ultimos_acessos=ultimos,
    )

"""Popula o banco com dados de exemplo (os mesmos exibidos no frontend).

Uso:
    python -m app.seed
"""
from datetime import datetime, timedelta

from .database import Base, SessionLocal, engine
from . import models
from .security import hash_senha


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Administrador padrão (criado sempre que ainda não existir)
        if not db.query(models.Usuario).filter_by(email="adm@adm.com").first():
            db.add(models.Usuario(
                nome="Administrador",
                email="adm@adm.com",
                senha_hash=hash_senha("123"),
                perfil="admin",
            ))
            db.commit()
            print("Administrador padrão criado: adm@adm.com / 123")

        if db.query(models.Morador).count() > 0:
            print("Banco já possui dados de moradores. Nada mais a fazer.")
            return

        carlos = models.Morador(nome_completo="Carlos Lima", cpf="123.456.789-00",
                                telefone="(11) 98765-4321", whatsapp="(11) 98765-4321",
                                bloco="05", apartamento="502",
                                vinculo=models.VinculoMorador.proprietario, numero_vaga="V-045")
        maria = models.Morador(nome_completo="Maria Oliveira", cpf="987.654.321-00",
                               telefone="(11) 91234-5678", bloco="08", apartamento="103",
                               vinculo=models.VinculoMorador.inquilino, numero_vaga="V-112")
        joao = models.Morador(nome_completo="João Silva", cpf="456.789.123-00",
                              telefone="(11) 99887-7665", bloco="10", apartamento="201",
                              vinculo=models.VinculoMorador.proprietario, numero_vaga="V-078")
        db.add_all([carlos, maria, joao])
        db.flush()

        db.add_all([
            models.Veiculo(placa="ABC1D23", modelo="Onix", cor="Prata", vaga="V-045", morador_id=carlos.id),
            models.Veiculo(placa="XYZ9F87", modelo="HB20", cor="Preto", vaga="V-078", morador_id=joao.id),
        ])

        jose = models.Visitante(nome="José Santos", documento="111.222.333-44", tipo_documento="CPF",
                                placa_veiculo="ABC1D23", bloco="10", apartamento="201",
                                morador_visitado_id=joao.id, presente=True)
        ana = models.Visitante(nome="Ana Paula", documento="555.666.777-88", tipo_documento="CPF",
                               bloco="08", apartamento="103", morador_visitado_id=maria.id, presente=True)
        db.add_all([jose, ana])
        db.flush()

        agora = datetime.utcnow()
        db.add_all([
            models.Acesso(tipo_pessoa=models.TipoPessoa.morador, pessoa_id=carlos.id, nome=carlos.nome_completo,
                          sentido=models.SentidoAcesso.entrada, placa_veiculo="ABC1D23",
                          registrado_em=agora - timedelta(minutes=10)),
            models.Acesso(tipo_pessoa=models.TipoPessoa.visitante, pessoa_id=jose.id, nome=jose.nome,
                          sentido=models.SentidoAcesso.entrada, placa_veiculo="ABC1D23",
                          registrado_em=agora - timedelta(minutes=21)),
            models.Acesso(tipo_pessoa=models.TipoPessoa.morador, pessoa_id=maria.id, nome=maria.nome_completo,
                          sentido=models.SentidoAcesso.saida, registrado_em=agora - timedelta(minutes=23)),
            models.Acesso(tipo_pessoa=models.TipoPessoa.morador, pessoa_id=joao.id, nome=joao.nome_completo,
                          sentido=models.SentidoAcesso.entrada, placa_veiculo="XYZ9F87",
                          registrado_em=agora - timedelta(minutes=29)),
        ])

        db.commit()
        print("Seed concluído: 3 moradores, 2 veículos, 2 visitantes, 4 acessos.")
    finally:
        db.close()


if __name__ == "__main__":
    run()

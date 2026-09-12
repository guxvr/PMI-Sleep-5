"""
consulta_red_flags.py

Tool unica do watsonx Orchestrate: recebe um CNPJ/CPF (+ modalidade
comercial, finalidade do credito e dados agricolas, todos opcionais) e
devolve red flags + score/rating ja calculados deterministicamente. O LLM
do agente NUNCA decide o rating sozinho - so narra o resultado desta funcao.

Importar (de dentro da pasta do pacote):
    orchestrate tools import -k python -f consulta_red_flags.py -r requirements.txt -p .

============================================================================
METODOLOGIA (v4 - reescrita em 2026-09-12 a partir dos CSVs REAIS do repo
https://github.com/guxvr/PMI-Sleep-5, nao mais de estrutura reconstruida
por pesquisa web - ver mudancas.md para o changelog completo linha a linha)
============================================================================
Esta versao troca toda suposicao de estrutura de coluna (v2/v3 deste motor,
construidas a partir de pesquisa nas paginas oficiais de PGFN/IBAMA/MAPA/
INMET, sem acesso aos arquivos) pelos nomes de coluna REAIS presentes em
`auto_infracao_normalizado.csv`, `fgts_normalizado.csv`,
`nao_previdenciario_normalizado.csv`, `previdenciario_normalizado.csv`,
`siszarc_normalizado.csv` e `inmet_normalizado.csv` do repositorio do time.
Isso corrigiu 3 suposicoes que estavam ERRADAS:

1. GRAVIDADE_INFRACAO (IBAMA) tem os niveis reais "Baixa/Media/Alta", nao
   "Leve/Media/Grave" como a pesquisa web anterior sugeriu.

2. Nem todo Auto de Infracao e' um embargo. O arquivo real tem uma coluna
   `CD_TERMOS_EMBARGOS` que so vem preenchida em ~15% das linhas - ou seja,
   a maioria dos autos e' so multa/advertencia, sem bloqueio fisico da
   area. Isso e' uma correcao estrutural de profundidade (a mesma classe de
   problema que o usuario apontou antes sobre red flags rasos): agora
   existem DOIS flags a partir do mesmo arquivo -
   EMBARGO_AMBIENTAL (CD_TERMOS_EMBARGOS preenchido - area fisicamente
   bloqueada, pesa muito mais em barter/CPR) e
   INFRACAO_AMBIENTAL_SEM_EMBARGO (so multa - risco reputacional/
   fiscal, nao bloqueia a colheita).

3. O AGROCLIMATICO nao usa mais uma "tabua de risco" com 20%/30%/40% de
   risco por decendio (esse dataset nao existe no repo do time). O arquivo
   real (`siszarc_normalizado.csv`) e' um registro de CULTIVARES indicados
   por UF/cultura/safra (nao um calendario de plantio por municipio). O
   mecanismo de risco vira "o cultivar que o cliente usa esta na lista de
   cultivares indicados pelo zoneamento para a UF/cultura/safra dele, ou
   nao" - o argumento legal (Decreto no 5.121/2004: seguir o zoneamento e'
   condicao para PROAGRO/PSR) continua valendo, porque usar um cultivar nao
   indicado tambem e' "nao seguir o zoneamento", so que o mecanismo mudou
   de "data de plantio" para "cultivar". LIMITACAO HONESTA: esse arquivo so
   cobre graos/fibra (milho, arroz, feijao, soja, algodao, trigo, sorgo,
   girassol, amendoim) - NAO cobre cana-de-acucar (KrillGrowth) nem citros
   (KrillSet). Para clientes desses dois produtos, o flag e' pulado (sem
   cobertura de dado), nunca fabricado.

Alem disso, o INMET real (`inmet_normalizado.csv`) nao tem coluna de
municipio (so UF/estacao/lat/lon) e traz os valores brutos de hora em hora
(PRECIPITACAO_MM, TEMPERATURA_MIN_C etc.), nao uma anomalia ja classificada
como a v3 deste motor assumia. Este motor agora CALCULA a anomalia
diretamente a partir dos dados brutos, com limiares agronomicos simples e
documentados (geada: TEMPERATURA_MIN_C <= 2,0 graus; seca: precipitacao
acumulada = 0mm numa janela de pelo menos 5 dias de registro) - mais
honesto que consumir um arquivo fictício ja' classificado.

Mantido sem mudanca de mecanismo (apenas confirmado pelos arquivos reais):
score em escala log-odds / expert-judgment scorecard (Siddiqi, 2006),
pontos = -FATOR * ln(multiplicador), sem bonus ad-hoc para 2+ flags (a soma
dos pontos ja embute o efeito multiplicativo dos multiplicadores de odds -
log(a*b)=log(a)+log(b)), valores em R$ fora da formula do score (so no
relatorio), faixas de rating A-D inalteradas. RECUPERACAO_JUDICIAL continua
sem fonte real neste repo (so aparece em MOCK_OVERRIDES) - nao existe
arquivo de recuperacao judicial no repositorio do time.

Novos sub-campos incorporados a partir dos arquivos reais (respondem
diretamente a preocupacao de "red flags rasos"):
- DIVIDA_ATIVA_PGFN / DIVIDA_FGTS: `TIPO_SITUACAO_INSCRICAO` tem 4
  categorias reais (Em cobranca / Garantia / Beneficio Fiscal / Suspenso
  por decisao judicial - a ultima so aparece no arquivo nao previdenciario),
  `INDICADOR_AJUIZADO` (SIM/NAO). FGTS especificamente tem
  `ENTIDADE_RESPONSAVEL` (CAIXA vs PGFN - divida ja escalada para PGFN e'
  estagio mais severo que ainda em cobranca pela CAIXA, ver noticia sobre
  centralizacao da cobranca de FGTS na PGFN citada em mudancas.md). O
  arquivo nao previdenciario tem `RECEITA_PRINCIPAL`, que inclui a
  categoria real "R D Ativa - Credito Rural - Prog Nac Fortalec Agric
  Familiar" (divida de PRONAF) - tratada com peso extra por relevancia de
  dominio (sinal diretamente agro), sem estudo especifico sobre a
  magnitude do peso. `TIPO_DEVEDOR` (Principal/Corresponsavel/Solidario) e'
  so informativo no relatorio, NAO entra na formula - uma primeira versao
  descontava o multiplicador para devedor solidario/corresponsavel supondo
  responsabilidade reduzida, mas o Art. 124/125 do CTN diz o contrario
  (solidariedade tributaria = responsabilidade integral, sem ordem de
  preferencia pelo devedor principal); sem base legal para o desconto, o
  campo saiu da formula (correcao registrada em mudancas.md).
- EMBARGO_AMBIENTAL: alem de GRAVIDADE_INFRACAO, agora usa
  `MOTIVACAO_CONDUTA` (Intencional/Nao intencional - com base real no
  Art. 4 do Decreto no 6.514/2008, que inclui "os motivos da infracao" nos
  criterios de gravidade do fato para fixar a multa ambiental),
  `PASSIVEL_RECUPERACAO` (S/N - julgamento de especialista; NAO confirmado
  como criterio textual explicito do mesmo Decreto) e `CLASSIFICACAO_AREA`
  (Amazonia Legal pesa mais que outras areas - julgamento de especialista
  sobre regime legal mais rigido, sem citacao especifica nova).

LIMITACAO DOCUMENTADA: os CSVs deste repositorio sao sinteticos ("Registro
sintetico para validacao do MVP", conforme o proprio conteudo dos arquivos)
- os NOMES DE COLUNA sao reais e confiaveis (sao os que o pipeline de
producao teria que ler), mas as CORRELACOES entre colunas nos dados de
exemplo nao necessariamente refletem a realidade (ex.: a proporcao de
GRAVIDADE_INFRACAO x CD_TERMOS_EMBARGOS parece aleatoria nos dados de
teste). Os multiplicadores de odds abaixo continuam sendo julgamento
especialista documentado (ver mudancas.md), nao algo estimado desses dados
sinteticos.
"""

import csv
import math
import os
import re
from datetime import date

from ibm_watsonx_orchestrate.agent_builder.tools import tool

# ============================================================
# Casos fixos do roteiro de pitch - sempre respondem igual.
# Ficticios por definicao (o pitch precisa de um resultado estavel em
# palco); por isso, e so aqui, permitimos o detalhe de RJ (estagio) que a
# base real nao oferece (nao existe fonte de RJ neste repositorio).
# ============================================================
MOCK_OVERRIDES = {
    "11222333000181": {},
    "22333444000192": {
        "RECUPERACAO_JUDICIAL": {"presente": True, "estagio_ilustrativo": "processamento_deferido"},
        "DIVIDA_ATIVA_PGFN": {
            "situacao": "em cobrança", "ajuizada": True, "devedor": "principal",
            "pronaf": False, "valor_estimado": 187_400.00,
        },
    },
    "33444555000103": {
        "EMBARGO_AMBIENTAL": {
            "gravidade": "alta", "motivacao": "intencional", "recuperavel": False,
            "classificacao_area": "amazônia legal", "area_ha": 42.0,
        },
    },
    "44555666000114": {
        "DIVIDA_FGTS": {"situacao": "em cobrança", "ajuizada": False, "devedor": "principal", "entidade": "caixa", "valor_estimado": 34_900.00},
    },
}

FONTE_POR_FLAG = {
    "RECUPERACAO_JUDICIAL": "Sem fonte real neste repositorio - so MOCK_OVERRIDES (roteiro de pitch)",
    "DIVIDA_ATIVA_PGFN": "PGFN - nao_previdenciario_normalizado.csv / previdenciario_normalizado.csv",
    "DIVIDA_FGTS": "PGFN/CAIXA - fgts_normalizado.csv",
    "EMBARGO_AMBIENTAL": "IBAMA - auto_infracao_normalizado.csv (com CD_TERMOS_EMBARGOS preenchido)",
    "INFRACAO_AMBIENTAL_SEM_EMBARGO": "IBAMA - auto_infracao_normalizado.csv (sem embargo vinculado)",
    "AGROCLIMATICO": "MAPA/SISZARC - siszarc_normalizado.csv + INMET - inmet_normalizado.csv",
}

RESOURCES_DIR = os.path.dirname(__file__)

TIPO_SITUACAO_BASE = {
    "suspenso por decisão judicial": 1.2,
    "garantia": 1.5,
    "benefício fiscal": 2.0,
    "em cobrança": 6.0,
}
MODALIDADES_AGRICOLAS_ESTRUTURADAS = ("barter", "cpr")


def _so_digitos(identificador: str) -> str:
    return re.sub(r"\D", "", identificador or "")


def _norm(texto: str) -> str:
    return (texto or "").strip().lower()


def _ler_float(valor: str):
    if not valor:
        return None
    try:
        return float(str(valor).strip().replace(",", "."))
    except ValueError:
        return None


# ============================================================
# DIVIDA_ATIVA_PGFN (nao_previdenciario + previdenciario) e DIVIDA_FGTS -
# mesmo schema-nucleo nos 3 arquivos reais, so o nome do arquivo/flag muda.
# ============================================================
FONTES_DIVIDA = [
    {"arquivo": "nao_previdenciario_normalizado.csv", "flag": "DIVIDA_ATIVA_PGFN", "familia": "pgfn"},
    {"arquivo": "previdenciario_normalizado.csv", "flag": "DIVIDA_ATIVA_PGFN", "familia": "pgfn"},
    {"arquivo": "fgts_normalizado.csv", "flag": "DIVIDA_FGTS", "familia": "fgts"},
]


def _carregar_dividas() -> dict:
    """{identificador: {"DIVIDA_ATIVA_PGFN"|"DIVIDA_FGTS": {sub-campos reais}}}."""
    base: dict = {}
    for fonte in FONTES_DIVIDA:
        caminho = os.path.join(RESOURCES_DIR, fonte["arquivo"])
        if not os.path.exists(caminho):
            continue
        with open(caminho, newline="", encoding="utf-8") as f:
            for linha in csv.DictReader(f, delimiter=";"):
                ident = _so_digitos(linha.get("CNPJ_NORMALIZADO") or linha.get("CPF_CNPJ", ""))
                if not ident:
                    continue  # CPF mascarado de pessoa fisica nao da' pra' juntar com confianca

                dados = {
                    "situacao": _norm(linha.get("TIPO_SITUACAO_INSCRICAO")),
                    "ajuizada": _norm(linha.get("INDICADOR_AJUIZADO")) == "sim",
                    "devedor": _norm(linha.get("TIPO_DEVEDOR")),
                    "valor_estimado": _ler_float(linha.get("VALOR_NUMERICO")),
                }
                if fonte["familia"] == "fgts":
                    dados["entidade"] = _norm(linha.get("ENTIDADE_RESPONSAVEL"))
                else:
                    receita = _norm(linha.get("RECEITA_PRINCIPAL"))
                    dados["pronaf"] = ("rural" in receita) or ("agric" in receita)

                # ultima linha do CNPJ no arquivo prevalece - suficiente para
                # o hackathon (nao acumulamos multiplas inscricoes por CNPJ)
                base.setdefault(ident, {})[fonte["flag"]] = dados
    return base


_DIVIDAS = _carregar_dividas()


def _multiplicador_divida(dados: dict, familia: str) -> tuple[float, str]:
    """NOTA (correcao de 2026-09-12, ver mudancas.md): TIPO_DEVEDOR NAO
    entra mais no calculo. A primeira versao aplicava um desconto para
    devedor "corresponsavel/solidario" supondo responsabilidade reduzida -
    mas o Art. 124/125 do CTN diz o contrario: solidariedade tributaria e'
    responsabilidade INTEGRAL, sem ordem de preferencia pelo devedor
    principal. Sem base legal para o desconto, o campo virou informativo
    (aparece no relatorio) e saiu da formula."""
    situacao = dados.get("situacao") or "em cobrança"
    base = TIPO_SITUACAO_BASE.get(situacao, 3.0)
    motivo = [f"TIPO_SITUACAO_INSCRICAO='{situacao}'"]

    mult = base
    if dados.get("ajuizada"):
        mult *= 1.8
        motivo.append("INDICADOR_AJUIZADO=SIM (ja' em execucao fiscal)")

    if familia == "fgts" and dados.get("entidade") == "pgfn":
        mult *= 1.5
        motivo.append(
            "ENTIDADE_RESPONSAVEL=PGFN (divida de FGTS ja' escalada para cobranca de divida "
            "ativa federal, estagio mais severo que cobranca ainda interna da CAIXA)"
        )

    if familia == "pgfn" and dados.get("pronaf"):
        mult *= 2.0
        motivo.append(
            "RECEITA_PRINCIPAL indica credito rural (ex.: PRONAF) - julgamento de especialista "
            "por relevancia de dominio (sinal diretamente agro), sem estudo especifico sobre a magnitude do peso"
        )

    return mult, " + ".join(motivo)


# ============================================================
# EMBARGO_AMBIENTAL / INFRACAO_AMBIENTAL_SEM_EMBARGO (auto_infracao_normalizado.csv)
# ============================================================
ARQUIVO_AUTO_INFRACAO = "auto_infracao_normalizado.csv"
GRAVIDADE_BASE = {"baixa": 1.5, "média": 3.0, "media": 3.0, "alta": 6.0}


def _carregar_auto_infracao() -> dict:
    """{identificador: {"EMBARGO_AMBIENTAL"|"INFRACAO_AMBIENTAL_SEM_EMBARGO": {sub-campos}}}."""
    base: dict = {}
    caminho = os.path.join(RESOURCES_DIR, ARQUIVO_AUTO_INFRACAO)
    if not os.path.exists(caminho):
        return base
    with open(caminho, newline="", encoding="utf-8") as f:
        for linha in csv.DictReader(f, delimiter=";"):
            if _norm(linha.get("SIT_CANCELADO")) == "s":
                continue  # auto cancelado, nao e' red flag ativa

            ident = _so_digitos(linha.get("CNPJ_NORMALIZADO") or linha.get("CPF_CNPJ_INFRATOR", ""))
            if not ident:
                continue

            dados = {
                "gravidade": _norm(linha.get("GRAVIDADE_INFRACAO")),
                "motivacao": _norm(linha.get("MOTIVACAO_CONDUTA")),
                "recuperavel": _norm(linha.get("PASSIVEL_RECUPERACAO")) == "s",
                "classificacao_area": _norm(linha.get("CLASSIFICACAO_AREA")),
                "area_ha": _ler_float(linha.get("QT_AREA")),
                "valor_estimado": _ler_float(linha.get("VALOR_NUMERICO")),
            }
            flag = "EMBARGO_AMBIENTAL" if (linha.get("CD_TERMOS_EMBARGOS") or "").strip() else "INFRACAO_AMBIENTAL_SEM_EMBARGO"
            # se ha' mais de um auto por CNPJ, mantem o de maior gravidade
            existente = base.get(ident, {}).get(flag)
            if existente and GRAVIDADE_BASE.get(existente["gravidade"], 0) >= GRAVIDADE_BASE.get(dados["gravidade"], 0):
                continue
            base.setdefault(ident, {})[flag] = dados
    return base


_AUTO_INFRACAO = _carregar_auto_infracao()


def _multiplicador_embargo(dados: dict, modalidade: str, finalidade_credito: str, com_embargo: bool) -> tuple[float, str]:
    gravidade = dados.get("gravidade") or "média"
    mult = GRAVIDADE_BASE.get(gravidade, 3.0)
    motivo = [f"GRAVIDADE_INFRACAO='{gravidade}'"]

    if dados.get("motivacao") == "intencional":
        mult *= 1.8
        motivo.append(
            "MOTIVACAO_CONDUTA=Intencional (Art. 4 do Decreto no 6.514/2008: a gravidade do "
            "fato, para fixar a multa ambiental, considera 'os motivos da infracao')"
        )

    if dados.get("recuperavel") is False:
        mult *= 1.5
        motivo.append(
            "PASSIVEL_RECUPERACAO=N (julgamento de especialista - dano irreversivel; NAO "
            "confirmamos isso como criterio textual explicito do Art. 4/5 do Decreto 6.514/2008, "
            "que trata reversibilidade num contexto diferente, de medidas de contencao)"
        )

    if dados.get("classificacao_area") == "amazônia legal":
        mult *= 1.5
        motivo.append("CLASSIFICACAO_AREA=Amazonia Legal (regime legal mais rigido)")

    if com_embargo:
        # so faz sentido amarrar a modalidade comercial quando ha' de fato
        # um embargo (CD_TERMOS_EMBARGOS) bloqueando fisicamente a area -
        # uma infracao sem embargo nao impede a colheita.
        if finalidade_credito == "recuperacao_area_embargada":
            motivo.append("credito destinado a recuperacao da area (Res. CMN/BCB 5.193/2024 permite, sem multiplicador extra)")
        elif modalidade in MODALIDADES_AGRICOLAS_ESTRUTURADAS:
            mult *= 3.0
            motivo.append(f"modalidade {modalidade.upper()} amarrada a producao em area com embargo ativo")
        elif modalidade == "a_vista":
            motivo.append("liquidacao imediata, exposicao residual minima")
        else:
            mult *= 1.8
            motivo.append(f"modalidade {modalidade.upper() if modalidade else 'nao informada'}, exposicao a prazo")

    return mult, " + ".join(motivo)


# ============================================================
# AGROCLIMATICO: siszarc_normalizado.csv (cultivares indicados por
# UF/cultura/safra) + inmet_normalizado.csv (observacoes brutas por
# estacao). Chaveado por UF/cultura/estacao, NAO por municipio - o
# repositorio real nao tem coluna de municipio em nenhum dos dois arquivos.
# ============================================================
ARQUIVO_SISZARC = "siszarc_normalizado.csv"
ARQUIVO_INMET = "inmet_normalizado.csv"


def _normalizar_cultura(texto: str) -> str:
    """Aproximacao do que o time chamou de CULTURA_NORMALIZADA (maiuscula,
    sem acento/pontuacao) - nao e' garantido bater 100% com o algoritmo
    original deles, e' uma suposicao razoavel documentada."""
    import unicodedata
    t = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode().upper()
    return re.sub(r"[^A-Z0-9]+", " ", t).strip()


def _carregar_siszarc() -> dict:
    """{(UF, CULTURA_NORMALIZADA, SAFRA): set(cultivares indicados)}."""
    zarc: dict = {}
    caminho = os.path.join(RESOURCES_DIR, ARQUIVO_SISZARC)
    if not os.path.exists(caminho):
        return zarc
    with open(caminho, newline="", encoding="utf-8") as f:
        for linha in csv.DictReader(f, delimiter=";"):
            chave = (
                (linha.get("UF") or "").strip().upper(),
                (linha.get("CULTURA_NORMALIZADA") or _normalizar_cultura(linha.get("Cultura"))).strip().upper(),
                (linha.get("Safra") or "").strip(),
            )
            zarc.setdefault(chave, set()).add((linha.get("Cultivar") or "").strip().upper())
    return zarc


def _carregar_inmet() -> list:
    """Lista de linhas brutas (dict) - pequena o suficiente no mock para
    filtrar em memoria por UF/estacao/periodo em tempo de consulta."""
    caminho = os.path.join(RESOURCES_DIR, ARQUIVO_INMET)
    if not os.path.exists(caminho):
        return []
    with open(caminho, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter=";"))


_SISZARC = _carregar_siszarc()
_INMET = _carregar_inmet()


def _avaliar_situacao_zarc(uf: str, cultura: str, safra: str, cultivar: str) -> dict:
    if not (uf and cultura and safra):
        return {"situacao": "nao_informado"}
    chave = (uf.strip().upper(), _normalizar_cultura(cultura), safra.strip())
    cultivares_indicados = _SISZARC.get(chave)
    if not cultivares_indicados:
        return {"situacao": "sem_cobertura_zarc"}  # ex.: cana-de-acucar/citros - nao fabricamos risco
    if cultivar and cultivar.strip().upper() in cultivares_indicados:
        return {"situacao": "cultivar_indicado"}
    return {"situacao": "cultivar_nao_indicado"}


def _avaliar_anomalia_inmet(uf: str, codigo_estacao: str, periodo_inicio: str, periodo_fim: str) -> dict:
    if not (uf and codigo_estacao and periodo_inicio and periodo_fim):
        return {"confirmada": False, "tipo": None}
    linhas = [
        r for r in _INMET
        if (r.get("UF") or "").strip().upper() == uf.strip().upper()
        and (r.get("CODIGO_ESTACAO") or "").strip() == codigo_estacao.strip()
        and periodo_inicio <= (r.get("DATA_HORA_UTC") or "")[:10] <= periodo_fim
    ]
    if len(linhas) < 5:
        return {"confirmada": False, "tipo": None}  # janela curta demais pra' confiar no calculo

    temps_min = [_ler_float(r.get("TEMPERATURA_MIN_C")) for r in linhas if _ler_float(r.get("TEMPERATURA_MIN_C")) is not None]
    if temps_min and min(temps_min) <= 2.0:
        return {"confirmada": True, "tipo": f"geada (TEMPERATURA_MIN_C={min(temps_min):.1f} na estacao {codigo_estacao})"}

    chuvas = [_ler_float(r.get("PRECIPITACAO_MM")) for r in linhas if _ler_float(r.get("PRECIPITACAO_MM")) is not None]
    if chuvas and sum(chuvas) == 0:
        return {"confirmada": True, "tipo": f"seca (0mm acumulados em {len(linhas)} horas registradas na estacao {codigo_estacao})"}

    return {"confirmada": False, "tipo": None}


def _multiplicador_agroclimatico(dados: dict, modalidade: str) -> tuple[float, str]:
    situacao = dados.get("zarc_situacao")
    anomalia_tipo = dados.get("inmet_anomalia_tipo")

    if situacao == "cultivar_nao_indicado":
        base = 3.0
        motivo_zarc = "cultivar do cliente NAO consta na lista de cultivares indicados pelo SISZARC para UF/cultura/safra (Decreto no 5.121/2004 - fora do zoneamento, sem elegibilidade a PROAGRO/PSR)"
    elif situacao == "cultivar_indicado":
        base = 1.05
        motivo_zarc = "cultivar do cliente consta na lista de cultivares indicados pelo SISZARC"
    else:
        base = 1.0
        motivo_zarc = "sem cobertura do SISZARC para essa UF/cultura/safra (ex.: cana-de-acucar/citros) ou dado nao informado - sem penalidade por falta de dado"

    if anomalia_tipo:
        mult_inmet = 2.0
        motivo_inmet = f"; anomalia climatica calculada a partir do INMET: {anomalia_tipo}"
    else:
        mult_inmet = 1.0
        motivo_inmet = ""

    if base == 1.0 and mult_inmet == 1.0:
        return 1.0, "sem sinal agroclimatico"

    if modalidade in MODALIDADES_AGRICOLAS_ESTRUTURADAS:
        mult_modalidade = 2.5
        motivo_modalidade = f"modalidade {modalidade.upper()}, pagamento depende da safra existir"
    elif modalidade == "a_vista":
        mult_modalidade = 1.0
        motivo_modalidade = "liquidacao imediata, resultado da safra nao afeta o recebivel"
    else:
        mult_modalidade = 1.4
        motivo_modalidade = f"modalidade {modalidade.upper() if modalidade else 'nao informada'}"

    return base * mult_modalidade * mult_inmet, f"{motivo_zarc} x {motivo_modalidade}{motivo_inmet}"


# ============================================================
# Motor de score: log-odds / expert-judgment scorecard
# (Siddiqi, 2006 - ver docstring do modulo e mudancas.md)
# ============================================================
SCORE_MAXIMO = 1000
PDO = 100
FATOR = PDO / math.log(2)  # ~144.27, calibrado para RJ isolada cair em D


def _calcular_score(red_flags: dict, modalidade_comercial: str = None, finalidade_credito: str = None) -> dict:
    """Cada red flag e' um multiplicador de odds de default DOCUMENTADO;
    pontos = -FATOR * ln(multiplicador). Soma dos pontos entre flags (nao
    ha' bonus ad-hoc para 2+ sinais - a soma ja equivale a multiplicar os
    multiplicadores de odds). Faixas de rating (contrato oficial do time):
    A=800-1000, B=650-799, C=500-649, D=0-499."""
    modalidade = (modalidade_comercial or "nao_informado").lower()
    finalidade = (finalidade_credito or "producao").lower()

    score_atual = SCORE_MAXIMO
    pontos_por_flag = {}
    justificativa_auditavel = [f"INICIO: Score Base = {SCORE_MAXIMO}"]

    for flag, dados in red_flags.items():
        if flag == "RECUPERACAO_JUDICIAL" and dados.get("presente"):
            multiplicador = 60.0
            motivo = (
                "RJ deferida impoe stay period de 180 dias (Lei 11.101/2005, alterada pela "
                "Lei 14.112/2020) que bloqueia LEGALMENTE a recuperacao de credito. Setor "
                "agropecuario foi o no 1 em pedidos de RJ no Brasil em 2025 (743/2.466 = 30,1%, "
                "Indicador Serasa Experian)."
            )
        elif flag == "DIVIDA_ATIVA_PGFN":
            multiplicador, motivo = _multiplicador_divida(dados, "pgfn")
        elif flag == "DIVIDA_FGTS":
            multiplicador, motivo = _multiplicador_divida(dados, "fgts")
        elif flag == "EMBARGO_AMBIENTAL":
            multiplicador, motivo = _multiplicador_embargo(dados, modalidade, finalidade, com_embargo=True)
        elif flag == "INFRACAO_AMBIENTAL_SEM_EMBARGO":
            multiplicador, motivo = _multiplicador_embargo(dados, modalidade, finalidade, com_embargo=False)
        elif flag == "AGROCLIMATICO":
            multiplicador, motivo = _multiplicador_agroclimatico(dados, modalidade)
            if multiplicador == 1.0:
                continue  # sem sinal (dado insuficiente ou tudo dentro do esperado)
        else:
            continue

        pontos = -round(FATOR * math.log(multiplicador), 1)
        pontos_por_flag[flag] = {"multiplicador_odds": round(multiplicador, 2), "pontos": pontos}
        score_atual += pontos
        justificativa_auditavel.append(
            f"REGRA [{flag}]: multiplicador de odds = {multiplicador:.2f}x ({motivo}) -> {pontos:+.1f} pts"
        )

    score_final = max(0, min(round(score_atual), SCORE_MAXIMO))

    if score_final >= 800:
        rating = "A"
    elif score_final >= 650:
        rating = "B"
    elif score_final >= 500:
        rating = "C"
    else:
        rating = "D"

    justificativa_auditavel.append(f"FIM: Score consolidado em {score_final} -> Enquadramento de Rating: {rating}")

    return {
        "score": score_final,
        "rating": rating,
        "pontos_por_flag": pontos_por_flag,
        "justificativa_auditavel": justificativa_auditavel,
    }


@tool()
def consultar_red_flags(
    cnpj_ou_cpf: str,
    modalidade_comercial: str = None,
    finalidade_credito: str = None,
    uf: str = None,
    cultura: str = None,
    safra: str = None,
    cultivar: str = None,
    codigo_estacao: str = None,
    periodo_inicio: str = None,
    periodo_fim: str = None,
) -> str:
    """Consulta red flags de risco de credito e calcula o score/rating de
    forma deterministica (nao e' o LLM que decide o rating).

    Args:
        cnpj_ou_cpf (str): CNPJ ou CPF do cliente, com ou sem pontuacao.
        modalidade_comercial (str): "a_vista", "prazo", "barter", "cpr" ou None.
        finalidade_credito (str): "producao" (padrao) ou
            "recuperacao_area_embargada" - so usado quando ha' EMBARGO_AMBIENTAL
            ativo, conforme Res. CMN/BCB 5.193/2024.
        uf, cultura, safra, cultivar (str): dados agricolas do cliente para
            cruzar com o SISZARC (ex.: uf="MT", cultura="Soja",
            safra="2026-2027", cultivar="MX1000PRO4"). So cobre graos/fibra
            (nao cobre cana-de-acucar/citros - nesse caso o flag e' pulado).
        codigo_estacao, periodo_inicio, periodo_fim (str): estacao INMET
            mais proxima da propriedade e janela "YYYY-MM-DD" da safra, para
            detectar geada/seca observada. Todos os campos agricolas sao
            opcionais - sem eles, o flag AGROCLIMATICO e' pulado, nunca
            fabricado.

    Returns:
        str: Red flags encontradas, score, rating e justificativa auditavel
            (com multiplicador de odds e fonte por flag), prontos para o
            agente narrar no relatorio.
    """
    identificador_limpo = _so_digitos(cnpj_ou_cpf)

    if identificador_limpo in MOCK_OVERRIDES:
        red_flags = dict(MOCK_OVERRIDES[identificador_limpo])
    else:
        red_flags = {}
        red_flags.update(_DIVIDAS.get(identificador_limpo, {}))
        red_flags.update(_AUTO_INFRACAO.get(identificador_limpo, {}))
        if not red_flags and identificador_limpo not in _DIVIDAS and identificador_limpo not in _AUTO_INFRACAO:
            return (
                f"O identificador {cnpj_ou_cpf} nao consta na base de dados consultada. "
                f"Trate como dado insuficiente, nao como confirmacao de baixo risco."
            )

    zarc = _avaliar_situacao_zarc(uf, cultura, safra, cultivar)
    inmet = _avaliar_anomalia_inmet(uf, codigo_estacao, periodo_inicio, periodo_fim)
    if zarc["situacao"] not in ("nao_informado", "sem_cobertura_zarc") or inmet["confirmada"]:
        red_flags["AGROCLIMATICO"] = {"zarc_situacao": zarc["situacao"], "inmet_anomalia_tipo": inmet["tipo"]}

    resultado = _calcular_score(red_flags, modalidade_comercial, finalidade_credito)

    linhas = [f"Identificador: {cnpj_ou_cpf}"]
    if red_flags:
        for flag, dados in red_flags.items():
            if flag not in resultado["pontos_por_flag"]:
                continue  # ex: AGROCLIMATICO sem sinal, filtrado no calculo
            fonte = FONTE_POR_FLAG.get(flag, "base local")
            detalhe = ", ".join(f"{k}={v}" for k, v in dados.items() if v is not None)
            linhas.append(f"- Red flag: {flag} ({detalhe}) [fonte: {fonte}]")
    if not resultado["pontos_por_flag"]:
        linhas.append("- Nenhuma red flag encontrada nas bases consultadas.")

    linhas.append(f"Score calculado: {resultado['score']}/1000")
    linhas.append(f"Rating (ja calculado, NAO recalcule): {resultado['rating']}")
    linhas.append("Justificativa auditavel do calculo:")
    for item in resultado["justificativa_auditavel"]:
        linhas.append(f"  * {item}")

    return "\n".join(linhas)

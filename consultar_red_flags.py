"""
consulta_red_flags.py

Tool unica do watsonx Orchestrate: recebe um CNPJ/CPF (+ modalidade
comercial opcional) e devolve red flags + score/rating ja calculados
deterministicamente. O LLM do agente NUNCA decide o rating sozinho -
so narra o resultado desta funcao.

Importar (de dentro da pasta do pacote):
    orchestrate tools import -k python -f consulta_red_flags.py -r requirements.txt -p .
"""

import csv
import os
import re

from ibm_watsonx_orchestrate.agent_builder.tools import tool

# ============================================================
# Casos fixos do roteiro de pitch - sempre respondem igual
# ============================================================
MOCK_OVERRIDES = {
    "11222333000181": [],
    "22333444000192": ["RECUPERACAO_JUDICIAL", "DIVIDA_ATIVA_PGFN"],
    "33444555000103": ["EMBARGO_AMBIENTAL"],
    "44555666000114": ["DIVIDA_FGTS"],
}

FONTE_POR_FLAG = {
    "RECUPERACAO_JUDICIAL": "Receita Federal",
    "DIVIDA_ATIVA_PGFN": "PGFN",
    "DIVIDA_FGTS": "PGFN",
    "EMBARGO_AMBIENTAL": "IBAMA",
}

RESOURCES_DIR = os.path.dirname(__file__)

# ============================================================
# Cada arquivo real do time vira uma fonte de red flag separada.
# NOTA: nao existe fonte de RECUPERACAO_JUDICIAL nesses arquivos -
# esse flag so aparece via MOCK_OVERRIDES (casos fixos do pitch).
# ============================================================
FONTES_CSV = [
    {
        "arquivo": "mock_dados_abertos_nao_previdenciario.csv",
        "coluna_id": "CPF_CNPJ",
        "flag": "DIVIDA_ATIVA_PGFN",
        "filtro_status": None,  # todas as linhas contam
    },
    {
        "arquivo": "mock_dados_abertos_previdenciario.csv",
        "coluna_id": "CPF_CNPJ",
        "flag": "DIVIDA_ATIVA_PGFN",
        "filtro_status": None,
    },
    {
        "arquivo": "mock_dados_abertos_FGTS.csv",
        "coluna_id": "CPF_CNPJ",
        "flag": "DIVIDA_FGTS",
        "filtro_status": None,
    },
    {
        "arquivo": "mock_auto_infracao.csv",
        "coluna_id": "CPF_CNPJ_INFRATOR",
        "flag": "EMBARGO_AMBIENTAL",
        # so conta como red flag ativa se NAO estiver cancelado
        "filtro_status": {"coluna": "SIT_CANCELADO", "valor_valido": "N"},
    },
]


def _carregar_base_csv() -> dict:
    """Le os 4 CSVs reais do time -> {identificador: set(flags)}."""
    base = {}
    for fonte in FONTES_CSV:
        caminho = os.path.join(RESOURCES_DIR, fonte["arquivo"])
        if not os.path.exists(caminho):
            continue
        with open(caminho, newline="", encoding="utf-8") as f:
            for linha in csv.DictReader(f, delimiter=";"):
                if fonte["filtro_status"]:
                    col = fonte["filtro_status"]["coluna"]
                    valido = fonte["filtro_status"]["valor_valido"]
                    if (linha.get(col, "").strip()) != valido:
                        continue  # ex: infracao cancelada, nao conta

                ident = re.sub(r"\D", "", linha.get(fonte["coluna_id"], ""))
                if not ident:
                    continue
                base.setdefault(ident, set()).add(fonte["flag"])
    return base


_BASE_CSV = _carregar_base_csv()


def _so_digitos(identificador: str) -> str:
    return re.sub(r"\D", "", identificador)


def _calcular_score(red_flags: list, modalidade_comercial: str = None) -> dict:
    """
    Motor de Credit Scoring Baseado em Especialistas (Expert-Judgment Scorecard).

    Metodologia: inspirado em "Credit Risk Scorecards" (Siddiqi, 2006). Pesos
    calibrados para bater com a escala de rating documentada na base de
    conhecimento do agente (Secoes 7 e 9).

    Regulamentacao ambiental: Resolucao CMN/BCB no 5.193/2024 (que revogou a
    Res. no 5.081/2023), sobre restricoes a credito rural em area embargada.

    Limitacoes: modelo deterministico baseado em regras especialista, sem
    ajuste empirico por regressao logistica sobre base historica interna.
    """
    SCORE_MAXIMO = 1000
    score_atual = SCORE_MAXIMO
    pontos_por_flag = {}
    justificativa_auditavel = [f"INICIO: Score Base = {SCORE_MAXIMO}"]

    modalidade = modalidade_comercial.lower() if modalidade_comercial else "nao_informado"
    modalidades_agricolas_estruturadas = ["barter", "cpr"]

    for flag in red_flags:
        if flag == "RECUPERACAO_JUDICIAL":
            penalidade = -1000
            justificativa_auditavel.append(
                f"REGRA: RECUPERACAO_JUDICIAL = Risco critico de insolvencia/bloqueio legal ({penalidade} pts)."
            )
        elif flag == "DIVIDA_ATIVA_PGFN":
            penalidade = -500
            justificativa_auditavel.append(
                f"REGRA: DIVIDA_ATIVA_PGFN = Asfixia fiscal severa e impossibilidade de emissao de CND ({penalidade} pts)."
            )
        elif flag == "EMBARGO_AMBIENTAL":
            if modalidade in modalidades_agricolas_estruturadas:
                penalidade = -650
                justificativa_auditavel.append(
                    f"REGRA: EMBARGO_AMBIENTAL na modalidade {modalidade.upper()} = Risco de bloqueio da safra garantia, Res. CMN 5.193/2024 ({penalidade} pts)."
                )
            elif modalidade == "a_vista":
                penalidade = -200
                justificativa_auditavel.append(
                    f"REGRA: EMBARGO_AMBIENTAL na modalidade A_VISTA = Risco de imagem/conformidade, mitigado pela liquidacao imediata ({penalidade} pts)."
                )
            else:
                penalidade = -300
                justificativa_auditavel.append(
                    f"REGRA: EMBARGO_AMBIENTAL na modalidade {modalidade.upper()} = Restricao regulatoria e risco operacional ({penalidade} pts)."
                )
        elif flag == "DIVIDA_FGTS":
            penalidade = -250
            justificativa_auditavel.append(
                f"REGRA: DIVIDA_FGTS = Passivo trabalhista executavel em Divida Ativa ({penalidade} pts)."
            )
        else:
            penalidade = 0
            justificativa_auditavel.append(f"INFO: Flag desconhecida '{flag}' ignorada (0 pts).")

        pontos_por_flag[flag] = penalidade
        score_atual += penalidade

    flags_nao_rj = [f for f in red_flags if f != "RECUPERACAO_JUDICIAL"]
    if len(flags_nao_rj) >= 2:
        penalidade_combo = -150
        score_atual += penalidade_combo
        pontos_por_flag["COMBINACAO_MULTIPLA"] = penalidade_combo
        justificativa_auditavel.append(
            f"REGRA COMPOSTA: Multiplicidade de restricoes (2+ flags) = Efeito cumulativo de degradacao financeira ({penalidade_combo} pts adicionais)."
        )

    score_final = max(0, min(score_atual, SCORE_MAXIMO))

    if score_final >= 850:
        rating = "A"
    elif score_final >= 650:
        rating = "B"
    elif score_final >= 350:
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
def consultar_red_flags(cnpj_ou_cpf: str, modalidade_comercial: str = None) -> str:
    """Consulta red flags de risco de credito e calcula o score/rating
    de forma deterministica (nao e o LLM que decide o rating).

    Args:
        cnpj_ou_cpf (str): CNPJ ou CPF do cliente, com ou sem pontuacao.
        modalidade_comercial (str): "a_vista", "prazo", "barter", "cpr" ou None.

    Returns:
        str: Red flags encontradas, score, rating e justificativa auditavel,
            prontos para o agente narrar no relatorio.
    """
    identificador_limpo = _so_digitos(cnpj_ou_cpf)

    if identificador_limpo in MOCK_OVERRIDES:
        flags = MOCK_OVERRIDES[identificador_limpo]
    elif identificador_limpo in _BASE_CSV:
        flags = list(_BASE_CSV[identificador_limpo])
    else:
        return (
            f"O identificador {cnpj_ou_cpf} nao consta na base de dados consultada. "
            f"Trate como dado insuficiente, nao como confirmacao de baixo risco."
        )

    resultado = _calcular_score(flags, modalidade_comercial)

    linhas = [f"Identificador: {cnpj_ou_cpf}"]
    if flags:
        for flag in flags:
            fonte = FONTE_POR_FLAG.get(flag, "base local")
            linhas.append(f"- Red flag: {flag} (fonte: {fonte})")
    else:
        linhas.append("- Nenhuma red flag encontrada nas bases consultadas.")

    linhas.append(f"Score calculado: {resultado['score']}/1000")
    linhas.append(f"Rating (ja calculado, NAO recalcule): {resultado['rating']}")
    linhas.append("Justificativa auditavel do calculo:")
    for item in resultado["justificativa_auditavel"]:
        linhas.append(f"  * {item}")

    return "\n".join(linhas)
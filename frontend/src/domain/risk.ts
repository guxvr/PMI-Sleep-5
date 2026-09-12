import type {
  Assessment,
  Client,
  Modality,
  Operation,
  Policy,
  Rating,
  Recommendation,
} from "./types";

export const MODALITIES: Record<Modality, string> = {
  a_vista: "À vista",
  prazo: "A prazo",
  barter: "Barter",
  cpr: "CPR",
};
export const RATING_COLORS: Record<Rating, string> = {
  A: "#24836b",
  B: "#809b49",
  C: "#d4993b",
  D: "#c65c5c",
  NC: "#8b939b",
};
export const RATING_LABELS: Record<Rating, string> = {
  A: "Baixo risco",
  B: "Moderado",
  C: "Elevado",
  D: "Crítico",
  NC: "Não conclusivo",
};
export const PILLARS = [
  "Processual e jurídico",
  "Societário e cadastral",
  "Agronômico e climático",
  "Fiscal e trabalhista",
  "Ambiental",
];
export const WEIGHTS = [30, 20, 20, 15, 15];
export const POLICY_LABELS: Record<Policy, string> = {
  "project-v02": "Projeto v0.2 · simulação",
  "agent-v04": "Agente v4 · snapshot Python",
};
export const normalizeIdentifier = (value: string) =>
  value.replace(/[./\-\s]/g, "").toUpperCase();
export const validIdentifier = (value: string) =>
  /^[A-Z0-9]{12}\d{2}$/.test(normalizeIdentifier(value));
export function ratingFor(score: number, policy: Policy): Rating {
  const cuts = policy === "agent-v04" ? [800, 650, 500] : [800, 600, 400];
  return score >= cuts[0]
    ? "A"
    : score >= cuts[1]
      ? "B"
      : score >= cuts[2]
        ? "C"
        : "D";
}
export function defaultOperation(
  c: Client,
  policy: Policy = "project-v02",
): Operation {
  return {
    clientId: c.id,
    modality: c.modality,
    amount: 180000,
    term: c.term,
    guarantee: "penhor",
    linkedArea: c.embargoConfirmed,
    policy,
  };
}
/** Demo projection of the documented policy. PILLAR INPUTS ARE SYNTHETIC.
 * Real assessments must come from the backend, without client recomputation.
 */
export function assess(
  client: Client | undefined,
  op: Operation,
  weights = WEIGHTS,
): Assessment {
  if (!client || client.coverage === "insufficient")
    return {
      score: null,
      baseScore: null,
      rating: "NC",
      rules: [],
      override: null,
      policy: op.policy,
    };
  let rules: { label: string; points: number }[] = [];
  let override: string | null = null;
  if (op.policy === "agent-v04") {
    // Generated from the actual Python source, no duplicate scoring implementation.
    // Scope: finalidade=producao; no agro inputs. Future live results come from the API.
    return { ...client.agentAssessments[op.modality], policy: op.policy };
  }
  rules = client.risks.map((risk, i) => ({
    label: PILLARS[i],
    points: -Math.round((weights[i] * risk) / 10),
  }));
  const baseScore = Math.max(
    0,
    Math.min(
      1000,
      1000 -
        Math.round(
          client.risks.reduce((n, risk, i) => n + (weights[i] * risk) / 10, 0),
        ),
    ),
  );
  if (client.rj) override = "RJ confirmada no cenário de demonstração";
  if (
    client.embargoConfirmed &&
    op.linkedArea &&
    ["barter", "cpr"].includes(op.modality)
  )
    override = "Embargo vinculado ao lastro da operação";
  const score = override ? Math.min(baseScore, 399) : baseScore;
  return {
    score,
    baseScore,
    rating: ratingFor(score, op.policy),
    rules,
    override,
    policy: op.policy,
  };
}
export function recommend(
  client: Client | undefined,
  op: Operation,
  a: Assessment,
): Recommendation[] {
  return (Object.keys(MODALITIES) as Modality[]).map((modality) => {
    let status: Recommendation["status"] = "adequada",
      title = "Estrutura disponível para avaliação",
      reason = "Avaliar capacidade, documentação e condições comerciais.",
      guarantee = "Conforme política comercial";
    if (a.rating === "NC") {
      status = "condicionada";
      title = "Complementar informações";
      reason = "Não há cobertura suficiente para recomendar uma estrutura.";
    } else if (modality === "a_vista") {
      title = "Preserva a possibilidade de negociação";
      reason =
        "Liquidação antes da entrega reduz exposição de crédito. Demais verificações continuam aplicáveis.";
      guarantee = "Pagamento antecipado";
    } else if (a.rating === "D") {
      status = "desaconselhada";
      title = "Revisão pelo crédito e jurídico";
      reason =
        "A política simulada direciona novas vendas para liquidação à vista enquanto o caso é analisado.";
      guarantee = "Revisão obrigatória";
    } else if (modality === "barter" && a.rating === "C") {
      status = "desaconselhada";
      title = "Priorizar outra modalidade";
      reason = "O cenário exige reduzir a dependência da safra como pagamento.";
      guarantee = "Validar produção e lastro";
    } else {
      status =
        a.rating === "A" && modality === "prazo" ? "adequada" : "condicionada";
      title =
        modality === "prazo"
          ? a.rating === "A"
            ? "Condições padrão da política"
            : "Prazo e garantia a revisar"
          : modality === "barter"
            ? "Validar janela de plantio e lastro"
            : "Validar modalidade da CPR e garantias";
      reason =
        modality === "prazo"
          ? "Confrontar exposição atual, nova operação e capacidade de pagamento."
          : modality === "barter"
            ? "O CSV SISZARC é um catálogo; não comprova janela favorável. Complementar solo, cultura, imóvel e safra."
            : "CPR física e financeira têm condições distintas. O enquadramento jurídico depende da operação e dos documentos.";
      guarantee =
        a.rating === "A"
          ? "Garantia padrão a validar"
          : "Alienação fiduciária a avaliar";
    }
    if (
      client?.embargoConfirmed &&
      op.linkedArea &&
      ["barter", "cpr"].includes(modality)
    ) {
      status = "desaconselhada";
      title = "Lastro atingido pelo embargo";
      reason =
        "Cenário de área vinculada ao embargo. Esclarecer vigência e abrangência antes de comprometer a produção.";
      guarantee = "Não utilizar este lastro sem revisão";
    }
    return { modality, status, title, reason, guarantee };
  });
}
export function sensitivity(client: Client, op: Operation) {
  const base = assess(client, op);
  return WEIGHTS.flatMap((weight, i) =>
    [-10, 10].map((delta) => {
      const newWeights = WEIGHTS.map((w, j) =>
        j === i
          ? weight + delta
          : (w * (100 - weight - delta)) / (100 - weight),
      );
      const result = assess(
        client,
        { ...op, policy: "project-v02" },
        newWeights,
      );
      return {
        pillar: PILLARS[i],
        delta,
        score: result.score,
        rating: result.rating,
        changed: result.rating !== base.rating,
      };
    }),
  );
}

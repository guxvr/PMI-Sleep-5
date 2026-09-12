import type { Client } from "./types";
export type RiskAlert = {
  id: string;
  client: Client;
  title: string;
  description: string;
  kind: "Crítico" | "Antecedente" | "Confirmatório";
  source: string;
  date: string;
};
export function buildAlerts(clients: Client[]): RiskAlert[] {
  return clients
    .flatMap((c) => {
      const alerts: RiskAlert[] = [];
      if (c.rj)
        alerts.push({
          id: `${c.id}-rj`,
          client: c,
          title: "Recuperação judicial no cenário",
          description:
            "Revisar novas operações com crédito e jurídico. Ocorrência fixa do roteiro.",
          kind: "Crítico",
          source: "Cenário do pitch",
          date: "2026-09-12",
        });
      if (c.embargoConfirmed)
        alerts.push({
          id: `${c.id}-embargo`,
          client: c,
          title: "Embargo com impacto no lastro",
          description:
            "Reavaliar barter e CPR conforme a área da operação. Vínculo simulado.",
          kind: "Crítico",
          source: "Cenário do pitch",
          date: "2026-09-11",
        });
      if (c.earlySignal)
        alerts.push({
          id: `${c.id}-early`,
          client: c,
          title: c.earlySignal,
          description:
            "Sinal antecedente fictício para demonstrar monitoramento. Acesso à fonte ainda pendente.",
          kind: "Antecedente",
          source: "Cenário adicional",
          date: `2026-09-${10 - (c.id.charCodeAt(2) % 5)}`,
        });
      else if (!c.rj && c.evidence.some((e) => e.status !== "Cancelado"))
        alerts.push({
          id: `${c.id}-confirm`,
          client: c,
          title: "Revisar ocorrência da base consultada",
          description:
            "Sinal confirmatório. Conferir situação, valor e atualização; não é alerta precoce isolado.",
          kind: "Confirmatório",
          source: c.evidence[0]?.source.toUpperCase() || "Mock",
          date: "2026-09-08",
        });
      return alerts;
    })
    .sort(
      (a, b) =>
        ["Crítico", "Antecedente", "Confirmatório"].indexOf(a.kind) -
        ["Crítico", "Antecedente", "Confirmatório"].indexOf(b.kind),
    );
}

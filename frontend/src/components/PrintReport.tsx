import type {
  Analysis,
  Assessment,
  Client,
  Operation,
  Recommendation,
} from "../domain/types";
import { currency, dateTime } from "../domain/format";
import { MODALITIES, POLICY_LABELS } from "../domain/risk";

export function PrintReport({
  client: c,
  operation: op,
  assessment: a,
  recommendations,
  saved,
}: {
  client: Client;
  operation: Operation;
  assessment: Assessment;
  recommendations: Recommendation[];
  saved?: Analysis;
}) {
  return (
    <section className="print-sheet">
      <header>
        <div>
          <small>KRILLTECH / RELATÓRIO DE OPERAÇÃO</small>
          <h2>{c.name}</h2>
          <p>
            {c.cnpj} · {c.state} · {c.crop}
          </p>
        </div>
        <strong>
          DEMONSTRAÇÃO
          <br />
          <small>Dados sintéticos · revisão humana</small>
        </strong>
      </header>
      <div className="print-facts">
        <div>
          <small>OPERAÇÃO PROPOSTA</small>
          <b>
            {currency(op.amount)} · {MODALITIES[op.modality]}
          </b>
          <p>
            {op.term} dias · garantia:{" "}
            {op.guarantee === "alienacao"
              ? "alienação fiduciária"
              : op.guarantee}
          </p>
        </div>
        <div>
          <small>CLASSIFICAÇÃO DA OPERAÇÃO</small>
          <b>
            {a.rating} · {a.score ?? "NC"} / 1000
          </b>
          <p>
            {a.override
              ? `Regra crítica: ${a.override}`
              : POLICY_LABELS[op.policy]}
          </p>
        </div>
        <div>
          <small>EXPOSIÇÃO COM O CLIENTE</small>
          <b>{currency(c.exposure)}</b>
          <p>
            Com estrutura de garantia: {currency(c.exposure * c.securedRatio)}.
            Enquadramento a validar.
          </p>
        </div>
      </div>
      <h3>Alternativas para negociação</h3>
      <table>
        <thead>
          <tr>
            <th>Modalidade</th>
            <th>Orientação</th>
            <th>Fundamento e diligência</th>
          </tr>
        </thead>
        <tbody>
          {recommendations.map((r) => (
            <tr key={r.modality}>
              <td>
                {MODALITIES[r.modality]}
                <small>
                  {r.status === "adequada"
                    ? "A avaliar"
                    : r.status === "condicionada"
                      ? "Condicionada"
                      : "Desaconselhada"}
                </small>
              </td>
              <td>
                <b>{r.title}</b>
                <small>{r.guarantee}</small>
              </td>
              <td>{r.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Evidências disponíveis no cenário</h3>
      {c.evidence.length ? (
        <ul>
          {c.evidence.slice(0, 5).map((e) => (
            <li key={e.id}>
              <b>{e.title}</b> · {e.status} · {e.source.toUpperCase()} ·{" "}
              {e.date || "data indisponível"}
              <small>
                {e.file}
                {e.line ? ` · linha ${e.line}` : ""} · {e.id}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          O caso fixo não contém red flags. Isso não comprova solvência ou
          cobertura integral.
        </p>
      )}
      <footer>
        <p>
          {POLICY_LABELS[op.policy]} ·{" "}
          {saved
            ? `Análise ${saved.id} · ${dateTime(saved.createdAt)}`
            : "Simulação não registrada"}
          .
        </p>
        <p>
          Fontes oficiais e agente não conectados. Score sem PD calibrada.
          Garantias, lastro e condições exigem validação. Detalhes, dados brutos
          e pareceres estão no workspace.
        </p>
      </footer>
    </section>
  );
}

import raw from "../data/demo.json";
import type {
  Analysis,
  ChatMessage,
  Client,
  Dataset,
  Operation,
} from "../domain/types";
import { assess, MODALITIES, recommend, RATING_LABELS } from "../domain/risk";
import { currency } from "../domain/format";
export const dataset = raw as unknown as Dataset;
export const clients = dataset.clients;
const pause = (ms = 550) => new Promise((resolve) => setTimeout(resolve, ms));
/** Replace with a server adapter. IBM credentials must never be exposed to Vite. */
export interface RiskGateway {
  analyze(operation: Operation): Promise<Analysis>;
  chat(
    client: Client,
    operation: Operation,
    text: string,
  ): Promise<ChatMessage>;
}
export const gateway: RiskGateway = {
  async analyze(operation) {
    await pause(900);
    return {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      operation,
      assessment: assess(
        clients.find((c) => c.id === operation.clientId),
        operation,
      ),
    };
  },
  async chat(client, op, text) {
    await pause(650);
    const a = assess(client, op);
    const recs = recommend(client, op, a);
    const lower = text.toLocaleLowerCase("pt-BR");
    let response = "";
    if (/modalidade|barter|cpr|negoci|garantia|vista/.test(lower))
      response =
        `Para ${client.name}, na operação de ${currency(op.amount)} em ${MODALITIES[op.modality].toLowerCase()} por ${op.term} dias, a política simulada retorna ${a.rating}${a.score !== null ? ` (${a.score}/1000)` : ""}.\n\n` +
        recs
          .map((r) => `${MODALITIES[r.modality]} — ${r.title}. ${r.reason}`)
          .join("\n\n") +
        "\n\nPróximo passo: validar documentos e registrar o parecer do analista. Nenhuma condição é aplicada automaticamente.";
    else if (/fonte|falta|valid|certeza|dados/.test(lower))
      response = `O contexto disponível tem ${client.evidence.length} evidência(s) de demonstração. ${client.sourceNote}\n\nAinda é necessário confirmar atualização das fontes, fase processual, vínculo do imóvel e documentação da garantia. O SISZARC importado não contém janela de risco de plantio.\n\nAs fontes de protestos, processos e quadro societário não estão conectadas. Os sinais antecedentes mostrados no roteiro são fictícios. Não interprete a ausência de achados como segurança.`;
    else if (/score|risco|sina|explic|resum/.test(lower))
      response = `Resumo de ${client.name}\n\nClassificação: ${a.rating} · ${RATING_LABELS[a.rating]}. ${a.score === null ? "Cobertura insuficiente para nota final." : `Score ${a.score}/1000, calculado pelo motor local de demonstração.`}\n\n${client.evidence.length ? client.evidence.map((e) => `${e.title}: ${e.status}. Origem: ${e.file}${e.line ? `, linha ${e.line}` : ""}.`).join("\n\n") : "O caso fixo não contém red flags. Isso não confirma solvência."}\n\n${a.override ? `Regra de sobrescrita: ${a.override}.` : "Não há gatilho de sobrescrita confirmado para esta operação."}\n\nRecomendo revisar as modalidades e a atualidade das evidências antes de registrar a decisão.`;
    else
      response =
        "Esta conversa está em modo de demonstração e usa respostas locais sobre a operação selecionada. Posso explicar os sinais, comparar modalidades ou mostrar o que falta validar.\n\nNa integração, sua mensagem e o contexto serão enviados ao backend, que chamará o agente. Nenhuma mensagem foi enviada a um serviço externo.";
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      text: response,
      date: new Date().toISOString(),
      evidenceIds: client.evidence.map((e) => e.id),
    };
  },
};

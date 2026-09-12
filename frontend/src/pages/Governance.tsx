import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Modal,
  Select,
  Table,
  Tabs,
} from "@mantine/core";
import {
  ArrowRight,
  Download,
  GitBranch,
  Info,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  DemoNote,
  Empty,
  PageHeading,
  Panel,
  RatingBadge,
} from "../components/common";
import { useStore } from "../services/store-context";
import { clients } from "../services/gateway";
import {
  defaultOperation,
  PILLARS,
  POLICY_LABELS,
  sensitivity,
  WEIGHTS,
} from "../domain/risk";
import type { Policy } from "../domain/types";
import { dateTime, download } from "../domain/format";
export function Governance() {
  const store = useStore();
  const [params] = useSearchParams();
  const [clientId, setClientId] = useState("33444555000103");
  const [reset, setReset] = useState(false);
  const c = clients.find((c) => c.id === clientId)!;
  const checks = sensitivity(c, defaultOperation(c, "project-v02"));
  return (
    <div className="page">
      <PageHeading
        eyebrow="CONFIANÇA POR CONSTRUÇÃO"
        title="Políticas e auditoria"
        description="Regras visíveis, versões identificáveis e decisões com responsável."
      />
      <Tabs defaultValue={params.get("tab") || "politicas"}>
        <Tabs.List>
          <Tabs.Tab value="politicas">Política de risco</Tabs.Tab>
          <Tabs.Tab value="sensibilidade">Sensibilidade</Tabs.Tab>
          <Tabs.Tab value="auditoria">Trilha de auditoria</Tabs.Tab>
          <Tabs.Tab value="integracao">Integração e roadmap</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="politicas" pt="lg">
          <Alert
            color="orange"
            icon={<Info size={19} />}
            title="Duas versões, uma divergência explícita"
          >
            O documento atualizado define pilares e cortes A ≥ 800, B ≥ 600, C ≥
            400. O Python v4 usa multiplicadores logarítmicos e cortes 800 / 650
            / 500. A equipe precisa alinhar o contrato antes da integração.
          </Alert>
          <div className="policy-selector">
            <div>
              <b>Política da demonstração</b>
              <p>
                Altera as simulações da carteira. Análises já salvas preservam
                sua versão.
              </p>
            </div>
            <Select
              aria-label="Política de demonstração"
              w={290}
              value={store.data.policy}
              data={Object.entries(POLICY_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              onChange={(v) => {
                if (v) {
                  store.setPolicy(v as Policy);
                  store.addAudit({
                    clientId: "workspace",
                    action: "Política da demonstração alterada",
                    detail: POLICY_LABELS[v as Policy],
                    actor: "Ana Costa · demo",
                    policy: v as Policy,
                  });
                }
              }}
            />
          </div>
          <div className="policy-grid">
            <Panel
              title="Projeto v0.2"
              description="Referência: solucao.md · pilares e regras propostos"
              action={
                <Badge color="teal" variant="light">
                  Documento atualizado
                </Badge>
              }
            >
              <div className="weight-list">
                {PILLARS.map((p, i) => (
                  <div key={p}>
                    <span>{p}</span>
                    <b>{WEIGHTS[i]}%</b>
                    <div>
                      <span style={{ width: `${WEIGHTS[i] * 2}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <DemoNote>
                O frontend usa índices de risco fictícios de 0 a 100. Fórmula
                demonstrativa: 1000 − soma(peso × índice ÷ 10). Essa fórmula não
                está implementada no agente.
              </DemoNote>
            </Panel>
            <Panel
              title="Agente v4"
              description="Compatibilidade com consultar_red_flags.py"
            >
              <p className="panel-paragraph">
                O v4 aplica pontos = −(100 / ln 2) × ln(multiplicador), conforme
                os subcampos de cada sinal. Os multiplicadores são hipóteses de
                especialista, sem PD calibrada.
              </p>
              <div className="penalty-list">
                {clients.slice(0, 4).map((client) => (
                  <div key={client.id}>
                    <span>{client.name} · prazo</span>
                    <b>
                      {client.agentAssessments.prazo.score} /{" "}
                      {client.agentAssessments.prazo.rating}
                    </b>
                  </div>
                ))}
              </div>
              <DemoNote>
                Resultados pré-calculados com o Python do repositório:
                finalidade produção, sem parâmetros agronômicos. Nenhuma chamada
                ao agente ocorre no navegador.
              </DemoNote>
            </Panel>
          </div>
          <Panel
            title="Faixas e regras de sobrescrita"
            description="O LLM não determina o score"
          >
            <div className="table-scroll">
              <Table horizontalSpacing="md" verticalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Rating</Table.Th>
                    <Table.Th>Projeto v0.2</Table.Th>
                    <Table.Th>Agente v4</Table.Th>
                    <Table.Th>Condição proposta</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {[
                    [
                      "A",
                      "800–1000",
                      "800–1000",
                      "Política padrão, com capacidade e documentação",
                    ],
                    ["B", "600–799", "650–799", "Prazo e garantia a revisar"],
                    [
                      "C",
                      "400–599",
                      "500–649",
                      "Revisão de modalidade e estrutura",
                    ],
                    [
                      "D",
                      "0–399",
                      "0–499",
                      "Revisão por crédito/jurídico; priorizar à vista",
                    ],
                  ].map((r) => (
                    <Table.Tr key={r[0]}>
                      {r.map((x) => (
                        <Table.Td key={x}>{x}</Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
            <p className="panel-paragraph">
              No mock do projeto, RJ e embargo confirmado no lastro de
              barter/CPR limitam o resultado a D. Corte de protesto e vínculos
              societários não são ativados: faltam limiares e confirmação dos
              dados. NC representa cobertura insuficiente.
            </p>
          </Panel>
        </Tabs.Panel>
        <Tabs.Panel value="sensibilidade" pt="lg">
          <Panel
            title="Sensibilidade dos pesos"
            description="Cada peso varia ±10 pontos percentuais; os demais são redistribuídos proporcionalmente para manter 100%."
            action={
              <Select
                w={260}
                searchable
                aria-label="Cliente do teste de sensibilidade"
                value={clientId}
                onChange={(v) => setClientId(v || c.id)}
                data={clients.map((c) => ({ value: c.id, label: c.name }))}
              />
            }
          >
            <Alert
              color={checks.some((c) => c.changed) ? "orange" : "teal"}
              mb="md"
            >
              {checks.some((c) => c.changed)
                ? "O rating muda em pelo menos uma variação. Revisar a robustez da política antes de usá-la em produção."
                : "O rating se mantém neste cenário. Isso não comprova validade estatística ou estabilidade da carteira inteira."}
            </Alert>
            <div className="table-scroll">
              <Table horizontalSpacing="md" verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Pilar</Table.Th>
                    <Table.Th>Variação</Table.Th>
                    <Table.Th>Score</Table.Th>
                    <Table.Th>Rating</Table.Th>
                    <Table.Th>Mudou?</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {checks.map((x) => (
                    <Table.Tr key={x.pillar + x.delta}>
                      <Table.Td>{x.pillar}</Table.Td>
                      <Table.Td>
                        {x.delta > 0 ? "+" : ""}
                        {x.delta} p.p.
                      </Table.Td>
                      <Table.Td>{x.score ?? "—"}</Table.Td>
                      <Table.Td>
                        <RatingBadge rating={x.rating} />
                      </Table.Td>
                      <Table.Td>{x.changed ? "Sim" : "Não"}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
            <DemoNote>
              Pesos e entradas de risco da simulação não estimam PD. Regras
              críticas podem manter D mesmo quando a média muda.
            </DemoNote>
          </Panel>
        </Tabs.Panel>
        <Tabs.Panel value="auditoria" pt="lg">
          <Panel
            title="Ações registradas"
            description="Persistência local deste navegador · não equivale a uma trilha de produção"
            action={
              <Button
                size="xs"
                variant="default"
                leftSection={<Download size={14} />}
                onClick={() =>
                  download(
                    "auditoria-demo.json",
                    JSON.stringify(
                      { demo: true, entries: store.data.audit },
                      null,
                      2,
                    ),
                  )
                }
              >
                Exportar trilha
              </Button>
            }
          >
            {store.data.audit.length ? (
              <div className="audit-list">
                {store.data.audit.map((e) => (
                  <article key={e.id}>
                    <div className="audit-dot" />
                    <div>
                      <b>{e.action}</b>
                      <p>{e.detail}</p>
                      <small>
                        {clients.find((c) => c.id === e.clientId)?.name ||
                          "Workspace"}{" "}
                        · {e.actor} · {dateTime(e.date)} · {e.policy}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title="Sua trilha começa com a primeira revisão"
                description="Gere uma análise, registre um parecer ou trate um alerta para ver as ações aqui."
              />
            )}
          </Panel>
          <Button
            mt="md"
            color="gray"
            variant="subtle"
            leftSection={<RotateCcw size={14} />}
            onClick={() => setReset(true)}
          >
            Restaurar dados da demonstração
          </Button>
        </Tabs.Panel>
        <Tabs.Panel value="integracao" pt="lg">
          <Panel
            title="Como o frontend se conecta"
            description="A fronteira de integração fica no backend, sem credenciais IBM no navegador"
          >
            <div className="architecture-flow">
              {[
                "Web · cliente + operação",
                "Backend · autenticação",
                "Orchestrate · coleta e score",
                "Sintetizador · explicação",
                "Relatório · revisão humana",
              ].map((x, i) => (
                <div key={x}>
                  <ShieldCheck size={20} />
                  <b>{x}</b>
                  {i < 4 && <ArrowRight size={16} />}
                </div>
              ))}
            </div>
            <DemoNote>
              Implementado aqui: frontend, gateway local e contratos TypeScript.
              Não implementado: autenticação real, consultas oficiais, streaming
              IBM e auditoria de servidor.
            </DemoNote>
            <p className="panel-paragraph">
              O agente v4 retorna texto e recebe identificador, modalidade,
              finalidade e campos agronômicos opcionais. Valor, prazo, garantia,
              evidências estruturadas e versões precisam ser incorporados ao
              contrato do backend. O guia de integração em docs detalha a
              proposta.
            </p>
          </Panel>
          <div className="roadmap-grid">
            {[
              [
                "0–30 dias",
                "Fundação",
                "Inventário da carteira, identificadores e política formal.",
              ],
              [
                "31–90 dias",
                "Modo sombra",
                "Dados internos e relatórios em paralelo à decisão atual.",
              ],
              [
                "3–6 meses",
                "Piloto controlado",
                "Segmento limitado, revisão humana e métricas de qualidade.",
              ],
              [
                "6–12 meses",
                "Escala",
                "Novas fontes, revalidação e expansão conforme evidências.",
              ],
            ].map(([period, title, description]) => (
              <section className="roadmap-card" key={period}>
                <GitBranch size={19} />
                <small>{period}</small>
                <h3>{title}</h3>
                <p>{description}</p>
              </section>
            ))}
          </div>
          <Alert color="teal" icon={<Info size={17} />} mt="lg">
            Fidelidade de texto ao contexto não prova veracidade da fonte.
            Atualidade, cobertura e rastreabilidade continuam sendo requisitos
            separados.
          </Alert>
        </Tabs.Panel>
      </Tabs>
      <Modal
        opened={reset}
        onClose={() => setReset(false)}
        title="Restaurar a demonstração"
        centered
      >
        <p>
          Isso apaga apenas conversas, análises e pareceres salvos neste
          navegador. Os CSVs e o código permanecem intactos.
        </p>
        <Button
          color="red"
          fullWidth
          onClick={() => {
            store.reset();
            setReset(false);
          }}
        >
          Apagar histórico local e restaurar
        </Button>
      </Modal>
    </div>
  );
}

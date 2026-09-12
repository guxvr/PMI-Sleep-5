import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  SegmentedControl,
  Select,
  Tabs,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Download,
  FileCheck,
  GitBranch,
  Info,
  MessageSquare,
  Plus,
  Printer,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { clients, dataset, gateway } from "../services/gateway";
import { useStore } from "../services/store-context";
import {
  assess,
  defaultOperation,
  MODALITIES,
  PILLARS,
  POLICY_LABELS,
  recommend,
  WEIGHTS,
} from "../domain/risk";
import type { Analysis, Client, Modality, Operation } from "../domain/types";
import { compactMoney, currency, dateTime, download } from "../domain/format";
import {
  ClientAvatar,
  ClientTable,
  Delta,
  DemoNote,
  Empty,
  EvidenceCard,
  Panel,
  RatingBadge,
} from "../components/common";
import { PrintReport } from "../components/PrintReport";
import { AnalysisModal } from "../components/AnalysisModal";
export function Report() {
  const { id, analysisId } = useParams();
  const { data } = useStore();
  const saved = data.analyses.find((a) => a.id === analysisId);
  if (saved && !POLICY_LABELS[saved.operation.policy])
    return (
      <div className="page">
        <Empty
          title="Versão anterior da política"
          description="Esta análise usa uma versão antiga do mock. Gere uma nova análise para usar a política atual; o registro anterior permanece no histórico local."
        />
      </div>
    );
  const client = clients.find(
    (c) => c.id === (saved?.operation.clientId || id),
  );
  if (analysisId && !saved)
    return (
      <div className="page">
        <Empty
          title="Análise não encontrada nesta sessão"
          description="As análises do mock são salvas neste navegador. Abra um cliente ou gere uma nova análise."
        />
      </div>
    );
  if (!client)
    return (
      <div className="page">
        <Empty
          title="Informação insuficiente"
          description={`O identificador ${saved?.operation.clientId || id || ""} não consta na base local. Nenhum rating de baixo risco foi atribuído.`}
          action={
            <Button component="a" href="/carteira">
              Voltar à carteira
            </Button>
          }
        />
        {saved && (
          <DemoNote>
            Resultado NC. Consulta simulada em {dateTime(saved.createdAt)}. Não
            houve consulta externa.
          </DemoNote>
        )}
      </div>
    );
  return (
    <ReportBody key={saved?.id || client.id} client={client} saved={saved} />
  );
}
function ReportBody({
  client: c,
  saved,
}: {
  client: Client;
  saved?: Analysis;
}) {
  const store = useStore();
  const nav = useNavigate();
  const [op, setOp] = useState<Operation>(
    saved?.operation || defaultOperation(c, store.data.policy),
  );
  const [newAnalysis, setNewAnalysis] = useState(false);
  const [review, setReview] = useState(false);
  const [decision, setDecision] = useState<string | null>(
    "Acompanhar recomendação",
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const a = assess(c, op);
  const recs = recommend(c, op, a);
  const audit = store.data.audit.filter((e) => e.clientId === c.id);
  const changed =
    saved && JSON.stringify(op) !== JSON.stringify(saved.operation);
  const previous = a.score === null ? null : Math.min(1000, a.score - c.change);
  async function save() {
    setSaving(true);
    try {
      const result = await gateway.analyze(op);
      store.addAnalysis(result);
      store.addAudit({
        clientId: c.id,
        action: "Simulação registrada",
        detail: `${MODALITIES[op.modality]} · ${currency(op.amount)} · ${op.term} dias.`,
        actor: "Ana Costa · demo",
        policy: op.policy,
        analysisId: result.id,
      });
      nav(`/analises/${result.id}`);
    } catch {
      notifications.show({
        title: "Falha ao salvar",
        message: "A simulação não foi registrada. Tente novamente.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  }
  async function reviewSubmit() {
    if (reason.trim().length < 20) {
      setError("Explique o parecer com pelo menos 20 caracteres.");
      return;
    }
    setSaving(true);
    try {
      // The review must refer to the exact operation being shown, never an older version.
      const reviewed = !saved || changed ? await gateway.analyze(op) : saved;
      if (reviewed !== saved) store.addAnalysis(reviewed);
      store.addAudit({
        clientId: c.id,
        action: decision || "Parecer registrado",
        detail: `${MODALITIES[op.modality]} · ${currency(op.amount)} · ${op.term} dias · rating ${a.rating}. ${reason.trim()}`,
        actor: "Ana Costa · demo",
        policy: op.policy,
        analysisId: reviewed.id,
      });
      setReview(false);
      setReason("");
      setError("");
      notifications.show({
        title: "Parecer registrado",
        message:
          "Salvo na trilha local. Nenhuma condição comercial foi alterada.",
        color: "teal",
      });
      if (reviewed !== saved) nav(`/analises/${reviewed.id}`);
    } catch {
      setError(
        "Não foi possível registrar o parecer. Sua justificativa foi preservada.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page report-page">
      <PrintReport
        client={c}
        operation={op}
        assessment={a}
        recommendations={recs}
        saved={changed ? undefined : saved}
      />
      <div className="report-breadcrumb no-print">
        <button onClick={() => nav("/carteira")}>
          <ArrowLeft size={14} /> Carteira de clientes
        </button>
        <ChevronRight size={12} />
        <span>Análise de operação</span>
      </div>
      <div className="client-heading">
        <ClientAvatar client={c} />
        <div>
          <div className="eyebrow">RELATÓRIO DE RISCO DE CRÉDITO</div>
          <h1>{c.name}</h1>
          <p>
            {c.cnpj} <span>·</span> {c.state} <span>·</span> {c.segment}{" "}
            <span>·</span> {c.crop}
          </p>
        </div>
        <div className="client-heading-actions no-print">
          <Button
            variant="default"
            leftSection={<Printer size={15} />}
            onClick={() => window.print()}
          >
            Imprimir / PDF
          </Button>
          <Button
            leftSection={<Plus size={15} />}
            onClick={() => setNewAnalysis(true)}
          >
            Nova operação
          </Button>
        </div>
      </div>
      <div className="operation-context">
        <div>
          <span>OPERAÇÃO EM ANÁLISE</span>
          <b>{currency(op.amount)}</b>
          <small>
            {op.term} dias · garantia:{" "}
            {op.guarantee === "alienacao"
              ? "alienação fiduciária"
              : op.guarantee}
          </small>
        </div>
        <div className="operation-switch">
          <label>Simular modalidade</label>
          <SegmentedControl
            value={op.modality}
            onChange={(value) => setOp({ ...op, modality: value as Modality })}
            data={Object.entries(MODALITIES).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </div>
        <Button
          className="no-print"
          variant="light"
          size="xs"
          onClick={save}
          loading={saving}
        >
          {!saved || changed ? "Salvar simulação" : "Registrar nova versão"}
        </Button>
      </div>
      {a.override && (
        <Alert
          className="override-alert"
          color="red"
          icon={<ShieldAlert size={19} />}
          title="Regra crítica aplicada"
        >
          {a.override}. O score-base era {a.baseScore}; a política do projeto
          limita o resultado a D. O cenário exige revisão humana.
        </Alert>
      )}
      {a.rating === "NC" && (
        <Alert color="gray" icon={<Info size={18} />}>
          Cobertura insuficiente para concluir uma classificação de risco.
        </Alert>
      )}
      <div className="report-kpis">
        <section className="score-card">
          <div className="score-top">
            <span>Score da operação</span>
            <RatingBadge rating={a.rating} />
          </div>
          <div className="score-number">
            {a.score ?? "—"}
            <span>/1000</span>
          </div>
          <div className="score-scale">
            <span style={{ left: `${a.score === null ? 0 : a.score / 10}%` }} />
          </div>
          <div className="score-labels">
            <span>Crítico</span>
            <span>Baixo risco</span>
          </div>
          <div className="score-foot">
            {previous !== null && <Delta value={(a.score ?? 0) - previous} />}
            <small>vs. referência fictícia anterior</small>
          </div>
        </section>
        <section className="report-exposure">
          <span>EXPOSIÇÃO COM O CLIENTE</span>
          <strong>{compactMoney(c.exposure)}</strong>
          <div>
            <i className="key-green" />
            <span>Com estrutura de garantia</span>
            <b>{currency(c.exposure * c.securedRatio)}</b>
          </div>
          <div>
            <i className="key-sage" />
            <span>Sujeita / a validar</span>
            <b>{currency(c.exposure * (1 - c.securedRatio))}</b>
          </div>
          <p>
            Somatório demonstrativo de recebíveis. Garantias sujeitas à revisão
            jurídica.
          </p>
        </section>
        <section className="report-next">
          <span className="eyebrow">PRÓXIMO PASSO</span>
          <ShieldCheck size={22} />
          <h3>{recs.find((r) => r.modality === op.modality)?.title}</h3>
          <p>{recs.find((r) => r.modality === op.modality)?.reason}</p>
          <Button
            className="no-print"
            variant="subtle"
            size="compact-sm"
            rightSection={<ArrowRight size={15} />}
            onClick={() => setReview(true)}
          >
            Registrar parecer
          </Button>
        </section>
      </div>
      <Tabs defaultValue="overview" className="report-tabs">
        <Tabs.List>
          <Tabs.Tab value="overview">Visão da operação</Tabs.Tab>
          <Tabs.Tab value="evidence">
            Evidências{" "}
            <Badge size="xs" color="gray" ml={5}>
              {c.evidence.length}
            </Badge>
          </Tabs.Tab>
          <Tabs.Tab value="group">Grupo e exposição</Tabs.Tab>
          <Tabs.Tab value="history">
            Histórico de revisão{" "}
            <Badge size="xs" color="gray" ml={5}>
              {audit.length}
            </Badge>
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="overview" pt="lg">
          <div className="report-columns">
            <div>
              <Panel
                title="Como continuar negociando"
                description="Alternativas para esta operação · decisão final do analista"
              >
                <div className="recommendation-matrix">
                  {recs.map((r) => (
                    <article
                      key={r.modality}
                      className={`recommendation ${r.modality === op.modality ? "current" : ""}`}
                    >
                      <div className="recommendation-header">
                        <strong>{MODALITIES[r.modality]}</strong>
                        <Badge
                          size="xs"
                          color={
                            r.status === "adequada"
                              ? "teal"
                              : r.status === "condicionada"
                                ? "orange"
                                : "red"
                          }
                          variant="light"
                        >
                          {r.status === "adequada"
                            ? "A avaliar"
                            : r.status === "condicionada"
                              ? "Condicionada"
                              : "Desaconselhada"}
                        </Badge>
                      </div>
                      <h3>{r.title}</h3>
                      <p>{r.reason}</p>
                      <div className="guarantee">
                        <ShieldCheck size={13} />
                        {r.guarantee}
                      </div>
                      {r.modality === op.modality && (
                        <small className="selected-modality">
                          Modalidade selecionada
                        </small>
                      )}
                    </article>
                  ))}
                </div>
              </Panel>
              <Panel
                title="Sinais e evidências"
                description="O fato, sua origem e o que ainda precisa ser validado"
              >
                {c.evidence.length ? (
                  c.evidence
                    .slice(0, 3)
                    .map((e) => <EvidenceCard key={e.id} evidence={e} />)
                ) : (
                  <div className="no-findings">
                    <CheckCircle2 size={23} />
                    <div>
                      <h3>Sem red flags neste caso fixo</h3>
                      <p>
                        Ausência de achados no roteiro não comprova solvência ou
                        cobertura de todas as fontes.
                      </p>
                    </div>
                  </div>
                )}
                {c.earlySignal && (
                  <DemoNote>
                    Sinal antecedente ilustrativo: {c.earlySignal}. A fonte
                    processual/societária ainda não está conectada.
                  </DemoNote>
                )}
              </Panel>
            </div>
            <div>
              <Panel
                title="Composição do score"
                description={POLICY_LABELS[op.policy]}
              >
                {op.policy === "project-v02" ? (
                  <div className="pillar-list">
                    {PILLARS.map((p, i) => (
                      <div key={p}>
                        <div>
                          <span>{p}</span>
                          <b>{WEIGHTS[i]}%</b>
                        </div>
                        <div className="pillar-track">
                          <span style={{ width: `${c.risks[i]}%` }} />
                        </div>
                        <small>
                          Risco simulado {c.risks[i]}/100 ·{" "}
                          {a.rules[i]?.points ?? "—"} pts
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="legacy-rules">
                    {a.rules.map((r) => (
                      <div key={r.label}>
                        <span>{r.label}</span>
                        <b>{r.points}</b>
                      </div>
                    ))}
                  </div>
                )}
                <DemoNote>
                  {op.policy === "project-v02"
                    ? "Pesos do documento atualizado; entradas por pilar são fictícias. Modelo sem PD calibrada."
                    : "Snapshot do motor Python v4: finalidade produção, sem parâmetros agro. Consulte a política e seus limites."}
                </DemoNote>
              </Panel>
              <section className="report-agent">
                <MessageSquare size={23} />
                <h3>Explore a recomendação</h3>
                <p>
                  Converse com o assistente usando este cliente e esta operação
                  como contexto.
                </p>
                <Button
                  fullWidth
                  variant="light"
                  rightSection={<ArrowRight size={14} />}
                  onClick={() =>
                    nav(
                      `/agente?cliente=${c.id}&modalidade=${op.modality}&valor=${op.amount}&prazo=${op.term}&garantia=${op.guarantee}&lastro=${op.linkedArea}&politica=${op.policy}`,
                    )
                  }
                >
                  Perguntar ao assistente
                </Button>
                <small>Respostas locais de demonstração</small>
              </section>
              <div className="version-note">
                <b>Rastreabilidade</b>
                <span>{POLICY_LABELS[op.policy]}</span>
                <span>
                  Base local: {dataset.asOf.split("-").reverse().join("/")}
                </span>
                <span>
                  {saved
                    ? `Análise: ${saved.id.slice(0, 8)}`
                    : "Simulação não registrada"}
                </span>
              </div>
            </div>
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="evidence" pt="lg">
          <Panel title="Evidências disponíveis" description={c.sourceNote}>
            {c.evidence.length ? (
              c.evidence.map((e) => <EvidenceCard key={e.id} evidence={e} />)
            ) : (
              <Empty
                title="Sem evidências neste caso fixo"
                description="O fixture não inclui red flags. Confirme a cobertura antes de tomar uma decisão."
              />
            )}
            <DemoNote>
              Data de evento não é data de coleta. Os mocks não fornecem carimbo
              de coleta oficial; a importação local não torna o registro atual.
            </DemoNote>
          </Panel>
        </Tabs.Panel>
        <Tabs.Panel value="group" pt="lg">
          <Panel
            title={c.group}
            description="Vínculos de grupo simulados; não inferidos dos CSVs"
          >
            <div className="group-note">
              <GitBranch size={22} />
              <p>
                O QSA e a confirmação de vínculos econômicos serão fornecidos
                pelo backend. Ter um sócio em comum não basta para atribuir
                obrigações ou riscos automaticamente.
              </p>
            </div>
            {c.group === "Independente" ? (
              <ClientTable clients={[c]} policy={op.policy} />
            ) : (
              <ClientTable
                clients={clients.filter((x) => x.group === c.group)}
                policy={op.policy}
              />
            )}
          </Panel>
        </Tabs.Panel>
        <Tabs.Panel value="history" pt="lg">
          <Panel
            title="Trilha de revisão"
            description="Ações registradas neste navegador, com política e responsável"
          >
            {audit.length ? (
              <div className="audit-list">
                {audit.map((e) => (
                  <article key={e.id}>
                    <div className="audit-dot" />
                    <div>
                      <b>{e.action}</b>
                      <p>{e.detail}</p>
                      <small>
                        {e.actor} · {dateTime(e.date)} · {e.policy}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title="Nenhum parecer registrado"
                description="Registre a análise para iniciar a trilha auditável da demonstração."
                action={
                  <Button variant="light" onClick={() => setReview(true)}>
                    Registrar parecer
                  </Button>
                }
              />
            )}
          </Panel>
        </Tabs.Panel>
      </Tabs>
      <div className="report-actionbar no-print">
        <span>
          <Info size={15} /> Apoio à decisão. Nenhuma operação será executada.
        </span>
        <div>
          <Button
            variant="default"
            leftSection={<Download size={15} />}
            onClick={() =>
              download(
                `relatorio-demo-${c.id}.json`,
                JSON.stringify(
                  {
                    demo: true,
                    client: c,
                    operation: op,
                    assessment: a,
                    recommendations: recs,
                    evidence: c.evidence,
                  },
                  null,
                  2,
                ),
              )
            }
          >
            Exportar JSON
          </Button>
          <Button
            leftSection={<FileCheck size={16} />}
            onClick={() => setReview(true)}
          >
            Registrar parecer
          </Button>
        </div>
      </div>
      {newAnalysis && (
        <AnalysisModal
          open
          onClose={() => setNewAnalysis(false)}
          initialClient={c}
        />
      )}
      <Modal
        opened={review}
        onClose={() => setReview(false)}
        title="Parecer do analista"
        centered
        size="lg"
      >
        <div className="analysis-form">
          <Alert color="teal">
            Registro apenas demonstrativo. Sem efeito em limite ou contrato.
          </Alert>
          <Select
            label="Encaminhamento"
            value={decision}
            onChange={setDecision}
            data={[
              "Acompanhar recomendação",
              "Ajustar condições",
              "Encaminhar ao jurídico",
            ]}
          />
          <Textarea
            label="Justificativa e condições propostas"
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            minRows={4}
            error={error || undefined}
            placeholder="Descreva a evidência revisada, modalidade, prazo e próximos passos."
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setReview(false)}>
              Cancelar
            </Button>
            <Button loading={saving} onClick={reviewSubmit}>
              Salvar parecer
            </Button>
          </Group>
        </div>
      </Modal>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  NumberInput,
  Select,
  Textarea,
  Tooltip,
} from "@mantine/core";
import {
  ArrowRight,
  ArrowUp,
  CheckCheck,
  FileText,
  MessageSquarePlus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  ClientAvatar,
  DemoNote,
  EvidenceCard,
  PageHeading,
  RatingBadge,
} from "../components/common";
import {
  clients,
  gateway,
  getAgentStatus,
  chatWithWatsonx,
  type AgentStatus,
} from "../services/gateway";
import { useStore } from "../services/store-context";
import {
  assess,
  defaultOperation,
  MODALITIES,
  POLICY_LABELS,
} from "../domain/risk";
import type { ChatMessage, Modality, Operation } from "../domain/types";
import { currency } from "../domain/format";
export function Chat() {
  const [params] = useSearchParams();
  const initial =
    clients.find((c) => c.id === params.get("cliente")) || clients[2];
  const [clientId, setClientId] = useState(initial.id);
  const c = clients.find((x) => x.id === clientId) || initial;
  const store = useStore();
  const paramMod = params.get("modalidade");
  const [modality, setModality] = useState<Modality>(
    paramMod && paramMod in MODALITIES ? (paramMod as Modality) : "prazo",
  );
  const [amount, setAmount] = useState<number | string>(
    Number(params.get("valor")) > 0 ? Number(params.get("valor")) : 180000,
  );
  const [term, setTerm] = useState<number | string>(
    Number(params.get("prazo")) > 0 ? Number(params.get("prazo")) : 120,
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"mock" | "watsonx">(() => {
    try {
      return localStorage.getItem("krill-chat-provider") === "mock"
        ? "mock"
        : "watsonx";
    } catch {
      return "watsonx";
    }
  });
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [statusError, setStatusError] = useState("");
  async function refreshStatus() {
    try {
      setAgentStatus(await getAgentStatus());
      setStatusError("");
    } catch {
      setStatusError(
        "Backend indisponível. Inicie a API para conversar com o watsonx.",
      );
    }
  }
  useEffect(() => {
    void refreshStatus();
  }, []);
  const [evidence, setEvidence] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const policyParam = params.get("politica");
  const policy =
    policyParam === "project-v02" || policyParam === "agent-v04"
      ? policyParam
      : store.data.policy;
  const op: Operation = {
    ...defaultOperation(c, policy),
    guarantee:
      clientId === initial.id ? params.get("garantia") || "penhor" : "penhor",
    linkedArea:
      clientId === initial.id && params.has("lastro")
        ? params.get("lastro") === "true"
        : c.embargoConfirmed,
    modality,
    amount: Number(amount),
    term: Number(term),
  };
  const a = assess(c, op);
  const contextKey = `${clientId}:${modality}:${amount}:${term}:${op.policy}:${op.guarantee}:${op.linkedArea}`;
  const key = mode === "watsonx" ? `watsonx:${contextKey}` : contextKey;
  const messages = store.data.chats[key] || [];
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, busy]);
  async function send(prompt = input) {
    if (!prompt.trim() || busy) return;
    if (mode === "watsonx" && (!agentStatus?.configured || statusError)) {
      setError(
        statusError ||
          agentStatus?.message ||
          "Aguarde a verificação da configuração do agente.",
      );
      return;
    }
    if (
      !Number.isFinite(op.amount) ||
      op.amount <= 0 ||
      !Number.isInteger(op.term) ||
      op.term < 1
    ) {
      setError("Preencha valor e prazo válidos no contexto da operação.");
      return;
    }
    setError("");
    const user: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: prompt.trim(),
      date: new Date().toISOString(),
    };
    const current = [...messages, user];
    store.setChat(key, current);
    setInput("");
    setBusy(true);
    try {
      const response =
        mode === "watsonx"
          ? await chatWithWatsonx(c, op, prompt, messages)
          : await gateway.chat(c, op, prompt);
      store.setChat(key, [...current, response]);
      if (mode === "watsonx") void refreshStatus();
    } catch (err) {
      setInput(prompt);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível obter a resposta. Sua pergunta foi preservada.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <PageHeading
        eyebrow="CONVERSA COM CONTEXTO"
        title="Assistente de risco"
        description="Das evidências às alternativas de negociação, em uma conversa."
        actions={
          <Button
            variant="default"
            leftSection={<MessageSquarePlus size={16} />}
            disabled={busy || messages.length === 0}
            onClick={() => store.setChat(key, [])}
          >
            Nova conversa
          </Button>
        }
      />
      <Alert
        color={
          mode === "watsonx"
            ? statusError || !agentStatus?.configured
              ? "yellow"
              : "teal"
            : "gray"
        }
        mb="md"
        title={
          mode === "watsonx"
            ? "Conversa com o agente publicado no watsonx"
            : "Conversa de demonstração local"
        }
      >
        {mode === "watsonx"
          ? statusError ||
            (agentStatus?.lastSuccess
              ? `Última resposta recebida do agente: ${new Date(agentStatus.lastSuccess).toLocaleString("pt-BR")}.`
              : agentStatus?.message || "Verificando configuração…")
          : "As respostas deste modo são simuladas e não consultam a IBM."}{" "}
        O score lateral e o dashboard continuam sendo simulações locais; o
        parecer remoto aparece na conversa.
        <Button
          size="compact-xs"
          variant="subtle"
          onClick={refreshStatus}
          disabled={busy}
        >
          Atualizar conexão
        </Button>
      </Alert>
      <div className="chat-layout">
        <aside className="chat-context">
          <div className="chat-context-heading">
            <span>CONTEXTO DA OPERAÇÃO</span>
            <ShieldCheck size={16} />
          </div>
          <Select
            label="Origem da resposta"
            value={mode}
            disabled={busy}
            allowDeselect={false}
            onChange={(value) => {
              setMode(value === "mock" ? "mock" : "watsonx");
              try {
                localStorage.setItem(
                  "krill-chat-provider",
                  value === "mock" ? "mock" : "watsonx",
                );
              } catch {
                /* Private browsing can disable storage. */
              }
              setError("");
            }}
            data={[
              { value: "watsonx", label: "watsonx · agente publicado" },
              { value: "mock", label: "Demonstração local" },
            ]}
          />
          <Select
            label="Cliente"
            searchable
            value={clientId}
            disabled={busy}
            onChange={(v) => {
              setClientId(v || initial.id);
              setEvidence(null);
            }}
            data={clients.map((c) => ({ value: c.id, label: c.name }))}
          />
          <div className="chat-client">
            <ClientAvatar client={c} />
            <div>
              <b>{c.name}</b>
              <small>{c.cnpj}</small>
            </div>
          </div>
          <div className="chat-score">
            <RatingBadge rating={a.rating} />
            <strong>
              {a.score ?? "—"}
              <small>/1000</small>
            </strong>
          </div>
          <Select
            label="Modalidade"
            disabled={busy}
            value={modality}
            onChange={(v) => setModality(v as Modality)}
            data={Object.entries(MODALITIES).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <NumberInput
            label="Valor da operação"
            prefix="R$ "
            thousandSeparator="."
            decimalSeparator=","
            value={amount}
            onChange={setAmount}
            disabled={busy}
            min={0}
          />
          <NumberInput
            label="Prazo (dias)"
            value={term}
            onChange={setTerm}
            disabled={busy}
            min={1}
            allowDecimal={false}
          />
          <DemoNote>
            {POLICY_LABELS[op.policy]} · Garantia:{" "}
            {op.guarantee === "alienacao"
              ? "alienação fiduciária"
              : op.guarantee}
            .{" "}
            {c.embargoConfirmed &&
              `Vínculo do embargo com lastro: ${op.linkedArea ? "simulado" : "não informado"}.`}
          </DemoNote>
          <div className="context-exposure">
            <span>Exposição atual (simulada)</span>
            <b>{currency(c.exposure)}</b>
          </div>
          <div className="chat-evidence">
            <span>EVIDÊNCIAS DISPONÍVEIS</span>
            {c.evidence.map((e) => (
              <button
                key={e.id}
                onClick={() => setEvidence(evidence === e.id ? null : e.id)}
              >
                <FileText size={14} />
                {e.title}
                <ArrowRight size={12} />
              </button>
            ))}
            {!c.evidence.length && <p>Sem red flags no caso fixo.</p>}
          </div>
          <DemoNote>
            Trocar a operação abre seu contexto de conversa próprio.
          </DemoNote>
        </aside>
        <section className="chat-window">
          <header>
            <div className="agent-avatar">
              <Sparkles size={18} />
            </div>
            <div>
              <b>Assistente Krilltech</b>
              <span>
                {mode === "watsonx"
                  ? "Agente publicado · via backend"
                  : "Respostas simuladas · modo local"}
              </span>
            </div>
            <Badge color="teal" variant="light" size="xs">
              {mode === "watsonx" ? "WATSONX" : "MOCK LOCAL"}
            </Badge>
          </header>
          <div className="chat-messages">
            {!messages.length && (
              <div className="chat-welcome">
                <div className="welcome-spark">
                  <Sparkles size={30} />
                </div>
                <h2>Vamos olhar além do score?</h2>
                <p>
                  Use o contexto de <b>{c.name}</b> para entender os sinais e
                  explorar a próxima negociação.
                </p>
                <div className="suggestions">
                  {[
                    "Explique os principais sinais de risco",
                    "Compare as modalidades para esta operação",
                    "O que falta validar antes de negociar?",
                  ].map((t) => (
                    <button key={t} onClick={() => send(t)}>
                      {t}
                      <ArrowRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div className={`message ${m.role}`} key={m.id}>
                {m.role === "assistant" && (
                  <div className="agent-avatar">
                    <Sparkles size={15} />
                  </div>
                )}
                <div>
                  <div
                    className={`message-bubble ${m.provider === "watsonx" ? "agent-markdown" : ""}`}
                  >
                    {m.provider === "watsonx" ? (
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        skipHtml
                        components={{
                          img: () => null,
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {m.text}
                      </Markdown>
                    ) : (
                      m.text
                    )}
                  </div>
                  {m.evidenceIds && m.evidenceIds.length > 0 && (
                    <div className="message-citations">
                      {m.evidenceIds.map((id) => (
                        <button
                          key={id}
                          onClick={() =>
                            setEvidence(evidence === id ? null : id)
                          }
                        >
                          <FileText size={11} />
                          {c.evidence.find((e) => e.id === id)?.title || id}
                        </button>
                      ))}
                    </div>
                  )}
                  <small className="message-date">
                    {m.role === "assistant"
                      ? m.provider === "watsonx"
                        ? "watsonx · agente publicado"
                        : "Resposta simulada"
                      : "Você"}{" "}
                    ·{" "}
                    {new Date(m.date).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {m.role === "user" && <CheckCheck size={12} />}
                  </small>
                </div>
              </div>
            ))}
            {busy && (
              <div className="typing" role="status">
                <Sparkles size={17} />{" "}
                {mode === "watsonx"
                  ? "Consultando o agente no watsonx"
                  : "Preparando resposta simulada"}
                <span>•••</span>
              </div>
            )}
            <div ref={bottom} />
          </div>
          {error && (
            <Alert color="red" mx="md">
              {error}
            </Alert>
          )}
          <div className="chat-compose">
            <Textarea
              aria-label="Mensagem para o assistente"
              placeholder="Pergunte sobre os sinais ou como estruturar a operação…"
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              autosize
              minRows={1}
              maxRows={4}
              disabled={busy}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Tooltip label="Enviar mensagem">
              <ActionIcon
                size={38}
                disabled={busy || !input.trim()}
                aria-label="Enviar mensagem"
                onClick={() => send()}
              >
                <ArrowUp size={20} />
              </ActionIcon>
            </Tooltip>
          </div>
          <div className="chat-disclaimer">
            Enter para enviar · Shift + Enter para nova linha ·{" "}
            {mode === "watsonx"
              ? "Mensagem, histórico e contexto da operação enviados à IBM"
              : "Nenhum dado enviado a serviços externos"}
          </div>
        </section>
      </div>
      {evidence && c.evidence.find((e) => e.id === evidence) && (
        <div className="chat-source-detail">
          <EvidenceCard evidence={c.evidence.find((e) => e.id === evidence)!} />
        </div>
      )}
    </div>
  );
}

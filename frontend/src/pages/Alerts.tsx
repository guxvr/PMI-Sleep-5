import { useState } from "react";
import { Badge, Button, Modal, Select, Textarea } from "@mantine/core";
import { ArrowRight, Bell, Check, Clock, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DemoNote,
  Empty,
  PageHeading,
  RatingBadge,
} from "../components/common";
import { buildAlerts } from "../domain/alerts";
import type { RiskAlert } from "../domain/alerts";
import { assess, defaultOperation } from "../domain/risk";
import { currency } from "../domain/format";
import { clients } from "../services/gateway";
import { useStore } from "../services/store-context";
export function Alerts() {
  const store = useStore();
  const nav = useNavigate();
  const [kind, setKind] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>("Pendente");
  const [selected, setSelected] = useState<RiskAlert | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);
  const all = buildAlerts(clients);
  const visible = all.filter(
    (a) =>
      (!kind || a.kind === kind) &&
      (!status || (store.data.alertStates[a.id] || "Pendente") === status),
  );
  function resolve() {
    if (reason.trim().length < 15) {
      setError(true);
      return;
    }
    if (selected) {
      store.setAlert(selected.id, "Tratado");
      store.addAudit({
        clientId: selected.client.id,
        action: "Alerta tratado",
        detail: `${selected.title}. Parecer: ${reason.trim()}`,
        actor: "Ana Costa · demo",
        policy: store.data.policy,
      });
      setSelected(null);
      setReason("");
      setError(false);
    }
  }
  return (
    <div className="page">
      <PageHeading
        eyebrow="MONITORAMENTO CONTÍNUO"
        title="Central de alertas"
        description="Priorize mudanças relevantes e registre o próximo passo de cada caso."
      />
      <div className="alert-summary">
        {[
          { title: "Críticos", kind: "Crítico", icon: ShieldAlert },
          { title: "Sinais antecedentes", kind: "Antecedente", icon: Bell },
          { title: "Confirmatórios", kind: "Confirmatório", icon: Clock },
        ].map(({ title, kind: k, icon: Icon }) => (
          <button
            key={k}
            onClick={() => setKind(kind === k ? null : k)}
            className={`alert-summary-card ${kind === k ? "selected" : ""}`}
          >
            <Icon size={20} />
            <div>
              <b>
                {
                  all.filter(
                    (a) =>
                      a.kind === k &&
                      (store.data.alertStates[a.id] || "Pendente") ===
                        "Pendente",
                  ).length
                }
              </b>
              <span>{title} pendentes</span>
            </div>
          </button>
        ))}
      </div>
      <DemoNote>
        Antecedentes são cenários adicionais. PGFN e FGTS são confirmatórios e
        não disparam alerta precoce isoladamente. RJ confirmada é um evento
        detectado, não uma previsão.
      </DemoNote>
      <div className="alert-toolbar">
        <Select
          clearable
          placeholder="Todos os tipos"
          aria-label="Tipo de alerta"
          data={["Crítico", "Antecedente", "Confirmatório"]}
          value={kind}
          onChange={setKind}
        />
        <Select
          clearable
          placeholder="Todos os status"
          aria-label="Status do alerta"
          data={["Pendente", "Em análise", "Tratado"]}
          value={status}
          onChange={setStatus}
        />
        <span>{visible.length} alertas</span>
      </div>
      <div className="alert-list">
        {visible.map((a) => (
          <article className="alert-card" key={a.id}>
            <div
              className={`alert-symbol ${a.kind === "Crítico" ? "critical" : "early"}`}
            >
              <ShieldAlert size={21} />
            </div>
            <div className="alert-body">
              <div>
                <Badge
                  color={
                    a.kind === "Crítico"
                      ? "red"
                      : a.kind === "Antecedente"
                        ? "orange"
                        : "gray"
                  }
                  size="xs"
                  variant="light"
                >
                  {a.kind}
                </Badge>
                <span className="muted">{a.source}</span>
              </div>
              <h2>{a.title}</h2>
              <b className="alert-client">{a.client.name}</b>
              <p>{a.description}</p>
              <div className="alert-card-footer">
                <span>
                  Exposição: <b>{currency(a.client.exposure)}</b>
                </span>
                <RatingBadge
                  rating={
                    assess(
                      a.client,
                      defaultOperation(a.client, store.data.policy),
                    ).rating
                  }
                />
                <span>Responsável: crédito · demo</span>
              </div>
            </div>
            <div className="alert-actions">
              <Button
                size="xs"
                variant="light"
                rightSection={<ArrowRight size={13} />}
                onClick={() => nav(`/clientes/${a.client.id}`)}
              >
                Abrir análise
              </Button>
              {store.data.alertStates[a.id] !== "Tratado" && (
                <>
                  <Button
                    size="xs"
                    variant="default"
                    disabled={store.data.alertStates[a.id] === "Em análise"}
                    onClick={() => {
                      store.setAlert(a.id, "Em análise");
                      store.addAudit({
                        clientId: a.client.id,
                        action: "Alerta assumido",
                        detail: a.title,
                        actor: "Ana Costa · demo",
                        policy: store.data.policy,
                      });
                    }}
                  >
                    Assumir revisão
                  </Button>
                  <Button
                    size="xs"
                    variant="subtle"
                    leftSection={<Check size={13} />}
                    onClick={() => setSelected(a)}
                  >
                    Registrar tratamento
                  </Button>
                </>
              )}
              {store.data.alertStates[a.id] === "Tratado" && (
                <Badge color="teal">Tratado</Badge>
              )}
            </div>
          </article>
        ))}
        {!visible.length && (
          <Empty
            title="Nenhum alerta nesta seleção"
            description="Ajuste o tipo ou status para consultar os demais casos."
          />
        )}
      </div>
      <Modal
        title="Registrar tratamento do alerta"
        opened={!!selected}
        onClose={() => {
          setSelected(null);
          setError(false);
        }}
        centered
      >
        <p>{selected?.title}</p>
        <Textarea
          label="Ação realizada e justificativa"
          minRows={4}
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          error={
            error ? "Descreva a ação com pelo menos 15 caracteres." : undefined
          }
          placeholder="Registre o que foi conferido e o próximo passo."
        />
        <Button mt="md" fullWidth onClick={resolve}>
          Salvar tratamento
        </Button>
      </Modal>
    </div>
  );
}

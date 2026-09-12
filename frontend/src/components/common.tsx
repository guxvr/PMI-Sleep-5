import { Badge, Button, Modal, Table, Text, Tooltip } from "@mantine/core";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Database,
  FileText,
  Info,
  Leaf,
  SearchX,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { Client, Evidence, Policy, Rating } from "../domain/types";
import {
  assess,
  defaultOperation,
  MODALITIES,
  RATING_COLORS,
  RATING_LABELS,
} from "../domain/risk";
import { currency, initials } from "../domain/format";
export function RatingBadge({ rating }: { rating: Rating }) {
  return (
    <span className={`rating rating-${rating}`} title={RATING_LABELS[rating]}>
      <i style={{ background: RATING_COLORS[rating] }} />
      {rating} <span>{RATING_LABELS[rating]}</span>
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{actions}</div>
    </div>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Empty({
  title = "Nenhum resultado encontrado",
  description = "Ajuste os filtros para encontrar o que procura.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <SearchX size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <div className="demo-note">
      <Info size={15} />
      <span>{children}</span>
    </div>
  );
}
export function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <Leaf size={23} strokeWidth={2} />
      </div>
      <div>
        <strong>
          krill<span>tech</span>
        </strong>
        <small>CREDIT INTELLIGENCE</small>
      </div>
    </div>
  );
}
export function ClientAvatar({ client }: { client: Client }) {
  return (
    <span className={`client-avatar avatar-${client.state.charCodeAt(0) % 4}`}>
      {initials(client.name)}
    </span>
  );
}
export function Delta({ value }: { value: number }) {
  return (
    <span className={value < 0 ? "delta negative" : "delta"}>
      {value < 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{" "}
      {value > 0 ? "+" : ""}
      {value} pts
    </span>
  );
}
export function ClientTable({
  clients,
  policy,
  compact = false,
}: {
  clients: Client[];
  policy: Policy;
  compact?: boolean;
}) {
  const nav = useNavigate();
  return clients.length ? (
    <div className="table-scroll">
      <Table
        verticalSpacing="md"
        horizontalSpacing="md"
        highlightOnHover
        className="client-table"
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Cliente</Table.Th>
            <Table.Th>Rating / score</Table.Th>
            <Table.Th>Exposição</Table.Th>
            <Table.Th>Modalidade</Table.Th>
            {!compact && <Table.Th>Última revisão</Table.Th>}
            <Table.Th>
              <span className="sr-only">Abrir cliente</span>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {clients.map((c) => {
            const a = assess(c, defaultOperation(c, policy));
            return (
              <Table.Tr key={c.id}>
                <Table.Td>
                  <button
                    className="client-link"
                    onClick={() => nav(`/clientes/${c.id}`)}
                  >
                    <ClientAvatar client={c} />
                    <span>
                      <b>{c.name}</b>
                      <small>
                        {c.state} · {c.segment}
                      </small>
                    </span>
                  </button>
                </Table.Td>
                <Table.Td>
                  <div className="rating-cell">
                    <RatingBadge rating={a.rating} />
                    <small>
                      {a.score ?? "—"}
                      <span> / 1000</span>
                    </small>
                  </div>
                </Table.Td>
                <Table.Td>
                  <b className="money">{currency(c.exposure)}</b>
                </Table.Td>
                <Table.Td>
                  <span className="modality-label">
                    {MODALITIES[c.modality]}
                  </span>
                </Table.Td>
                {!compact && (
                  <Table.Td>
                    <span className="muted">
                      {c.lastReview.split("-").reverse().join("/")}
                    </span>
                  </Table.Td>
                )}
                <Table.Td>
                  <Tooltip label="Abrir análise">
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      aria-label={`Abrir ${c.name}`}
                      onClick={() => nav(`/clientes/${c.id}`)}
                    >
                      <ChevronRight size={17} />
                    </Button>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </div>
  ) : (
    <Empty />
  );
}
export function EvidenceCard({ evidence: e }: { evidence: Evidence }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="evidence-card">
        <div className="evidence-icon">
          <FileText size={19} />
        </div>
        <div className="evidence-content">
          <div className="evidence-title">
            <h3>{e.title}</h3>
            <Badge
              color={e.origin === "csv" ? "teal" : "orange"}
              variant="light"
              size="xs"
            >
              {e.origin === "csv" ? "CSV do projeto" : "Cenário do pitch"}
            </Badge>
          </div>
          <p>{e.description}</p>
          <div className="source-meta">
            <span>
              <Database size={12} /> {e.source.toUpperCase()}
            </span>
            <span>{e.date || "Data não informada"}</span>
            <span>{e.status}</span>
          </div>
        </div>
        <Button variant="subtle" size="xs" onClick={() => setOpen(true)}>
          Ver fonte
        </Button>
      </div>
      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Rastreabilidade da evidência"
        size="lg"
      >
        <Text fw={600} mb="xs">
          {e.title}
        </Text>
        <DemoNote>
          {e.file}
          {e.line ? ` · linha ${e.line}` : " · ocorrência sintética"}
        </DemoNote>
        <Text size="sm" c="dimmed" my="md">
          Registro original do mock. Não houve consulta ao órgão público.
        </Text>
        <pre className="raw-record">{JSON.stringify(e.raw, null, 2)}</pre>
      </Modal>
    </>
  );
}

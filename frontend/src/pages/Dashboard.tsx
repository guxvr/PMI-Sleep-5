import { useState } from "react";
import { Button, Select, Tooltip } from "@mantine/core";
import { AreaChart, DonutChart } from "@mantine/charts";
import {
  ArrowDownToLine,
  ArrowRight,
  BellRing,
  ChartNoAxesCombined,
  ChevronRight,
  Info,
  Plus,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClientTable, PageHeading, Panel } from "../components/common";
import { clients } from "../services/gateway";
import { useStore } from "../services/store-context";
import {
  assess,
  defaultOperation,
  MODALITIES,
  RATING_COLORS,
} from "../domain/risk";
import type { Rating } from "../domain/types";
import { buildAlerts } from "../domain/alerts";
import { compactMoney, currency, download, toCsv } from "../domain/format";
export function Dashboard({ onAnalyze }: { onAnalyze: () => void }) {
  const { data } = useStore();
  const nav = useNavigate();
  const [months, setMonths] = useState<string | null>("6");
  const exposure = clients.reduce((n, c) => n + c.exposure, 0),
    secured = clients.reduce((n, c) => n + c.exposure * c.securedRatio, 0);
  const distribution = (["A", "B", "C", "D", "NC"] as Rating[]).map((name) => ({
    name,
    value: clients.filter(
      (c) => assess(c, defaultOperation(c, data.policy)).rating === name,
    ).length,
    color: RATING_COLORS[name],
  }));
  const critical = clients
    .filter((c) =>
      ["C", "D"].includes(assess(c, defaultOperation(c, data.policy)).rating),
    )
    .reduce((n, c) => n + c.exposure, 0);
  const alerts = buildAlerts(clients).filter(
    (a) => data.alertStates[a.id] !== "Tratado",
  );
  const history = ["Abr", "Mai", "Jun", "Jul", "Ago", "Set"]
    .map((month, i) => ({
      month,
      "Com estrutura de garantia": Math.round(
        secured * [0.63, 0.68, 0.72, 0.83, 0.91, 1][i],
      ),
      "Sujeita / a validar": Math.round(
        (exposure - secured) * [0.8, 0.74, 0.9, 0.87, 0.95, 1][i],
      ),
    }))
    .slice(-Number(months));
  const byModality = Object.entries(MODALITIES).map(([key, label]) => ({
    label,
    value: clients
      .filter((c) => c.modality === key)
      .reduce((n, c) => n + c.exposure, 0),
  }));
  return (
    <div className="page">
      <PageHeading
        eyebrow="PAINEL DA OPERAÇÃO"
        title="Visão geral da carteira"
        description="Acompanhe a exposição e encontre o próximo passo para cada cliente."
        actions={
          <>
            <Button
              variant="default"
              leftSection={<ArrowDownToLine size={16} />}
              onClick={() =>
                download(
                  "carteira-demo.csv",
                  toCsv(
                    clients.map((c) => ({
                      Cliente: c.name,
                      CNPJ: c.cnpj,
                      Exposicao: c.exposure,
                      Modalidade: MODALITIES[c.modality],
                    })),
                  ),
                  "text/csv;charset=utf-8",
                )
              }
            >
              Exportar
            </Button>
            <Button leftSection={<Plus size={17} />} onClick={onAnalyze}>
              Nova análise
            </Button>
          </>
        }
      />
      <div className="metric-grid">
        {[
          {
            label: "Exposição em aberto",
            value: compactMoney(exposure),
            note: "40 clientes na carteira demonstrativa",
            icon: Wallet,
            color: "green",
          },
          {
            label: "Com estrutura de garantia",
            value: compactMoney(secured),
            note: `${Math.round((secured / exposure) * 100)}% da exposição · enquadramento a validar`,
            icon: ShieldCheck,
            color: "sage",
          },
          {
            label: "Exposição em risco C / D",
            value: compactMoney(critical),
            note: "Prioridade para revisão de condições",
            icon: ChartNoAxesCombined,
            color: "amber",
          },
          {
            label: "Alertas pendentes",
            value: String(alerts.length).padStart(2, "0"),
            note: `${alerts.filter((a) => a.kind === "Crítico").length} críticos · ${alerts.filter((a) => a.kind === "Antecedente").length} antecedentes simulados`,
            icon: BellRing,
            color: "rose",
          },
        ].map(({ label, value, note, icon: Icon, color }) => (
          <section className="metric-card" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <div className={`metric-icon ${color}`}>
                <Icon size={19} />
              </div>
            </div>
            <strong>{value}</strong>
            <p>{note}</p>
          </section>
        ))}
      </div>
      <div className="dashboard-charts">
        <Panel
          title="Evolução da exposição"
          description="Recebíveis por estrutura comercial · histórico ilustrativo"
          action={
            <Select
              aria-label="Período do histórico"
              value={months}
              onChange={setMonths}
              data={[
                { value: "3", label: "Últimos 3 meses" },
                { value: "6", label: "Últimos 6 meses" },
              ]}
              w={156}
              size="xs"
            />
          }
        >
          <div className="chart-key">
            <span>
              <i className="key-green" /> Com estrutura de garantia
            </span>
            <span>
              <i className="key-sage" /> Sujeita / a validar
            </span>
          </div>
          <AreaChart
            h={225}
            data={history}
            dataKey="month"
            series={[
              { name: "Com estrutura de garantia", color: "#36785e" },
              { name: "Sujeita / a validar", color: "#c1d4ac" },
            ]}
            type="stacked"
            curveType="monotone"
            withDots={false}
            withLegend={false}
            strokeWidth={2}
            valueFormatter={compactMoney}
            gridAxis="y"
          />
          <div className="chart-foot">
            <Info size={13} /> Garantia não equivale a recuperação assegurada.
            Classificação jurídica a validar.
          </div>
        </Panel>
        <Panel
          title="Perfil de risco"
          description="Distribuição dos clientes por rating"
          action={
            <Tooltip label="Faixas dependem da política selecionada. NC significa informação insuficiente.">
              <Info size={16} className="muted" />
            </Tooltip>
          }
        >
          <div className="donut-wrap">
            <DonutChart
              data={distribution}
              size={168}
              thickness={21}
              withTooltip
              tooltipDataSource="segment"
              paddingAngle={4}
            />
            <div className="donut-center">
              <strong>40</strong>
              <span>clientes</span>
            </div>
          </div>
          <div className="rating-legend">
            {distribution.map((d) => (
              <button
                key={d.name}
                onClick={() => nav(`/carteira?rating=${d.name}`)}
              >
                <span>
                  <i style={{ background: d.color }} />
                  {d.name === "NC" ? "Não conclusivo" : `Rating ${d.name}`}
                </span>
                <b>
                  {d.value}
                  <small>{Math.round((d.value / clients.length) * 100)}%</small>
                </b>
              </button>
            ))}
          </div>
        </Panel>
      </div>
      <div className="dashboard-middle">
        <Panel
          title="Seu radar de atenção"
          description="Sinais que merecem uma revisão agora"
          action={
            <Button
              variant="subtle"
              size="compact-sm"
              rightSection={<ArrowRight size={14} />}
              onClick={() => nav("/alertas")}
            >
              Ver todos
            </Button>
          }
        >
          <div className="priority-list">
            {alerts.slice(0, 3).map((a) => (
              <button
                className="priority-row"
                key={a.id}
                onClick={() => nav(`/clientes/${a.client.id}`)}
              >
                <span
                  className={`priority-dot ${a.kind === "Crítico" ? "critical" : "early"}`}
                />
                <div>
                  <b>{a.title}</b>
                  <span>{a.client.name}</span>
                </div>
                <div className="priority-amount">
                  <b>{currency(a.client.exposure)}</b>
                  <small>{a.kind}</small>
                </div>
                <ChevronRight size={16} />
              </button>
            ))}
            {alerts.length === 0 && (
              <p className="muted">
                Todos os alertas foram tratados na demonstração.
              </p>
            )}
          </div>
        </Panel>
        <section className="assistant-promo">
          <div className="promo-icon">
            <Sparkles size={22} />
          </div>
          <span className="eyebrow">ASSISTENTE DE RISCO</span>
          <h2>
            O contexto certo.
            <br />
            Uma negociação melhor.
          </h2>
          <p>
            Entenda os sinais e compare formas de continuar fazendo negócio.
          </p>
          <Button
            color="white"
            variant="white"
            c="#205c42"
            rightSection={<ArrowRight size={16} />}
            onClick={() => nav("/agente")}
          >
            Conversar com o assistente
          </Button>
          <small>Conversa simulada com contexto da operação</small>
          <div className="promo-orbit" />
        </section>
      </div>
      <div className="dashboard-bottom">
        <Panel
          title="Clientes em destaque"
          description="Uma visão rápida da carteira demonstrativa"
          action={
            <Button
              variant="subtle"
              size="compact-sm"
              onClick={() => nav("/carteira")}
              rightSection={<ArrowRight size={14} />}
            >
              Abrir carteira
            </Button>
          }
        >
          <ClientTable
            clients={clients.slice(0, 4)}
            policy={data.policy}
            compact
          />
        </Panel>
        <Panel
          title="Exposição por modalidade"
          description="Posição atual · valores simulados"
        >
          <div className="modality-bars">
            {byModality.map((m, i) => (
              <div key={m.label}>
                <div>
                  <span>{m.label}</span>
                  <b>{compactMoney(m.value)}</b>
                </div>
                <div className="bar-track">
                  <span
                    style={{
                      width: `${(m.value / exposure) * 100}%`,
                      background: ["#2c755a", "#719c76", "#b1bc88", "#d9bd88"][
                        i
                      ],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="concentration-note">
            <b>
              {Math.round(
                ([...clients]
                  .sort((a, b) => b.exposure - a.exposure)
                  .slice(0, 10)
                  .reduce((n, c) => n + c.exposure, 0) /
                  exposure) *
                  100,
              )}
              %
            </b>
            <p>da exposição está nos 10 maiores clientes do cenário.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

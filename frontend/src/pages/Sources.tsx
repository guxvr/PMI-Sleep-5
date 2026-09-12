import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Loader,
  Modal,
  Pagination,
  Table,
  Tabs,
  TextInput,
} from "@mantine/core";
import { LineChart, BarChart } from "@mantine/charts";
import {
  CloudSun,
  Database,
  Download,
  FileSearch,
  Search,
  ShieldAlert,
} from "lucide-react";
import Papa from "papaparse";
import { dataset } from "../services/gateway";
import { DemoNote, Empty, PageHeading, Panel } from "../components/common";
import { number, currency } from "../domain/format";
export function Sources() {
  const [selected, setSelected] = useState("ibama");
  const source = dataset.sources.find((s) => s.id === selected)!;
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [record, setRecord] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    fetch(`/mocks/${source.file}`, { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw new Error("file");
        return r.text();
      })
      .then((text) => {
        const content = text.split(/\r?\n/).slice(source.skip).join("\n");
        const parsed = Papa.parse<Record<string, string>>(content, {
          header: true,
          delimiter: ";",
          skipEmptyLines: true,
        });
        if (!abort.signal.aborted) setRows(parsed.data);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(
            "Não foi possível abrir o arquivo local. Recarregue a página.",
          );
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [source.file, source.skip]);
  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        Object.values(row).some((v) =>
          String(v).toLowerCase().includes(query.toLowerCase()),
        ),
      ),
    [rows, query],
  );
  const fields =
    selected === "ibama"
      ? [
          "ID_REGISTRO_NORMALIZADO",
          "NOME_INFRATOR",
          "CNPJ_NORMALIZADO",
          "UF",
          "SIT_CANCELADO",
          "CD_TERMOS_EMBARGOS",
          "VALOR_NUMERICO",
        ]
      : selected === "zarc"
        ? [
            "ID_REGISTRO_NORMALIZADO",
            "CULTURA_NORMALIZADA",
            "Cultivar",
            "UF",
            "CHAVE_ZONEAMENTO",
          ]
        : selected === "inmet"
          ? [
              "ID_REGISTRO_NORMALIZADO",
              "CODIGO_ESTACAO",
              "DATA_HORA_UTC",
              "PRECIPITACAO_MM",
              "TEMPERATURA_AR_C",
            ]
          : [
              "ID_REGISTRO_NORMALIZADO",
              "NOME_DEVEDOR",
              "CNPJ_NORMALIZADO",
              "UF_DEVEDOR",
              "SITUACAO_INSCRICAO",
              "VALOR_NUMERICO",
            ];
  const labels: Record<string, string> = {
    ID_REGISTRO_NORMALIZADO: "ID do registro",
    CNPJ_NORMALIZADO: "CNPJ normalizado",
    VALOR_NUMERICO: "Valor (R$)",
    NOME_INFRATOR: "Infrator",
    NOME_DEVEDOR: "Devedor",
    UF_DEVEDOR: "UF",
    SIT_CANCELADO: "Cancelado?",
    CD_TERMOS_EMBARGOS: "Termo de embargo",
    SITUACAO_INSCRICAO: "Situação",
    CULTURA_NORMALIZADA: "Cultura",
    CHAVE_ZONEAMENTO: "Chave de zoneamento",
    CODIGO_ESTACAO: "Estação",
    DATA_HORA_UTC: "Data e hora UTC",
    PRECIPITACAO_MM: "Chuva (mm)",
    TEMPERATURA_AR_C: "Temperatura (°C)",
  };
  return (
    <div className="page">
      <PageHeading
        eyebrow="EVIDÊNCIAS E QUALIDADE"
        title="Fontes e contexto agro"
        description="Saiba de onde cada dado veio e o que ele permite concluir."
      />
      <div className="sources-summary">
        <div>
          <Database size={22} />
          <strong>6.000</strong>
          <span>registros nos CSVs</span>
        </div>
        <div>
          <FileSearch size={22} />
          <strong>6</strong>
          <span>arquivos locais</span>
        </div>
        <div>
          <ShieldAlert size={22} />
          <strong>0</strong>
          <span>APIs externas conectadas</span>
        </div>
      </div>
      <Tabs defaultValue="sources">
        <Tabs.List>
          <Tabs.Tab value="sources">Fontes e exploração</Tabs.Tab>
          <Tabs.Tab value="agro">Contexto agronômico</Tabs.Tab>
          <Tabs.Tab value="coverage">Cobertura do MVP</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="sources" pt="lg">
          <div className="source-grid">
            {dataset.sources.map((s) => (
              <button
                key={s.id}
                className={`source-card ${selected === s.id ? "selected" : ""}`}
                onClick={() => {
                  if (s.id !== selected) {
                    setSelected(s.id);
                    setLoading(true);
                    setError("");
                    setRows([]);
                    setQuery("");
                    setPage(1);
                  }
                }}
              >
                <div>
                  <Database size={18} />
                  <Badge color="teal" size="xs" variant="light">
                    Mock local
                  </Badge>
                </div>
                <h3>{s.name}</h3>
                <p>{s.dimension}</p>
                <strong>
                  {number(s.count)} <span>registros</span>
                </strong>
              </button>
            ))}
          </div>
          <Panel
            title={source.name}
            description={source.description}
            action={
              <Button
                component="a"
                href={`/mocks/${source.file}`}
                download
                variant="default"
                leftSection={<Download size={14} />}
                size="xs"
              >
                Baixar CSV
              </Button>
            }
          >
            <div className="source-file-info">
              <span>{source.file}</span>
              <span>SHA-256: {source.hash.slice(0, 16)}…</span>
              <span>{source.masked} identificadores mascarados</span>
            </div>
            <div className="filter-bar">
              <TextInput
                className="filter-search"
                placeholder="Buscar no arquivo selecionado"
                aria-label="Buscar no CSV"
                leftSection={<Search size={15} />}
                value={query}
                onChange={(e) => {
                  setQuery(e.currentTarget.value);
                  setPage(1);
                }}
              />
            </div>
            {error ? (
              <Alert color="red">{error}</Alert>
            ) : loading ? (
              <div className="empty">
                <Loader size="sm" />
                Abrindo o CSV local…
              </div>
            ) : filtered.length ? (
              <div className="table-scroll">
                <Table
                  striped
                  highlightOnHover
                  verticalSpacing="sm"
                  horizontalSpacing="md"
                >
                  <Table.Thead>
                    <Table.Tr>
                      {fields.map((f) => (
                        <Table.Th key={f}>{labels[f] || f}</Table.Th>
                      ))}
                      <Table.Th>Registro</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filtered.slice((page - 1) * 8, page * 8).map((row, i) => (
                      <Table.Tr key={i}>
                        {fields.map((f) => (
                          <Table.Td key={f} className="source-cell">
                            {f === "VALOR_NUMERICO" && row[f]
                              ? currency(Number(row[f]))
                              : row[f] || "—"}
                          </Table.Td>
                        ))}
                        <Table.Td>
                          <Button
                            variant="subtle"
                            size="compact-xs"
                            onClick={() => setRecord(row)}
                          >
                            Detalhes
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            ) : (
              <Empty />
            )}
            {!error && !loading && (
              <div className="pagination-footer">
                <span>{filtered.length} registros encontrados</span>
                <Pagination
                  total={Math.max(1, Math.ceil(filtered.length / 8))}
                  value={page}
                  onChange={setPage}
                  size="sm"
                />
              </div>
            )}
          </Panel>
        </Tabs.Panel>
        <Tabs.Panel value="agro" pt="lg">
          <DemoNote>
            Dados sintéticos. A estação A999 fica no DF; não está vinculada às
            fazendas. O catálogo de cultivares não permite calcular janela de
            risco ZARC.
          </DemoNote>
          <div className="agro-grid">
            <Panel
              title="Chuva diária observada no mock"
              description="Estação A999 · DF · janeiro e fevereiro de 2026"
            >
              <BarChart
                h={245}
                data={dataset.weather}
                dataKey="day"
                series={[
                  {
                    name: "rain",
                    label: "Precipitação (mm)",
                    color: "#76a28a",
                  },
                ]}
                withLegend={false}
                valueFormatter={(v) => `${v} mm`}
              />
              <div className="chart-foot">
                Último dia parcial: {dataset.weather.at(-1)?.observations}{" "}
                observações horárias.
              </div>
            </Panel>
            <Panel
              title="Temperatura média diária"
              description="Observações horárias agregadas · °C"
            >
              <LineChart
                h={245}
                data={dataset.weather}
                dataKey="day"
                series={[
                  {
                    name: "temperature",
                    label: "Temperatura",
                    color: "#cc9c58",
                  },
                ]}
                withDots={false}
                valueFormatter={(v) => `${v} °C`}
              />
              <div className="chart-foot">
                Média das observações disponíveis, sem interpolação.
              </div>
            </Panel>
          </div>
          <Panel
            title="O que falta para recomendar barter"
            description="O risco precisa se relacionar à operação concreta"
          >
            <div className="agro-requirements">
              {[
                "Imóvel e vínculo com o cliente",
                "Cultura, solo e ciclo da cultivar",
                "Safra e janela de plantio",
                "Situação e extensão de eventual embargo",
              ].map((s, i) => (
                <div key={s}>
                  <CloudSun size={20} />
                  <span>0{i + 1}</span>
                  <b>{s}</b>
                  <small>A validar com novas fontes</small>
                </div>
              ))}
            </div>
          </Panel>
        </Tabs.Panel>
        <Tabs.Panel value="coverage" pt="lg">
          <Panel
            title="Cobertura e dependências"
            description="Distinguir arquivo de demonstração de integração em produção"
          >
            <Table verticalSpacing="md" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Dimensão</Table.Th>
                  <Table.Th>Disponível agora</Table.Th>
                  <Table.Th>Próximo passo</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {[
                  [
                    "Fiscal / FGTS",
                    "3 CSVs sintéticos",
                    "Validar situação, atualidade e direito de uso",
                  ],
                  [
                    "Ambiental",
                    "Autos de infração sintéticos",
                    "Consultar termos de embargo e vínculo territorial",
                  ],
                  [
                    "Agronômica",
                    "Cultivares e clima sintéticos",
                    "Obter janela ZARC, solo, imóvel e safra",
                  ],
                  [
                    "Receita / quadro societário",
                    "Apenas casos fixos do pitch",
                    "Conector e vínculo de grupo a validar",
                  ],
                  [
                    "Processos / protestos / Junta",
                    "Cenários adicionais fictícios",
                    "Validar acesso, licença, identificadores e latência",
                  ],
                  [
                    "Recebíveis e garantias Krilltech",
                    "Exposições ilustrativas",
                    "Integração interna na fase 2",
                  ],
                  [
                    "SCR / registro de CPR",
                    "Não integrado",
                    "Acesso autorizado e requisitos a validar",
                  ],
                ].map((row) => (
                  <Table.Tr key={row[0]}>
                    {row.map((x) => (
                      <Table.Td key={x}>{x}</Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <DemoNote>
              Arquivos públicos não garantem atualização, completude ou acesso
              comercial. Nenhuma chamada a CNJ, PGFN, Ibama ou IBM é feita por
              este frontend.
            </DemoNote>
          </Panel>
        </Tabs.Panel>
      </Tabs>
      <Modal
        opened={!!record}
        onClose={() => setRecord(null)}
        title="Registro original do CSV"
        size="lg"
      >
        <pre className="raw-record">{JSON.stringify(record, null, 2)}</pre>
      </Modal>
    </div>
  );
}

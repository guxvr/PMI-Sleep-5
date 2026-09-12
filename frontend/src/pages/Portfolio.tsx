import { useState } from "react";
import { Button, Pagination, Select, TextInput } from "@mantine/core";
import { Download, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { ClientTable, PageHeading } from "../components/common";
import { clients } from "../services/gateway";
import { useStore } from "../services/store-context";
import { assess, defaultOperation, MODALITIES } from "../domain/risk";
import { compactMoney, download, toCsv } from "../domain/format";
export function Portfolio({ onAnalyze }: { onAnalyze: () => void }) {
  const { data } = useStore();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [state, setState] = useState<string | null>(null);
  const [modality, setModality] = useState<string | null>(null);
  const [sort, setSort] = useState<string | null>("name");
  const [page, setPage] = useState(1);
  const rating = params.get("rating");
  const filtered = clients
    .filter(
      (c) =>
        (c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.cnpj
            .replace(/\D/g, "")
            .includes(search.replace(/[./\-\s]/g, ""))) &&
        (!state || c.state === state) &&
        (!modality || c.modality === modality) &&
        (!rating ||
          assess(c, defaultOperation(c, data.policy)).rating === rating),
    )
    .sort((a, b) =>
      sort === "exposure"
        ? b.exposure - a.exposure
        : sort === "risk"
          ? (assess(a, defaultOperation(a, data.policy)).score ?? -1) -
            (assess(b, defaultOperation(b, data.policy)).score ?? -1)
          : a.name.localeCompare(b.name),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const effective = Math.min(page, pages);
  function reset() {
    setSearch("");
    setState(null);
    setModality(null);
    setParams({});
    setPage(1);
  }
  return (
    <div className="page">
      <PageHeading
        eyebrow="RELACIONAMENTO E EXPOSIÇÃO"
        title="Carteira de clientes"
        description="Do perfil do cliente à estrutura da próxima operação."
        actions={
          <Button leftSection={<Plus size={17} />} onClick={onAnalyze}>
            Nova análise
          </Button>
        }
      />
      <div className="portfolio-summary">
        <span>
          <b>{filtered.length}</b> clientes encontrados
        </span>
        <span>
          <b>{compactMoney(filtered.reduce((n, c) => n + c.exposure, 0))}</b> de
          exposição simulada
        </span>
        <Button
          variant="subtle"
          leftSection={<Download size={14} />}
          size="xs"
          onClick={() =>
            download(
              "carteira-filtrada-demo.csv",
              toCsv(
                filtered.map((c) => ({
                  Cliente: c.name,
                  CNPJ: c.cnpj,
                  UF: c.state,
                  Rating: assess(c, defaultOperation(c, data.policy)).rating,
                  Exposicao: c.exposure,
                })),
              ),
              "text/csv;charset=utf-8",
            )
          }
        >
          Exportar seleção
        </Button>
      </div>
      <section className="panel">
        <div className="filter-bar">
          <TextInput
            aria-label="Buscar clientes"
            placeholder="Buscar por nome ou CNPJ"
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
            leftSection={<Search size={16} />}
            className="filter-search"
          />
          <Select
            aria-label="Filtrar rating"
            placeholder="Todos os ratings"
            clearable
            value={rating}
            onChange={(v) => {
              setParams(v ? { rating: v } : {});
              setPage(1);
            }}
            data={["A", "B", "C", "D", "NC"]}
            w={150}
          />
          <Select
            aria-label="Filtrar estado"
            placeholder="Todos os estados"
            clearable
            data={[...new Set(clients.map((c) => c.state))].sort()}
            value={state}
            onChange={(v) => {
              setState(v);
              setPage(1);
            }}
            w={170}
          />
          <Select
            aria-label="Filtrar modalidade"
            placeholder="Modalidade"
            clearable
            data={Object.entries(MODALITIES).map(([value, label]) => ({
              value,
              label,
            }))}
            value={modality}
            onChange={(v) => {
              setModality(v);
              setPage(1);
            }}
            w={150}
          />
        </div>
        <div className="table-controls">
          <span>
            <SlidersHorizontal size={14} />{" "}
            {rating ? `Rating ${rating}` : "Toda a carteira"}
            {state ? ` · ${state}` : ""}
          </span>
          <div>
            <Button variant="subtle" size="xs" onClick={reset}>
              Limpar filtros
            </Button>
            <Select
              aria-label="Ordenar clientes"
              value={sort}
              onChange={setSort}
              data={[
                { value: "name", label: "Nome A–Z" },
                { value: "exposure", label: "Maior exposição" },
                { value: "risk", label: "Menor score" },
              ]}
              size="xs"
              w={155}
            />
          </div>
        </div>
        <ClientTable
          clients={filtered.slice((effective - 1) * 8, effective * 8)}
          policy={data.policy}
        />
        <div className="pagination-footer">
          <span>
            {filtered.length
              ? `${(effective - 1) * 8 + 1}–${Math.min(effective * 8, filtered.length)} de ${filtered.length}`
              : "0 resultados"}
          </span>
          <Pagination
            total={pages}
            value={effective}
            onChange={setPage}
            size="sm"
          />
        </div>
      </section>
    </div>
  );
}

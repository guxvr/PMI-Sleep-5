import {
  Alert,
  Button,
  Checkbox,
  Group,
  Modal,
  NumberInput,
  Select,
  TextInput,
} from "@mantine/core";
import { ArrowRight, FileSearch, Info } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clients, gateway } from "../services/gateway";
import { useStore } from "../services/store-context";
import {
  MODALITIES,
  normalizeIdentifier,
  validIdentifier,
} from "../domain/risk";
import type { Client, Modality } from "../domain/types";
export function AnalysisModal({
  open,
  onClose,
  initialClient,
}: {
  open: boolean;
  onClose: () => void;
  initialClient?: Client;
}) {
  const store = useStore();
  const nav = useNavigate();
  const [clientId, setClientId] = useState(
    initialClient?.id || "33444555000103",
  );
  const [custom, setCustom] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [modality, setModality] = useState<Modality>("prazo");
  const [amount, setAmount] = useState<number | string>(180000);
  const [term, setTerm] = useState<number | string>(120);
  const [guarantee, setGuarantee] = useState<string | null>("penhor");
  const [linked, setLinked] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const client = clients.find((c) => c.id === clientId);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const id = custom ? normalizeIdentifier(identifier) : clientId;
    if (!id || (custom && !validIdentifier(id)))
      return setError(
        "Informe um CNPJ com 14 posições: 12 alfanuméricas e 2 dígitos finais.",
      );
    if (
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      !Number.isInteger(Number(term)) ||
      Number(term) < 1
    )
      return setError(
        "Informe valor maior que zero e prazo em dias inteiros, a partir de 1.",
      );
    setBusy(true);
    try {
      const a = await gateway.analyze({
        clientId: id,
        modality,
        amount: Number(amount),
        term: Number(term),
        guarantee: guarantee || "nao_informada",
        linkedArea: linked,
        policy: store.data.policy,
      });
      store.addAnalysis(a);
      store.addAudit({
        clientId: id,
        action: "Análise gerada",
        detail: `Operação simulada: ${MODALITIES[modality]}, ${term} dias.`,
        actor: "Ana Costa · demo",
        policy: store.data.policy,
        analysisId: a.id,
      });
      onClose();
      nav(`/analises/${a.id}`);
    } catch {
      setError("Não foi possível gerar a análise. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      opened={open}
      onClose={onClose}
      title={
        <div className="modal-title">
          <FileSearch size={20} /> Nova análise de operação
        </div>
      }
      size="lg"
      centered
    >
      <form onSubmit={submit} className="analysis-form">
        <p className="muted">
          Comece pela operação. A recomendação considera como você pretende
          negociar.
        </p>
        <Checkbox
          label="Consultar outro CNPJ"
          checked={custom}
          onChange={(e) => setCustom(e.currentTarget.checked)}
        />
        {custom ? (
          <TextInput
            label="CNPJ"
            placeholder="00.000.000/0001-00 ou CNPJ alfanumérico"
            value={identifier}
            onChange={(e) => setIdentifier(e.currentTarget.value)}
            required
            description="CNPJs fora do mock retornam informação insuficiente."
          />
        ) : (
          <Select
            label="Cliente"
            searchable
            data={clients.map((c) => ({
              value: c.id,
              label: `${c.name} · ${c.cnpj}`,
            }))}
            value={clientId}
            onChange={(v) => setClientId(v || "")}
            nothingFoundMessage="Nenhum cliente encontrado"
            required
          />
        )}
        <Select
          label="Modalidade pretendida"
          data={Object.entries(MODALITIES).map(([value, label]) => ({
            value,
            label,
          }))}
          value={modality}
          onChange={(v) => setModality(v as Modality)}
          required
        />
        <div className="form-two">
          <NumberInput
            label="Valor da operação"
            prefix="R$ "
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            min={0}
            value={amount}
            onChange={setAmount}
            required
          />
          <NumberInput
            label="Prazo (dias)"
            min={1}
            allowDecimal={false}
            value={term}
            onChange={setTerm}
            required
          />
        </div>
        <Select
          label="Garantia pretendida"
          value={guarantee}
          onChange={setGuarantee}
          data={[
            { value: "penhor", label: "Penhor" },
            { value: "alienacao", label: "Alienação fiduciária" },
            { value: "safra", label: "Garantia sobre safra" },
            { value: "nenhuma", label: "Sem garantia" },
          ]}
        />
        {client?.embargoConfirmed && (
          <Checkbox
            label="Neste cenário, a área embargada é o lastro da operação"
            checked={linked}
            onChange={(e) => setLinked(e.currentTarget.checked)}
          />
        )}
        <Alert icon={<Info size={17} />} color="teal" variant="light">
          Análise de demonstração. Nenhum crédito será aprovado ou alterado.
        </Alert>
        {error && (
          <Alert color="red" role="alert">
            {error}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={busy}
            rightSection={<ArrowRight size={16} />}
          >
            Gerar análise
          </Button>
        </Group>
      </form>
    </Modal>
  );
}

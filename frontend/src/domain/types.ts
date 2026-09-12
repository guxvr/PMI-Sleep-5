export type Rating = "A" | "B" | "C" | "D" | "NC";
export type Modality = "a_vista" | "prazo" | "barter" | "cpr";
export type Policy = "project-v02" | "agent-v04";
export type Evidence = {
  id: string;
  title: string;
  source: string;
  file: string;
  line: number;
  origin: string;
  date: string;
  status: string;
  amount: number;
  description: string;
  raw: Record<string, string>;
};
export type Client = {
  id: string;
  name: string;
  cnpj: string;
  state: string;
  city: string;
  segment: string;
  crop: string;
  exposure: number;
  securedRatio: number;
  modality: Modality;
  term: number;
  group: string;
  risks: number[];
  agentFlagCodes: string[];
  agentAssessments: Record<Modality, Assessment>;
  evidence: Evidence[];
  embargoConfirmed: boolean;
  rj: boolean;
  coverage: string;
  earlySignal: string | null;
  change: number;
  lastReview: string;
  origin: string;
  sourceNote: string;
};
export type Operation = {
  clientId: string;
  modality: Modality;
  amount: number;
  term: number;
  guarantee: string;
  linkedArea: boolean;
  policy: Policy;
};
export type Assessment = {
  score: number | null;
  baseScore: number | null;
  rating: Rating;
  rules: { label: string; points: number }[];
  override: string | null;
  policy: Policy;
};
export type Recommendation = {
  modality: Modality;
  status: "adequada" | "condicionada" | "desaconselhada";
  title: string;
  reason: string;
  guarantee: string;
};
export type Analysis = {
  id: string;
  createdAt: string;
  operation: Operation;
  assessment: Assessment;
};
export type AuditEntry = {
  id: string;
  date: string;
  clientId: string;
  action: string;
  detail: string;
  actor: string;
  policy: Policy;
  analysisId?: string;
};
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  date: string;
  evidenceIds?: string[];
  provider?: "mock" | "watsonx";
  threadId?: string;
  agentVersion?: number;
};
export type Source = {
  id: string;
  file: string;
  name: string;
  dimension: string;
  count: number;
  hash: string;
  skip: number;
  masked: number;
  description: string;
};
export type Dataset = {
  schemaVersion: string;
  agentReference: { version: string; sourceHash: string; scope: string };
  asOf: string;
  clients: Client[];
  sources: Source[];
  weather: {
    date: string;
    day: string;
    observations: number;
    rain: number;
    temperature: number;
  }[];
  cultivars: { name: string; count: number }[];
  disclaimer: string;
};

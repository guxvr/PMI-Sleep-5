import { createServer } from "node:http";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

try {
  loadEnvFile(fileURLToPath(new URL(".env", import.meta.url)));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const key = process.env.WATSONX_API_KEY || "";
const instance = (process.env.WATSONX_INSTANCE_URL || "").replace(/\/+$/, "");
const agentId = process.env.WATSONX_AGENT_ID || "";
const environmentId = process.env.WATSONX_ENVIRONMENT_ID || "";
const version = Number(process.env.WATSONX_AGENT_VERSION || 0);
const port = Number(process.env.PORT || 3001);
const missing = Object.entries({
  WATSONX_API_KEY: key,
  WATSONX_INSTANCE_URL: instance,
  WATSONX_AGENT_ID: agentId,
  WATSONX_ENVIRONMENT_ID: environmentId,
  WATSONX_AGENT_VERSION: version,
})
  .filter(([, value]) => !value)
  .map(([name]) => name);
// Restrict credential-bearing requests to the IBM Cloud service configured by the operator.
const validInstance =
  /^https:\/\/api\.[a-z0-9-]+\.watson-orchestrate\.(cloud\.)?ibm\.com\/instances\/[a-zA-Z0-9-]+$/.test(
    instance,
  );
const configured =
  missing.length === 0 &&
  validInstance &&
  /^[a-zA-Z0-9_-]+$/.test(agentId) &&
  /^[a-zA-Z0-9_-]+$/.test(environmentId) &&
  Number.isInteger(version) &&
  version > 0;
let token = "";
let expires = 0;
let lastSuccess = null;
let lastError = null;
let activeRequests = 0;

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
async function iamToken() {
  if (token && Date.now() < expires) return token;
  const response = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(20000),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: key,
    }),
  });
  if (!response.ok)
    throw new ApiError(
      502,
      `A autenticação IBM Cloud falhou (HTTP ${response.status}). Verifique a chave no servidor.`,
    );
  const data = await response.json();
  if (!data.access_token)
    throw new ApiError(502, "IBM Cloud não retornou um token de acesso.");
  token = data.access_token;
  expires =
    Date.now() + Math.max(0, Number(data.expires_in || 3600) - 60) * 1000;
  return token;
}
function extractText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content
      .filter(
        (part) =>
          part && (part.type === "text" || part.response_type === "text"),
      )
      .map((part) =>
        typeof part.text === "string" ? part.text : part.text?.value || "",
      )
      .filter(Boolean)
      .join("\n\n");
  return "";
}
async function chat(body) {
  if (!configured)
    throw new ApiError(
      503,
      `Conexão watsonx pendente: ${missing.length ? missing.join(", ") : "URL da instância ou ID inválido"}.`,
    );
  const { text, client, operation, history = [], threadId } = body;
  if (
    threadId &&
    (typeof threadId !== "string" || !/^[0-9a-f-]{36}$/i.test(threadId))
  )
    throw new ApiError(400, "Identificador de conversa inválido.");
  const cnpj =
    typeof client?.cnpj === "string"
      ? client.cnpj.replace(/[.\/\-\s]/g, "").toUpperCase()
      : "";
  if (
    typeof text !== "string" ||
    !text.trim() ||
    text.length > 8000 ||
    !/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj)
  )
    throw new ApiError(
      400,
      "Informe uma mensagem de até 8.000 caracteres e um CNPJ válido.",
    );
  if (
    !operation ||
    !["vista", "prazo", "barter", "cpr"].includes(operation.modality) ||
    !Number.isFinite(operation.amount) ||
    operation.amount <= 0 ||
    !Number.isInteger(operation.term) ||
    operation.term < 1
  )
    throw new ApiError(400, "Contexto da operação inválido.");
  if (
    !Array.isArray(history) ||
    history.length > 20 ||
    history.some(
      (m) =>
        !m ||
        !["user", "assistant"].includes(m.role) ||
        typeof m.text !== "string" ||
        m.text.length > 16000,
    )
  )
    throw new ApiError(400, "Histórico de conversa inválido ou muito longo.");
  const context = {
    cnpj,
    modalidade: operation.modality,
    valor_simulado: operation.amount,
    prazo_simulado_dias: operation.term,
    finalidade_credito: "producao",
    garantia_simulada: String(operation.guarantee || "").slice(0, 100),
    vinculo_area_simulado: operation.linkedArea === true,
  };
  const introduction = `Contexto de demonstração fornecido pelo analista (não é evidência de fonte externa): ${JSON.stringify(context)}. Consulte suas ferramentas para os achados de risco. Não considere os valores simulados uma aprovação. Responda em português e sinalize limitações das fontes.`;
  const response = await fetch(`${instance}/v1/orchestrate/runs/stream`, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(120000),
    headers: {
      Authorization: `Bearer ${await iamToken()}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      agent_id: agentId,
      environment_id: environmentId,
      version,
      ...(threadId ? { thread_id: threadId } : {}),
      message: {
        role: "user",
        content: `${introduction}\n\nPergunta do analista: ${text.trim()}`,
      },
    }),
  });
  if (!response.ok) {
    if (response.status === 401) {
      token = "";
      expires = 0;
    }
    const hint =
      response.status === 403
        ? "A chave não tem permissão para esse agente."
        : response.status === 404
          ? "Confira a URL, o ID e o deploy publicado do agente."
          : response.status === 429
            ? "Limite de uso atingido; tente novamente mais tarde."
            : "Verifique o deploy e suas ferramentas no watsonx.";
    throw new ApiError(
      502,
      `O watsonx respondeu HTTP ${response.status}. ${hint}`,
    );
  }
  // IBM Cloud returns NDJSON events; also accept SSE data lines. Render only
  // assistant message content, never tool traces or reasoning events.
  const raw = await response.text();
  let answer = "";
  let completed = false;
  let remoteThreadId = threadId;
  for (const line of raw.split(/\r?\n/)) {
    const value = line.startsWith("data:") ? line.slice(5).trim() : line.trim();
    if (!value.startsWith("{")) continue;
    const event = JSON.parse(value);
    if (
      ["run.failed", "run.expired", "run.cancelled", "error"].includes(
        event.event,
      )
    )
      throw new ApiError(
        502,
        "A execução do agente falhou no watsonx. Verifique o deploy e suas ferramentas.",
      );
    if (event.data?.thread_id) remoteThreadId = event.data.thread_id;
    if (
      event.event === "message.delta" &&
      event.data?.delta?.role === "assistant"
    )
      answer += extractText(event.data.delta.content);
    if (event.event === "run.completed") completed = true;
  }
  if (!completed)
    throw new ApiError(
      502,
      "O watsonx encerrou a resposta antes de concluir a execução. Tente novamente.",
    );
  if (!answer.trim())
    throw new ApiError(
      502,
      "O agente não retornou uma resposta textual compatível. Verifique a execução no watsonx.",
    );
  lastSuccess = new Date().toISOString();
  lastError = null;
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    text: answer,
    date: lastSuccess,
    provider: "watsonx",
    threadId: remoteThreadId,
    agentVersion: version,
  };
}
function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(body));
}
async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 65536)
      throw new ApiError(
        413,
        "Mensagem e histórico excedem 64 KB. Inicie uma nova conversa.",
      );
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw new ApiError(400, "JSON inválido.");
  }
}

createServer(async (req, res) => {
  // Local development bridge: no wildcard CORS and no public bind.
  if (!/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host || ""))
    return send(res, 403, { error: "Host não permitido." });
  if (
    req.headers.origin &&
    !/^http:\/\/(127\.0\.0\.1|localhost):(5173|4173|3001)$/.test(
      req.headers.origin,
    )
  )
    return send(res, 403, { error: "Origem não permitida." });
  if (req.method === "GET" && req.url === "/api/watsonx/status")
    return send(res, 200, {
      configured,
      missing,
      lastSuccess,
      lastError,
      provider: "watsonx",
      agentVersion: version,
      message: configured
        ? `Ambiente live v${version} configurado; envie uma mensagem para consultar o agente.`
        : "Falta completar a configuração do agente no servidor.",
    });
  if (req.method !== "POST" || req.url !== "/api/chat")
    return send(res, 404, { error: "Rota não encontrada." });
  if (!req.headers["content-type"]?.startsWith("application/json"))
    return send(res, 415, { error: "Use application/json." });
  if (activeRequests >= 2)
    return send(res, 429, { error: "Aguarde as consultas em andamento." });
  activeRequests++;
  try {
    send(res, 200, await chat(await readBody(req)));
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : error.name === "TimeoutError"
          ? "O watsonx demorou além do limite. Tente novamente."
          : "Não foi possível concluir a conexão com o watsonx. Verifique a rede e a configuração do servidor.";
    lastError = message;
    send(res, error instanceof ApiError ? error.status : 502, {
      error: message,
    });
  } finally {
    activeRequests--;
  }
}).listen(port, "127.0.0.1", () =>
  console.log(
    `Krill API: http://127.0.0.1:${port} · watsonx ${configured ? "configurado" : "aguardando configuração"}`,
  ),
);

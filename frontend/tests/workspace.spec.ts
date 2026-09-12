import { test, expect } from "@playwright/test";

test("agent v4 mode uses current Python snapshots in report and chat", async ({
  page,
}) => {
  await page.goto("/governanca");
  await page.getByRole("combobox", { name: "Política de demonstração" }).click();
  await page
    .getByRole("option", { name: "Agente v4 · snapshot Python" })
    .click();
  await page.goto("/clientes/33444555000103");
  await expect(page.locator(".score-number")).toContainText("455");
  await page
    .locator(".operation-switch")
    .getByText("Barter", { exact: true })
    .click();
  await expect(page.locator(".score-number")).toContainText("381");
  await page.getByRole("button", { name: "Perguntar ao assistente" }).click();
  await expect(page.locator(".chat-score")).toContainText("381");
  await page
    .getByRole("button", { name: "Compare as modalidades para esta operação" })
    .click();
  await expect(page.locator(".message.assistant")).toContainText(
    "D (381/1000)",
  );
});

test("review snapshots the changed operation and chat preserves collateral context", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Nova análise", exact: true }).click();
  await page
    .getByLabel("Neste cenário, a área embargada é o lastro da operação")
    .uncheck();
  await page
    .getByRole("button", { name: "Gerar análise", exact: true })
    .click();
  await expect(page).toHaveURL(/\/analises\//);
  const originalUrl = page.url();
  await page
    .locator(".operation-switch")
    .getByText("Barter", { exact: true })
    .click();
  await expect(page.locator(".score-number")).toContainText("540");
  await page
    .getByRole("button", { name: "Registrar parecer", exact: true })
    .last()
    .click();
  await page
    .getByLabel("Justificativa e condições propostas")
    .fill(
      "Revisão da modalidade modificada, com vínculo do lastro ainda não informado.",
    );
  await page.getByRole("button", { name: "Salvar parecer" }).click();
  await expect(page).not.toHaveURL(originalUrl);
  const snapshot = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("krill-risk-demo-v1")!),
  );
  expect(snapshot.audit[0].analysisId).toBe(snapshot.analyses[0].id);
  expect(snapshot.analyses[0].operation.modality).toBe("barter");
  expect(snapshot.analyses[0].operation.linkedArea).toBe(false);
  await page.getByRole("button", { name: "Perguntar ao assistente" }).click();
  await expect(page).toHaveURL(/lastro=false/);
  await expect(page.locator(".chat-score")).toContainText("540");
  await page
    .getByRole("button", { name: "Compare as modalidades para esta operação" })
    .click();
  await expect(page.locator(".message.assistant")).toContainText(
    "C (540/1000)",
  );
});

test("source failure is not shown as a successful empty consultation", async ({
  page,
}) => {
  await page.route("**/mocks/**", (route) => route.abort());
  await page.goto("/fontes");
  await expect(
    page.getByText(
      "Não foi possível abrir o arquivo local. Recarregue a página.",
    ),
  ).toBeVisible();
  await expect(page.getByText("0 registros encontrados")).toHaveCount(0);
});

test("governance secondary tabs remain usable at each viewport", async ({
  page,
}) => {
  await page.goto("/governanca");
  await page.getByRole("tab", { name: "Sensibilidade", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sensibilidade dos pesos" }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Mudou?" }),
  ).toBeAttached();
  await page.getByRole("tab", { name: "Integração e roadmap" }).click();
  await expect(
    page.getByRole("heading", { name: "Como o frontend se conecta" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});

test("dashboard renders portfolio-derived numbers and export", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Visão geral da carteira" }),
  ).toBeVisible();
  await expect(page.getByText("R$ 15,21 mi", { exact: true })).toBeVisible();
  const file = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar", exact: true }).click();
  expect((await file).suggestedFilename()).toBe("carteira-demo.csv");
});
test("search and empty portfolio filters", async ({ page }) => {
  await page.goto("/carteira");
  await page
    .getByRole("textbox", { name: "Buscar clientes" })
    .fill("Santa Aurora");
  await expect(
    page.getByRole("button", { name: /FS.*Fazenda Santa Aurora/ }),
  ).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Buscar clientes" })
    .fill("Cliente inexistente 999999");
  await expect(page.getByText("Nenhum resultado encontrado")).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page.getByText("40 clientes encontrados")).toBeVisible();
});
test("new analysis, modality override, local review persistence", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Nova análise", exact: true }).click();
  await page
    .getByRole("button", { name: "Gerar análise", exact: true })
    .click();
  await expect(page).toHaveURL(/\/analises\//);
  await expect(page.locator(".score-number")).toContainText("540");
  await page
    .locator(".operation-switch")
    .getByText("Barter", { exact: true })
    .click();
  await expect(page.locator(".score-number")).toContainText("399");
  await expect(page.getByText("Regra crítica aplicada")).toBeVisible();
  await page
    .getByRole("button", { name: "Salvar simulação", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Registrar nova versão" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Registrar parecer", exact: true })
    .last()
    .click();
  await page
    .getByLabel("Justificativa e condições propostas")
    .fill(
      "Revisão demonstrativa: confirmar o vínculo da área e priorizar pagamento antecipado.",
    );
  await page.getByRole("button", { name: "Salvar parecer" }).click();
  await page.reload();
  await page.getByRole("tab", { name: /Histórico de revisão/ }).click();
  await expect(
    page.getByText(/Revisão demonstrativa: confirmar o vínculo/),
  ).toBeVisible();
});
test("unknown valid-format identifier produces NC, never approval", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Nova análise", exact: true }).click();
  await page.getByLabel("Consultar outro CNPJ").check();
  await page
    .getByRole("textbox", { name: "CNPJ", exact: true })
    .fill("AB.CDE.123/0001-42");
  await page.getByRole("button", { name: "Gerar análise" }).click();
  await expect(
    page.getByRole("heading", { name: "Informação insuficiente" }),
  ).toBeVisible();
  await expect(page.getByText(/Resultado NC/)).toBeVisible();
});
test("agent chat responds with selected operation and preserved evidence", async ({
  page,
}) => {
  await page.goto("/agente");
  await page
    .getByRole("button", { name: "Compare as modalidades para esta operação" })
    .click();
  await expect(page.locator(".message.assistant")).toContainText(
    "Fazenda Campo Verde",
  );
  await expect(page.locator(".message.assistant")).toContainText("Barter");
  await expect(page.locator(".message.assistant")).toContainText("R$");
  await page.reload();
  await expect(page.locator(".message.assistant")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Mensagem para o assistente" })
    .fill("O que falta validar?");
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(page.locator(".message.assistant").last()).toContainText(
    "não contém janela de risco",
  );
});
test("source explorer loads original mock rows and weather", async ({
  page,
}) => {
  await page.goto("/fontes");
  await expect(page.getByText("1000 registros encontrados")).toBeVisible();
  await page
    .getByRole("button", { name: "Detalhes", exact: true })
    .first()
    .click();
  await expect(page.locator(".raw-record")).toContainText("SIT_CANCELADO");
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Contexto agronômico" }).click();
  await expect(
    page.getByRole("heading", { name: "Chuva diária observada no mock" }),
  ).toBeVisible();
});
test("source evidence and recorded alert treatment", async ({ page }) => {
  await page.goto("/alertas");
  await page
    .getByRole("button", { name: "Registrar tratamento" })
    .first()
    .click();
  await page
    .getByLabel("Ação realizada e justificativa")
    .fill("Documentos revisados no cenário fictício; encaminhado ao jurídico.");
  await page.getByRole("button", { name: "Salvar tratamento" }).click();
  await page.goto("/governanca?tab=auditoria");
  await expect(page.getByText("Alerta tratado")).toBeVisible();
  await expect(
    page.getByText(/Documentos revisados no cenário fictício/),
  ).toBeVisible();
});
test("all pages render without errors or horizontal document overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of [
    "/",
    "/carteira",
    "/clientes/33444555000103",
    "/alertas",
    "/agente",
    "/fontes",
    "/governanca",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForTimeout(350);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      `overflow ${path}`,
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

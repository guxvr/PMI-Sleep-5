export const currency = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
export const compactMoney = (n: number) =>
  n >= 1e6
    ? `R$ ${(n / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi`
    : currency(n);
export const number = (n: number) => n.toLocaleString("pt-BR");
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("");
export const dateTime = (s: string) =>
  new Date(s).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
export function download(
  name: string,
  data: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function toCsv(rows: Record<string, string | number>[]) {
  const heads = Object.keys(rows[0] ?? {});
  const cell = (x: unknown) =>
    '"' +
    String(x ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return (
    "\uFEFF" +
    [heads, ...rows.map((row) => heads.map((h) => row[h]))]
      .map((r) => r.map(cell).join(";"))
      .join("\r\n")
  );
}

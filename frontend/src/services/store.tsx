import { useState } from "react";
import { Context, type Data } from "./store-context";
import type { ReactNode } from "react";
import type { AuditEntry } from "../domain/types";
const initial: Data = {
  version: 1,
  analyses: [],
  audit: [],
  alertStates: {},
  chats: {},
  policy: "project-v02",
};
const KEY = "krill-risk-demo-v1";
function read(): Data {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    return d?.version === 1
      ? {
          ...initial,
          ...d,
          policy: d.policy === "agent-v04" ? "agent-v04" : "project-v02",
        }
      : initial;
  } catch {
    return initial;
  }
}
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(read);
  const [storageError, setStorageError] = useState(false);
  function update(fn: (d: Data) => Data) {
    setData((d) => {
      const next = fn(d);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        setStorageError(true);
      }
      return next;
    });
  }
  const addAudit = (entry: Omit<AuditEntry, "id" | "date">) =>
    update((d) => ({
      ...d,
      audit: [
        { ...entry, id: crypto.randomUUID(), date: new Date().toISOString() },
        ...d.audit,
      ],
    }));
  return (
    <Context.Provider
      value={{
        data,
        storageError,
        addAudit,
        addAnalysis: (a) =>
          update((d) => ({ ...d, analyses: [a, ...d.analyses] })),
        setAlert: (id, status) =>
          update((d) => ({
            ...d,
            alertStates: { ...d.alertStates, [id]: status },
          })),
        setChat: (id, messages) =>
          update((d) => ({ ...d, chats: { ...d.chats, [id]: messages } })),
        setPolicy: (policy) => update((d) => ({ ...d, policy })),
        reset: () => update(() => initial),
      }}
    >
      {children}
    </Context.Provider>
  );
}

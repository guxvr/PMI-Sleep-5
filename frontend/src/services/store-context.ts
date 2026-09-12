import { createContext, useContext } from "react";
import type {
  Analysis,
  AuditEntry,
  ChatMessage,
  Policy,
} from "../domain/types";
export type Data = {
  version: 1;
  analyses: Analysis[];
  audit: AuditEntry[];
  alertStates: Record<string, string>;
  chats: Record<string, ChatMessage[]>;
  policy: Policy;
};
type Store = {
  data: Data;
  storageError: boolean;
  addAnalysis: (a: Analysis) => void;
  addAudit: (a: Omit<AuditEntry, "id" | "date">) => void;
  setAlert: (id: string, status: string) => void;
  setChat: (id: string, messages: ChatMessage[]) => void;
  setPolicy: (p: Policy) => void;
  reset: () => void;
};
export const Context = createContext<Store | null>(null);
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("StoreProvider missing");
  return value;
}

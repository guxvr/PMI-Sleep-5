import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import {
  assess,
  defaultOperation,
  ratingFor,
  recommend,
  sensitivity,
  validIdentifier,
} from "./risk";
import { clients, dataset } from "../services/gateway";
import type { Modality } from "./types";

describe("policy boundaries and explicit uncertainty", () => {
  it("uses documented project cutoffs", () => {
    expect(
      [399, 400, 599, 600, 799, 800, 1000].map((s) =>
        ratingFor(s, "project-v02"),
      ),
    ).toEqual(["D", "C", "C", "B", "B", "A", "A"]);
  });
  it("retains the actual agent cutoffs independently", () => {
    expect(
      [499, 500, 649, 650, 799, 800].map((s) => ratingFor(s, "agent-v04")),
    ).toEqual(["D", "C", "C", "B", "B", "A"]);
  });
  it("does not assign low risk to an absent client", () => {
    const a = assess(undefined, defaultOperation(clients[0]));
    expect(a).toMatchObject({ score: null, rating: "NC" });
  });
  it("returns NC for incomplete scenarios", () => {
    expect(
      assess(
        clients.find((c) => c.coverage === "insufficient"),
        defaultOperation(clients[0]),
      ).rating,
    ).toBe("NC");
  });
  it("accepts alphanumeric CNPJ format without stripping letters", () => {
    expect(validIdentifier("AB.CDE.123/0001-42")).toBe(true);
    expect(validIdentifier("XXX100.000XX")).toBe(false);
  });
});
describe("negotiation-specific rules", () => {
  const c = clients[2];
  it("changes a lastro-linked barter to critical while prazo remains C", () => {
    const prazo = assess(c, defaultOperation(c));
    const barter = assess(c, { ...defaultOperation(c), modality: "barter" });
    expect(prazo).toMatchObject({ score: 540, rating: "C" });
    expect(barter).toMatchObject({ score: 399, rating: "D" });
    expect(barter.override).toContain("lastro");
  });
  it("does not apply the lastro override to an unrelated area", () => {
    expect(
      assess(c, {
        ...defaultOperation(c),
        modality: "barter",
        linkedArea: false,
      }).rating,
    ).toBe("C");
  });
  it("does not treat every non-cancelled auto as a confirmed embargo", () => {
    expect(
      clients
        .filter((c) => c.origin === "csv")
        .every((c) => !c.embargoConfirmed),
    ).toBe(true);
  });
  it("does not claim that a cash sale removes all restrictions", () => {
    const a = assess(c, defaultOperation(c));
    const rec = recommend(c, defaultOperation(c), a).find(
      (r) => r.modality === "a_vista",
    );
    expect(rec?.reason).toContain("Demais verificações");
  });
  it("keeps sensitivity scores within range", () => {
    expect(sensitivity(c, defaultOperation(c))).toHaveLength(10);
    expect(
      sensitivity(c, defaultOperation(c)).every(
        (r) => r.score !== null && r.score >= 0 && r.score <= 1000,
      ),
    ).toBe(true);
  });
});
describe("integration reference: current Python", () => {
  it("matches Python v4 snapshots for all 40 clients and four modalities", () => {
    const reference = JSON.parse(
      execFileSync("python3", ["../tests/agent_reference.py"], {
        encoding: "utf8",
      }),
    ) as {
      sourceHash: string;
      cases: {
        id: string;
        modality: Modality;
        score: number | null;
        rating: string;
      }[];
    };
    expect(dataset.agentReference.sourceHash).toBe(reference.sourceHash);
    expect(reference.cases).toHaveLength(160);
    for (const item of reference.cases) {
      const client = clients.find((c) => c.id === item.id)!;
      expect(client.agentAssessments[item.modality]).toMatchObject({
        score: item.score,
        rating: item.rating,
      });
      if (client.coverage !== "insufficient")
        expect(
          assess(client, {
            ...defaultOperation(client, "agent-v04"),
            modality: item.modality,
          }),
        ).toMatchObject({ score: item.score, rating: item.rating });
    }
  });
});
describe("mock provenance", () => {
  it("preserves six source counts and 40 explicit portfolio scenarios", () => {
    expect(dataset.sources).toHaveLength(6);
    expect(dataset.sources.reduce((n, s) => n + s.count, 0)).toBe(6000);
    expect(clients).toHaveLength(40);
  });
  it("preserves source line, raw record and hash for imported evidence", () => {
    for (const c of clients.filter((c) => c.origin === "csv")) {
      expect(c.evidence[0].line).toBeGreaterThan(1);
      expect(Object.keys(c.evidence[0].raw).length).toBeGreaterThan(10);
      expect(
        dataset.sources.find((s) => s.id === c.evidence[0].source)?.hash,
      ).toHaveLength(64);
    }
  });
  it("retains incomplete weather-day coverage", () => {
    expect(dataset.weather.reduce((n, d) => n + d.observations, 0)).toBe(1000);
    expect(dataset.weather.at(-1)?.observations).toBe(16);
  });
});

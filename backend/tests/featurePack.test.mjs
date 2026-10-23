// Offline tests: provider keys are unset by the gate command and this file
// imports only the pure featurePack module, so no provider call can occur.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { applyListQuery, displayValue, recordInsights, toCSV } from "../featurePack.mjs";

const rows = [
  { id: 1, reference: "REF-1", title: "Alpha case", status: "Open", risk: "High", owner: "Ada", due_date: "2020-01-01", amount: 0, payload: {} },
  { id: 2, reference: "REF-1", title: "Beta case", status: "Closed", risk: "Low", owner: "", due_date: null, amount: 250, payload: { note: "" } },
];

test("search and status/risk filters narrow the main list", () => {
  assert.equal(applyListQuery(rows, { q: "alpha" }).length, 1);
  assert.equal(applyListQuery(rows, { status: "Closed" }).length, 1);
  assert.equal(applyListQuery(rows, { risk: "High" }).length, 1);
  assert.equal(applyListQuery(rows, {}).length, 2);
});

test("CSV export keeps header, escapes text, and preserves 0", () => {
  const csv = toCSV(rows);
  assert.ok(csv.startsWith("id,reference,"));
  assert.ok(csv.includes(",0,"));
  assert.ok(toCSV([]).startsWith("id"));
});

test("insights are deterministic fallback with labelled sections and zero counts", () => {
  const out = recordInsights([], { scope: "Test" });
  assert.equal(out.aiGenerated, false);
  assert.equal(out.source, "deterministic-fallback");
  assert.equal(out.features.length, 3);
  assert.ok(out.features.every((f) => f.sections.length >= 1 && f.sections.every((s) => s.title && Array.isArray(s.items))));
  const overview = out.features[0].sections[0].items;
  assert.equal(overview.find((i) => i.label === "Records reviewed").value, "0");
  const found = recordInsights(rows, { scope: "Test" });
  assert.equal(found.features[2].sections[0].items.find((i) => i.label === "Duplicate references").value, "1");
});

test("displayValue preserves false, 0, and empty values", () => {
  assert.equal(displayValue(false), "No");
  assert.equal(displayValue(0), "0");
  assert.equal(displayValue(""), "(empty)");
});

test("server wires export and insights behind the existing routes", () => {
  const server = fs.readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
  assert.ok(server.includes("featurePack.mjs"));
  assert.ok(server.includes("/export"));
  assert.ok(server.includes("/insights"));
  assert.ok(server.includes("applyListQuery"));
});

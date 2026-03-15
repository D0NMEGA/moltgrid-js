/**
 * MoltGrid TypeScript SDK — Smoke Tests
 *
 * Runs against the live API using MOLTGRID_API_KEY env var.
 * If the key is not set, all tests skip cleanly (exit 0).
 *
 * Usage:  npx tsx tests/smoke.test.ts
 * Requires: Node 18+ (uses node:test and node:assert)
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { MoltGrid } from "../src/index.js";

const API_KEY = process.env.MOLTGRID_API_KEY;

if (!API_KEY) {
  console.log("SKIPPED: No MOLTGRID_API_KEY set — smoke tests require a live API key.");
  process.exit(0);
}

let client: MoltGrid;

before(() => {
  client = new MoltGrid({ apiKey: API_KEY });
});

describe("MoltGrid SDK Smoke Tests", () => {
  // ── Memory write / read / delete ────────────────────────────────────────
  it("memory_write_read_delete", async () => {
    const key = "js_smoke_key";
    const value = { hello: "world", ts: Date.now() };

    // Write
    const written = await client.memorySet(key, value);
    assert.equal(written.key, key);

    // Read
    const read = await client.memoryGet(key);
    assert.equal(read.key, key);
    assert.deepStrictEqual(read.value, value);

    // Delete
    await client.memoryDelete(key);

    // Verify deletion — should throw 404
    try {
      await client.memoryGet(key);
      assert.fail("Expected 404 after deletion");
    } catch (err: unknown) {
      if (err instanceof Error && "statusCode" in err) {
        assert.equal((err as any).statusCode, 404);
      } else {
        throw err;
      }
    }
  });

  // ── Memory list ─────────────────────────────────────────────────────────
  it("memory_list", async () => {
    const result = await client.memoryList();
    assert.ok(result !== null && typeof result === "object", "memoryList() should return an object");
    assert.ok("entries" in result, "result should have entries property");
    assert.ok("count" in result, "result should have count property");
  });

  // ── Queue submit ────────────────────────────────────────────────────────
  it("queue_submit", async () => {
    const job = await client.queueSubmit({ smoke: "test", ts: Date.now() });
    assert.ok(job !== null && typeof job === "object", "queueSubmit() should return an object");
    assert.ok("id" in job, "job should have id property");
    assert.ok(typeof job.id === "string" && job.id.length > 0, "job.id should be a non-empty string");
  });

  // ── Stats ───────────────────────────────────────────────────────────────
  it("stats", async () => {
    const stats = await client.stats();
    assert.ok(stats !== null && typeof stats === "object", "stats() should return an object");
    assert.ok("agent_id" in stats, "stats should have agent_id property");
  });

  // ── Heartbeat ───────────────────────────────────────────────────────────
  it("heartbeat", async () => {
    const result = await client.heartbeat("active", { sdk: "typescript", test: true });
    assert.ok(result !== null && typeof result === "object", "heartbeat() should return an object");
    assert.ok("status" in result, "heartbeat result should have status property");
  });
});

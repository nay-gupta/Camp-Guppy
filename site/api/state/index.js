"use strict";

/*
 * GET  /api/state            -> { act: <number> }   (public; players poll this)
 * POST /api/state            -> { act: <number> }   (host only)
 *      headers: x-host-key: <HOST_KEY>
 *      body:    { "act": <number> }
 *
 * State is stored in Azure Table Storage so it survives across function
 * instances. Configure these Application Settings on the Static Web App:
 *   - AZURE_STORAGE_CONNECTION_STRING  (a Storage account connection string)
 *   - HOST_KEY                         (a secret only you, the host, know)
 */

const { TableClient } = require("@azure/data-tables");

const TABLE_NAME = "gamestate";
const PARTITION = "game";
const ROW = "current";
const MAX_ACT = 5; // Intro, Act I, Act II, Act III, Accusation, Finale

let cachedClient = null;

function getClient() {
  if (cachedClient) return cachedClient;
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!conn) throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set");
  cachedClient = TableClient.fromConnectionString(conn, TABLE_NAME);
  return cachedClient;
}

async function ensureTable(client) {
  try {
    await client.createTable();
  } catch (e) {
    // 409 Conflict means it already exists — that's fine.
    if (!e || e.statusCode !== 409) {
      // Some SDK versions throw "TableAlreadyExists"; ignore those too.
      if (!e || !/AlreadyExists/i.test(String(e.message || e))) throw e;
    }
  }
}

async function readAct(client) {
  try {
    const entity = await client.getEntity(PARTITION, ROW);
    const act = Number(entity.act);
    return Number.isFinite(act) ? act : 0;
  } catch (e) {
    if (e && e.statusCode === 404) return 0; // not set yet
    throw e;
  }
}

module.exports = async function (context, req) {
  const json = (status, body) => {
    context.res = {
      status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body,
    };
  };

  try {
    const client = getClient();
    await ensureTable(client);

    if (req.method === "GET") {
      const act = await readAct(client);
      return json(200, { act });
    }

    // POST — host only
    const provided = req.headers["x-host-key"] || "";
    const expected = process.env.HOST_KEY || "";
    if (!expected) {
      return json(500, { error: "HOST_KEY is not configured on the server." });
    }
    if (provided !== expected) {
      return json(401, { error: "Unauthorized" });
    }

    let act = Number(req.body && req.body.act);
    if (!Number.isFinite(act)) act = 0;
    act = Math.max(0, Math.min(MAX_ACT, Math.round(act)));

    await client.upsertEntity(
      { partitionKey: PARTITION, rowKey: ROW, act },
      "Replace"
    );
    return json(200, { act });
  } catch (err) {
    context.log.error("state function error:", err);
    return json(500, { error: "Server error" });
  }
};

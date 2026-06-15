"use strict";

/*
 * GET  /api/state            -> { act: <number>, blackoutUntil: <number> }
 *                               (public; players poll this)
 * POST /api/state            -> { act, blackoutUntil }   (host controls)
 *      body:    { "act": <number> }            advance the live phase
 *      body:    { "blackoutUntil": <epochMs> } start/extend the blackout timer
 *      body:    { "blackoutUntil": 0 }         clear the blackout
 *
 * State is stored in Azure Table Storage so it survives across function
 * instances. Configure this Application Setting on the Static Web App:
 *   - AZURE_STORAGE_CONNECTION_STRING  (a Storage account connection string)
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

async function readState(client) {
  try {
    const entity = await client.getEntity(PARTITION, ROW);
    const act = Number(entity.act);
    const blackoutUntil = Number(entity.blackoutUntil);
    return {
      act: Number.isFinite(act) ? act : 0,
      blackoutUntil: Number.isFinite(blackoutUntil) ? blackoutUntil : 0,
    };
  } catch (e) {
    if (e && e.statusCode === 404) return { act: 0, blackoutUntil: 0 }; // not set yet
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
      const state = await readState(client);
      return json(200, state);
    }

    // POST — host controls (advance phase and/or set the blackout timer).
    const current = await readState(client);
    const body = req.body || {};
    let { act, blackoutUntil } = current;

    if (body.act !== undefined) {
      let a = Number(body.act);
      if (!Number.isFinite(a)) a = 0;
      act = Math.max(0, Math.min(MAX_ACT, Math.round(a)));
    }

    if (body.blackoutUntil !== undefined) {
      let b = Number(body.blackoutUntil);
      blackoutUntil = Number.isFinite(b) && b > 0 ? Math.round(b) : 0;
    }

    await client.upsertEntity(
      { partitionKey: PARTITION, rowKey: ROW, act, blackoutUntil },
      "Replace"
    );
    return json(200, { act, blackoutUntil });
  } catch (err) {
    context.log.error("state function error:", err);
    return json(500, { error: "Server error" });
  }
};

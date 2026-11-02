// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

function parseAmount(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/,/g, "").trim());
  return NaN;
}

const latest = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split(/\r?\n/);
for (const line of lines) {
  if (line.trim() === "") continue;

  let event;
  try {
    event = JSON.parse(line);
  } catch {
    continue;
  }

  if (!event || typeof event !== "object" || Array.isArray(event)) continue;
  if (event.txn_id == null || event.txn_id === "") continue;

  const ts = Date.parse(event.ts);
  const previous = latest.get(event.txn_id);
  if (!previous || ts > previous.ts) {
    latest.set(event.txn_id, {
      ts,
      status: event.status,
      amount: parseAmount(event.amount),
    });
  }
}

let count = 0;
let kobo = 0;
for (const event of latest.values()) {
  if (event.status !== "success") continue;
  count += 1;
  kobo += Math.round(event.amount * 100);
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(kobo / 100)}`);
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { asyncHandler } from "../src/lib/asyncHandler.js";

test("asyncHandler catches async rejections", async () => {
  let logged = null;
  const orig = console.error;
  console.error = (err) => { logged = err; };
  try {
    asyncHandler(async () => { throw new Error("falló"); })();
    await new Promise((r) => setTimeout(r, 0));
    assert.ok(logged instanceof Error);
    assert.equal(logged.message, "falló");
  } finally {
    console.error = orig;
  }
});

test("asyncHandler normalizes Event rejections", async () => {
  let logged = null;
  const orig = console.error;
  console.error = (err) => { logged = err; };
  try {
    asyncHandler(() => Promise.reject(new Event("click")))();
    await new Promise((r) => setTimeout(r, 0));
    assert.ok(logged instanceof Error);
    assert.match(logged.message, /event/i);
  } finally {
    console.error = orig;
  }
});

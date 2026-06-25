import { test } from "node:test";
import assert from "node:assert/strict";
import { getSiteUrl, absoluteUrl, websiteJsonLd, siteConfig } from "../src/lib/seo.js";

test("getSiteUrl prefers NEXT_PUBLIC_APP_URL", () => {
  const prev = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://red-ayudas.vercel.app/";
  assert.equal(getSiteUrl(), "https://red-ayudas.vercel.app");
  process.env.NEXT_PUBLIC_APP_URL = prev;
});

test("absoluteUrl builds paths", () => {
  const prev = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
  assert.equal(absoluteUrl("/docs/api"), "https://example.com/docs/api");
  process.env.NEXT_PUBLIC_APP_URL = prev;
});

test("websiteJsonLd includes WebSite and WebApplication", () => {
  const prev = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
  const data = websiteJsonLd();
  assert.equal(data["@graph"].length, 2);
  assert.equal(data["@graph"][0]["@type"], "WebSite");
  assert.equal(data["@graph"][1]["@type"], "WebApplication");
  assert.ok(siteConfig.keywords.length >= 5);
  process.env.NEXT_PUBLIC_APP_URL = prev;
});

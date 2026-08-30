import test from "node:test";
import assert from "node:assert/strict";
import { matchesPendingApplicationSearch } from "./pendingApplicationsSearch.js";

test("matches pending application search by application number, name, and RSA PIN", () => {
  const app = {
    applicationNumber: "APP-1001",
    firstName: "Ada",
    lastName: "Lovelace",
    rsaPin: "1234567890",
  };

  assert.equal(matchesPendingApplicationSearch(app, "APP-1001"), true);
  assert.equal(matchesPendingApplicationSearch(app, "ada lovelace"), true);
  assert.equal(matchesPendingApplicationSearch(app, "1234567890"), true);
  assert.equal(matchesPendingApplicationSearch(app, "missing"), false);
});

test("handles missing values safely", () => {
  const app = {
    applicationNumber: null,
    firstName: "Grace",
    lastName: "Hopper",
    rsaPin: null,
  };

  assert.equal(matchesPendingApplicationSearch(app, "grace hopper"), true);
  assert.equal(matchesPendingApplicationSearch(app, "abc123"), false);
});

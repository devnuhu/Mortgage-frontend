import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeRsaPinForCheck,
  formatRsaPinAvailabilityResponse,
} from "./application-api.js";

test("normalizes RSA PINs for duplicate checks and rejects empty values", () => {
  assert.equal(normalizeRsaPinForCheck("penABCD12345678"), "PENABCD12345678");
  assert.equal(
    normalizeRsaPinForCheck("  penABCD12345678  "),
    "PENABCD12345678",
  );
  assert.throws(() => normalizeRsaPinForCheck(""), /cannot be empty/i);
});

test("formats duplicate responses with user-friendly details", () => {
  const result = formatRsaPinAvailabilityResponse({
    exists: true,
    message: "An active application already exists with this RSA PIN",
    applicationId: "guid-123",
    applicationNumber: "APP-123456",
    status: "submitted",
    borrowerName: "John Doe",
  });

  assert.equal(result.exists, true);
  assert.match(
    result.message,
    /An active application already exists with this RSA PIN/i,
  );
  assert.match(result.message, /John Doe/i);
  assert.match(result.message, /APP-123456/i);
});

import test from "node:test";
import assert from "node:assert/strict";
import { normalizePaginationParams } from "./application-api.js";

test("normalizes pagination values to safe numbers", () => {
  assert.deepEqual(normalizePaginationParams({ pageNumber: 1 }, 20, 20), {
    pageNumber: 1,
    pageSize: 20,
  });

  assert.deepEqual(normalizePaginationParams("3", "5", 20), {
    pageNumber: 3,
    pageSize: 5,
  });
});

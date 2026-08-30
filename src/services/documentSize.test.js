import test from "node:test";
import assert from "node:assert/strict";

import {
  getDocumentMaxFileSizeBytes,
  getDocumentMaxFileSizeLabel,
  sortDocumentsByDocumentTypeDisplayOrder,
} from "./documentSize.js";

test("CONFIRMATION_OF_AVAILABILITY allows 700KB uploads", () => {
  assert.equal(
    getDocumentMaxFileSizeBytes("CONFIRMATION_OF_AVAILABILITY"),
    700 * 1024,
  );
  assert.equal(
    getDocumentMaxFileSizeLabel("CONFIRMATION_OF_AVAILABILITY"),
    "700KB",
  );
});

test("PROPERTY_TITLE_DOCUMENT allows 700KB uploads", () => {
  assert.equal(
    getDocumentMaxFileSizeBytes("PROPERTY_TITLE_DOCUMENT"),
    700 * 1024,
  );
  assert.equal(getDocumentMaxFileSizeLabel("PROPERTY_TITLE_DOCUMENT"), "700KB");
});

test("all other document codes use 700KB limit", () => {
  assert.equal(getDocumentMaxFileSizeBytes("IDENTITY_DOCUMENT"), 700 * 1024);
  assert.equal(getDocumentMaxFileSizeLabel("IDENTITY_DOCUMENT"), "700KB");
});

test("documents follow displayOrder from document types endpoint", () => {
  const documentTypes = [
    { code: "IDENTITY_DOCUMENT", displayOrder: 2 },
    { code: "CONFIRMATION_OF_AVAILABILITY", displayOrder: 1 },
    { code: "PROPERTY_TITLE_DOCUMENT", displayOrder: 3 },
  ];

  const documents = [
    { id: "doc-2", documentType: "IDENTITY_DOCUMENT" },
    { id: "doc-1", documentType: "CONFIRMATION_OF_AVAILABILITY" },
    { id: "doc-3", documentType: "PROPERTY_TITLE_DOCUMENT" },
  ];

  const sorted = sortDocumentsByDocumentTypeDisplayOrder(
    documents,
    documentTypes,
  );

  assert.deepEqual(
    sorted.map((doc) => doc.id),
    ["doc-1", "doc-2", "doc-3"],
  );
});

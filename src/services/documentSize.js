const DOCUMENT_MAX_SIZE_KB = 700;

export const getDocumentMaxFileSizeBytes = (documentCode) => {
  return DOCUMENT_MAX_SIZE_KB * 1024;
};

export const getDocumentMaxFileSizeLabel = (documentCode) => {
  return "700KB";
};

export const sortDocumentsByDocumentTypeDisplayOrder = (
  documents = [],
  documentTypes = [],
) => {
  const orderByCode = new Map(
    documentTypes.map((type) => [
      String(type.code || "").toUpperCase(),
      Number(type.displayOrder ?? Number.MAX_SAFE_INTEGER),
    ]),
  );

  return [...documents].sort((a, b) => {
    const aOrder =
      orderByCode.get(String(a.documentType || "").toUpperCase()) ??
      Number.MAX_SAFE_INTEGER;
    const bOrder =
      orderByCode.get(String(b.documentType || "").toUpperCase()) ??
      Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return String(a.documentType || "").localeCompare(
      String(b.documentType || ""),
    );
  });
};

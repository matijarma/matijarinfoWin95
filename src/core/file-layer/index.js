const DEFAULT_DOCUMENTS = [
  {
    id: "welcome-note",
    name: "WELCOME.TXT",
    content:
      "Welcome to my portfolio OS simulation. This layer will host project files, docs, and hidden content.",
  },
];

export function createFileLayer({ seedDocuments = DEFAULT_DOCUMENTS } = {}) {
  const documents = new Map(
    seedDocuments.map((documentEntry) => [documentEntry.id, { ...documentEntry }]),
  );

  function listDocuments() {
    return Array.from(documents.values()).map((documentEntry) => ({
      ...documentEntry,
    }));
  }

  function getDocument(documentId) {
    const documentEntry = documents.get(documentId);
    return documentEntry ? { ...documentEntry } : null;
  }

  function upsertDocument(documentEntry) {
    if (!documentEntry?.id) {
      throw new Error("upsertDocument requires a document object with an id.");
    }

    documents.set(documentEntry.id, { ...documentEntry });

    return getDocument(documentEntry.id);
  }

  return {
    listDocuments,
    getDocument,
    upsertDocument,
  };
}

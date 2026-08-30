export const matchesPendingApplicationSearch = (app = {}, searchTerm = "") => {
  const lowerSearch = String(searchTerm || "")
    .trim()
    .toLowerCase();
  if (!lowerSearch) return true;

  const appNumber = String(
    app?.applicationNumber || app?.id || "",
  ).toLowerCase();
  const fullName = `${app?.firstName || ""} ${app?.lastName || ""}`
    .trim()
    .toLowerCase();
  const rsaPin = String(app?.rsaPin || "").toLowerCase();

  return (
    appNumber.includes(lowerSearch) ||
    fullName.includes(lowerSearch) ||
    rsaPin.includes(lowerSearch)
  );
};

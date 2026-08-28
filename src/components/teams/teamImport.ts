export const normalizeImportIds = (value: string) => {
  const content = value.includes("=>") ? value.slice(value.lastIndexOf("=>") + 2) : value;
  return content.split(/[;\s,]+/).map((id) => id.trim()).filter((id) => /^\d+$/.test(id)).join(";");
};

export const BIN_TYPES = [
  "metal",
  "paper",
  "glass",
  "plastic",
  "mixed",
  "compost",
  "cardboard",
  "batteries",
  "food",
  "cigarettes",
] as const;

export type BinType = (typeof BIN_TYPES)[number];

export function inferBinFromLabel(itemText: string): BinType {
  const t = itemText.toLowerCase();
  if (t.includes("battery")) return "batteries";
  /* Recycling-Net-11 & similar model outputs */
  if (t.includes("polystyrene") || t.includes("styrofoam")) return "plastic";
  if (t.includes("takeaway cups")) return "mixed";
  if (t.includes("disposable plates")) return "mixed";
  if (t.includes("pet") || t.includes("plastic")) return "plastic";
  if (t.includes("paper") || t.includes("trace")) return "paper";
  if (t.includes("can") || t.includes("aluminum") || t.includes("aluminium"))
    return "metal";
  if (t.includes("glass")) return "glass";
  if (t.includes("food") || t.includes("leftover")) return "food";
  if (t.includes("cigarette")) return "cigarettes";
  if (t.includes("cardboard")) return "cardboard";
  if (t.includes("compost") || t.includes("organic")) return "compost";
  return "mixed";
}

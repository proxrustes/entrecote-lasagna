export type RangeKey = "today" | "week" | "month" | "year";

export function mapRangeKeyToPeriod(k: RangeKey) {
  switch (k) {
    case "today":
      return "1day";
    case "week":
      return "1week";
    case "month":
      return "1month";
    case "year":
      return "1year";
    default:
      return "1month";
  }
}

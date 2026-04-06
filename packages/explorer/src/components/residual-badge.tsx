export function ResidualBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">{"\u2013"}</span>;
  const cls = value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "";
  return (
    <span className={`font-semibold tabular-nums ${cls}`}>
      {value > 0 ? "+" : ""}{value}
    </span>
  );
}

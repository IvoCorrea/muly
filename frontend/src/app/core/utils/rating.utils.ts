export function formatRating(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  const rounded = Math.round(value * 100) / 100;
  if (Math.abs(Math.round(rounded * 10) - rounded * 10) < 0.001) {
    return rounded.toFixed(1);
  }
  return rounded.toFixed(2);
}

export function formatDate(input: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(input));
}

export function percent(completed: number, goal: number) {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((completed / goal) * 100));
}

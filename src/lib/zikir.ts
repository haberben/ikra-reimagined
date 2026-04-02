/**
 * Zikir logging and analytics utilities
 */

export interface ZikirLogEntry {
  [date: string]: {
    [zikirName: string]: number;
  };
}

export function getZikirLogs(): ZikirLogEntry {
  try {
    return JSON.parse(localStorage.getItem("ikra_zikir_logs") || "{}");
  } catch {
    return {};
  }
}

export function logZikir(zikirName: string, count: number = 1) {
  const logs = getZikirLogs();
  const today = new Date().toISOString().split('T')[0];

  if (!logs[today]) {
    logs[today] = {};
  }

  logs[today][zikirName] = (logs[today][zikirName] || 0) + count;
  localStorage.setItem("ikra_zikir_logs", JSON.stringify(logs));
  
  // Also update global total for compatibility
  const globalTotal = parseInt(localStorage.getItem("ikra_zikir_total") || "0", 10);
  localStorage.setItem("ikra_zikir_total", (globalTotal + count).toString());
}

export function getDailyTotal(date: string): number {
  const logs = getZikirLogs();
  const dayData = logs[date];
  if (!dayData) return 0;
  return Object.values(dayData).reduce((sum, val) => sum + val, 0);
}

export function getLast7DaysData() {
  const logs = getZikirLogs();
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('tr-TR', { weekday: 'short' });
    data.push({
      date: dateStr,
      label: dayLabel,
      total: getDailyTotal(dateStr)
    });
  }
  return data;
}

export function getPinnedZikir() {
  try {
    return JSON.parse(localStorage.getItem("ikra_pinned_zikir") || '{"name": "Genel Zikir", "target": null}');
  } catch {
    return { name: "Genel Zikir", target: null };
  }
}

export function setPinnedZikir(name: string, target: number | null) {
  localStorage.setItem("ikra_pinned_zikir", JSON.stringify({ name, target }));
}

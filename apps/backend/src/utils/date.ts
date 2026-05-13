export const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const addDays = (days: number, date = new Date()) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
};
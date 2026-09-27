const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const randomLetter = () => LETTERS[Math.floor(Math.random() * LETTERS.length)];

export const createInvoiceId = () =>
  randomLetter() +
  randomLetter() +
  Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

export const todayIso = () => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

export const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

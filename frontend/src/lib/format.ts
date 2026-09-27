const amount = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const formatDecimal = (value: number) => amount.format(value);

export const formatAmount = (value: number) => `£ ${formatDecimal(value)}`;

export const formatDay = (isoDate: string) => {
  if (!isoDate) return "";

  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day} ${MONTHS[Number(month) - 1]} ${year}`;
};

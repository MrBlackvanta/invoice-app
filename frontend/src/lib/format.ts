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

export const formatAmount = (value: number) => `£ ${amount.format(value)}`;

export const formatDay = (isoDate: string) => {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day} ${MONTHS[Number(month) - 1]} ${year}`;
};

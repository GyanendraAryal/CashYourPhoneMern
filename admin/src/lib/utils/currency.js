/**
 * Simple Nepali formatting utility for currency
 */
export const formatNPR = (amount) => {
  if (amount === undefined || amount === null) return "NPR 0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "NPR",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount).replace("NPR", "NPR ");
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat("en-IN").format(num);
};

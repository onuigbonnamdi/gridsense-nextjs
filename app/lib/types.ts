export type Notice = {
  title: string;
  body?: string;
  tone?: "info" | "warn" | "good" | "bad";
};
export type AddressItem = { label: string; raw?: any };
export type ClaimedHome = {
  key: string;
  address: string;
  postcode: string;
  claimedBy: string;
  claimedAt: string;
};

export const BI_KEY = "gridsense_free_bi_postcodes";
export const HOME_KEY = "gridsense_free_home_claims_local";

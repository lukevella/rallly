export type DateInput = Date | number;

// The formatting layer's own TimeFormat; same literals as the Prisma enum so
// user records assign directly, without coupling this layer to the database.
export type TimeFormat = "hours12" | "hours24";

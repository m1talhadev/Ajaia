// The user fields that may be shown to other users.
export const userSummarySelect = { id: true, name: true, email: true } as const;

export type UserSummary = { id: string; name: string; email: string };

// Plain module (no "use server"): shared result type for account actions.
export type ApplyActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

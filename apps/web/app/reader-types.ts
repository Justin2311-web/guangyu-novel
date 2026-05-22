// Plain (non-"use server") module: shared result types for the reader
// server actions. A "use server" file may only export async functions.
export type BookmarkToggleResult = {
  ok: boolean;
  bookmarked?: boolean;
  needLogin?: boolean;
  error?: string;
};

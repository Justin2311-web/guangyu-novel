// Plain (non-"use server") module: a "use server" file may only export async
// functions, so shared types for the user actions live here instead.
export type UserActionResult = { ok: boolean; error?: string };

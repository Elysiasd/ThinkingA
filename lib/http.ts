import { ZodError } from "zod";

export function jsonError(error: unknown, status = 400) {
  if (error instanceof ZodError) {
    return Response.json(
      {
        error: "Invalid request",
        details: error.issues.map((issue) => issue.message),
      },
      { status }
    );
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  return Response.json({ error: message }, { status });
}

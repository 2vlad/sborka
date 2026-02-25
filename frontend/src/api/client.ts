export async function createSession(userRequest: string): Promise<string> {
  const res = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_request: userRequest }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create session: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { session_id: string };
  return data.session_id;
}

export async function triggerGenerate(sessionId: string, skillLevel?: number): Promise<void> {
  const res = await fetch(`/api/sessions/${sessionId}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skill_level: skillLevel ?? null }),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to trigger generation: ${res.status} ${res.statusText}`,
    );
  }
}

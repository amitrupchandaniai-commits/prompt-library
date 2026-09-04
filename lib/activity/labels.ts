export const ACTION_LABELS: Record<string, string> = {
  "prompt.created": "Created a prompt",
  "prompt.updated": "Updated a prompt",
  "prompt.archived": "Archived a prompt",
  "prompt.unarchived": "Unarchived a prompt",
  "prompt.deleted": "Deleted a prompt",
  "prompt.version_restored": "Restored a previous prompt version",
  "collection.created": "Created a collection",
  "collection.deleted": "Deleted a collection",
  "source.created": "Added a Prompt Scout source",
  "source.enabled": "Enabled a source",
  "source.disabled": "Disabled a source",
  "source.deleted": "Deleted a source",
  "google.disconnected": "Disconnected Google",
  "scout_run.started": "Ran Prompt Scout",
  "trends.detected": "Ran trend detection",
  "scout_candidate.approved": "Approved a Prompt Scout candidate",
  "scout_candidate.rejected": "Rejected a Prompt Scout candidate",
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

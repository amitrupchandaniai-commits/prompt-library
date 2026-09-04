import { describe, expect, it } from "vitest"
import { actionLabel } from "@/lib/activity/labels"

const KNOWN_ACTIONS = [
  "prompt.created",
  "prompt.updated",
  "prompt.archived",
  "prompt.unarchived",
  "prompt.deleted",
  "prompt.version_restored",
  "collection.created",
  "collection.deleted",
  "source.created",
  "source.enabled",
  "source.disabled",
  "source.deleted",
  "google.disconnected",
  "scout_run.started",
  "scout_candidate.approved",
  "scout_candidate.rejected",
]

describe("actionLabel", () => {
  it("maps every currently-logged action to a non-empty, human-readable label", () => {
    for (const action of KNOWN_ACTIONS) {
      const label = actionLabel(action)
      expect(label.length).toBeGreaterThan(0)
      expect(label).not.toBe(action)
    }
  })

  it("falls back to the raw action string for an unmapped value", () => {
    expect(actionLabel("some_future.action")).toBe("some_future.action")
  })
})

// Temporary UI release flags. These hide not-yet-production modules WITHOUT
// deleting any code — flip a flag back to `true` to re-enable in a future
// release. (Distinct from per-gym FeatureFlags; these are app-wide release
// gates owned by the frontend.)
export const RELEASE_FLAGS = {
  /**
   * Broadcast module (Gym Admin). Hidden for this release — not production
   * ready. Re-enable by setting to `true`; the page/route/nav all come back.
   */
  broadcast: false,
};

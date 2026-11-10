// Runs a task after the response is sent. On Vercel it is waitUntil, which
// keeps the function alive until the task ends; the tests keep the task to
// await it.
export type RunInBackground = (task: () => Promise<unknown>) => void;

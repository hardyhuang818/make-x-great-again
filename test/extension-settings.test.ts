import assert from "node:assert/strict";
import { test } from "node:test";

const settingsModulePath = "../extension/lib/settings.ts";
const { getSettings, setSetting } = (await import(settingsModulePath)) as {
  getSettings: () => Promise<{ actionMode: "local" | "mute" | "block" }>;
  setSetting: (key: "actionMode", value: "local" | "mute" | "block") => Promise<void>;
};

type StorageState = Record<string, unknown>;

function installChromeStorage(initial: StorageState = {}): StorageState {
  const state: StorageState = { ...initial };
  const local = {
    async get(keys: string | string[]) {
      if (Array.isArray(keys)) {
        return Object.fromEntries(keys.map((key) => [key, state[key]]));
      }
      return { [keys]: state[keys] };
    },
    async set(items: StorageState) {
      Object.assign(state, items);
    },
  };

  (globalThis as typeof globalThis & { chrome: unknown }).chrome = {
    storage: {
      local,
      onChanged: {
        addListener() {},
        removeListener() {},
      },
    },
  };

  return state;
}

test("settings migrate legacy local mode to native block once", async () => {
  const state = installChromeStorage({
    "xss:settings": {
      enabled: true,
      bubble: true,
      bubblePos: "tr",
      actionMode: "local",
      edgeBase: "",
    },
  });

  assert.equal((await getSettings()).actionMode, "block");
  assert.equal((state["xss:settings"] as { actionMode: string }).actionMode, "block");
  assert.equal(state["xss:settings:block-default-v1"], true);

  await setSetting("actionMode", "local");

  assert.equal((await getSettings()).actionMode, "local");
  assert.equal((state["xss:settings"] as { actionMode: string }).actionMode, "local");
});

test("settings default to native block on fresh installs", async () => {
  installChromeStorage();

  assert.equal((await getSettings()).actionMode, "block");
});

import path from "node:path"
import process from "node:process"
import type { LowSync } from "lowdb"
import { JSONFileSyncPreset } from "lowdb/node"
import type { JsonValue } from "type-fest"

interface State {
  [host: string]: {
    [plugin: string]: {
      state: JsonValue
    }
  }
}

class StateDb {
  readonly #db: LowSync<State>

  public constructor() {
    this.#db = JSONFileSyncPreset<State>(
      path.join(Bun.env["SESAME_ROOT_DIR"] ?? process.cwd(), "sesame.state.json"),
      {},
    )
  }

  public get(host: string, pluginName: string) {
    return this.#db.data[host]?.[pluginName]?.state
  }

  /**
   * Update the state for a given host and plugin
   *
   * @param host The host to update the state for
   * @param pluginName The name of the plugin to update the state for
   * @param state The state to update the plugin with
   */
  public set(host: string, pluginName: string, state: JsonValue) {
    this.#db.update((data) => {
      data[host] ??= {}
      data[host][pluginName] = { state }
    })
  }
}

export const db = new StateDb()

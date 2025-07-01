import { type } from "arktype"
import type { PluginContext } from "@/core/main.ts"

type AsyncOrSync<T> = Promise<T> | T

const pluginDetails = type({
  name: "string",
  /** @default true */
  "printDiff?": "boolean",
})
type PluginDetails = typeof pluginDetails.infer

type PluginInput<Input> = () => Input

type PluginTransform<Input, TInput> = (input: Input) => AsyncOrSync<TInput>

type PluginDiff<TInput, Diff> = (
  ctx: PluginContext,
  // previous is undefined if the plugin has no previous state (e.g. first run)
  // previous is null if the plugin's saved state is null (i.e. the plugin takes no (or optional) input)
  previous: TInput | undefined | null,
  input: TInput,
) => AsyncOrSync<Diff | undefined>

type PluginHandle<Diff, TInput> = (ctx: PluginContext, diff: Diff, input: TInput) => AsyncOrSync<void>

type PluginUpdate = (ctx: PluginContext) => AsyncOrSync<void>

/*
  We can't use unknown here as the default for the type arguments. The plugins array of HostConfig is typed as PluginInstance[], which naturally would be PluginInstance<unknown, unknown, unknown>[] if we used unknown.
  So when passing in a PluginInstance (which, for example, might be typed as <string, string, string>) to the plugins array,
  TypeScript correctly complains that <string, string, string> is not assignable to <unknown, unknown, unknown>.
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PluginInstance<Input = any, TInput = Input, Diff = any> {
  details: PluginDetails
  input: PluginInput<Input>
  transform: PluginTransform<Input, TInput> | undefined
  diff: PluginDiff<TInput, Diff> | undefined
  handle: PluginHandle<Diff, TInput> | undefined
  update: PluginUpdate | undefined
}

// diff and handle are required despite them being typed with "| undefined". We enforce them in the schema instead of in PluginBuilder.

// We would like to infer the PluginInstance type from the schema, but it's not entirely clear how to do that when the type has generics.
const pluginInstanceSchema = type({
  "+": "reject",
  details: pluginDetails,
  input: type("Function"),
  transform: type("Function").or("undefined"),
  diff: type("Function"),
  handle: type("Function"),
  update: type("Function").or("undefined"),
}).as<PluginInstance>()

const hostConfigSchema = type({
  host: "string",
  user: "string?",
  port: "number?",
  plugins: pluginInstanceSchema
    .array()
    .atLeastLength(1)
    .narrow((plugins, ctx) => {
      // Every plugin must have a unique name
      const pluginNames = plugins.map((plugin) => plugin.details.name)
      const uniqueNames = new Set(pluginNames)
      const arePluginNamesUnique = uniqueNames.size === pluginNames.length

      if (!arePluginNamesUnique) {
        const duplicatePluginName = pluginNames.find((name, index) => pluginNames.indexOf(name) !== index)
        return ctx.reject({
          message: `duplicate plugin found for ${ctx.propString}: ${duplicatePluginName ?? "unknown"}`,
        })
      }

      return true
    }),
}).describe("a host config object")

const sesameConfigSchema = type
  .Record("string", hostConfigSchema)
  .narrow((config) => Object.keys(config).length > 0)
  .describe("an object of only host config objects")
type SesameConfig = typeof sesameConfigSchema.infer

export { sesameConfigSchema }
export type {
  PluginDetails,
  PluginDiff,
  PluginHandle,
  PluginInput,
  PluginInstance,
  PluginTransform,
  PluginUpdate,
  SesameConfig,
}

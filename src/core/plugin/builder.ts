import type {
  PluginDetails,
  PluginDiff,
  PluginHandle,
  PluginInstance,
  PluginTransform,
  PluginUpdate,
} from "@/core/config/schema.ts"

/*
  PluginBuilder returns a Plugin (via the build() method). This is used for authoring plugins.
  A Plugin is a function that takes some input and returns a PluginInstance. A Plugin is what users call in their Sesame config.
  A PluginInstance is an object that contains the details, input, and functions of a Plugin. This is used by Sesame to execute the plugin.

  PluginBuilder (author) -> Plugin (user) -> PluginInstance (Sesame)
*/

/**
 * A plugin is a function that takes its input and returns a PluginInstance
 */
type Plugin<Input, TInput, Diff> = undefined extends Input // if Input is undefined or contains undefined
  ? (input?: Input) => PluginInstance<Input, TInput, Diff> // then input is optional
  : (input: Input) => PluginInstance<Input, TInput, Diff> // else, input is required

class PluginBuilder<Input = undefined, TInput = Input, Diff = unknown> {
  private readonly details: PluginDetails
  private transformFn?: PluginTransform<Input, TInput>
  private diffFn?: PluginDiff<TInput, Diff>
  private handleFn?: PluginHandle<Diff, TInput>
  private updateFn?: PluginUpdate

  private constructor(details: PluginDetails) {
    this.details = {
      ...details,
      printDiff: details.printDiff ?? true,
    }
  }

  // We use a static method to create a new PluginBuilder instead of making the constructor public
  // because we want to prevent users from passing in types for TInput and Diff since those types are inferred from their respective functions
  public static new<Input = undefined>(details: PluginDetails): PluginBuilder<Input> {
    return new PluginBuilder<Input>(details)
  }

  public transform<NewTInput>(fn: PluginTransform<Input, NewTInput>) {
    const builder = new PluginBuilder<Input, NewTInput, Diff>(this.details)
    builder.transformFn = fn
    return builder
  }

  public diff<NewDiff>(fn: PluginDiff<TInput, NewDiff>) {
    // Create a new builder with the same input type but new diff type
    const builder = new PluginBuilder<Input, TInput, NewDiff>(this.details)
    if (this.transformFn) builder.transformFn = this.transformFn
    builder.diffFn = fn
    return builder
  }
  public handle(fn: PluginHandle<Diff, TInput>) {
    this.handleFn = fn
    return this
  }

  public update(fn: PluginUpdate) {
    this.updateFn = fn
    return this
  }

  public build(): Plugin<Input, TInput, Diff> {
    const { details, transformFn, diffFn, handleFn, updateFn } = this

    const plugin = (input: Input) => ({
      details,
      input: () => input,
      transform: transformFn,
      diff: diffFn,
      handle: handleFn,
      update: updateFn,
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return plugin as Plugin<Input, TInput, Diff>
  }
}

export { PluginBuilder }

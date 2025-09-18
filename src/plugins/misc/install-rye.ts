import os from "node:os"
import path from "node:path"
import { $ } from "bun"

import { PluginBuilder } from "@/core/plugin/builder.ts"

interface InstallRyeOptions {
  pythonVersion?: string
}

// TODO: fix

const installRye = PluginBuilder.new<InstallRyeOptions>({ name: "Install Rye" })
  .diff<InstallRyeOptions>((_, previous, input) => {
    if (!previous) return
    if (previous.pythonVersion === input.pythonVersion) return
    return {
      pythonVersion: input.pythonVersion ?? "3.12",
    }
  })
  .handle(async (_, options) => {
    await $`RYE_TOOLCHAIN_VERSION="${options.pythonVersion}" RYE_INSTALL_OPTION="--yes" /bin/bash -c "$(curl -fsSL https://rye.astral.sh/get)"`
    // https://github.com/oven-sh/bun/issues/9747
    const ryePath = path.join(os.homedir(), ".rye", "shims", "rye")
    await $`${ryePath} config --set-bool behavior.global-python=true`
    await $`${ryePath} config --set default.toolchain=${options.pythonVersion}`
    await $`${ryePath} toolchain fetch ${options.pythonVersion}`
    await $`${ryePath} self completion -s fish >~/.config/fish/completions/rye.fish`
  })
  .update(() => {
    return
  })
  .build()

export { installRye }

import { createPlugin } from "@/plugin.ts"
import { $ } from "bun"

const installFish = createPlugin<null, true>(
  { name: "Install Fish", printDiff: false },
  {
    diff: () => {
      return Bun.which("fish") ? undefined : true
    },
    handle: async () => {
      console.info("Fish is not installed. Installing...")
      await $`brew install fish`
      await $`mkdir -p ~/.config/fish/conf.d/`
      await $`$HOMEBREW_PREFIX/bin/brew shellenv fish >~/.config/fish/conf.d/homebrew.fish`
    },
    update: () => {
      return
    },
  },
)

export { installFish }

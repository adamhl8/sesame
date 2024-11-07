import { confirm, isCancel } from "@clack/prompts"

async function continuep() {
  const shouldContinue = await confirm({
    message: "Apply changes?",
  })

  if (isCancel(shouldContinue)) return false

  return shouldContinue
}

export { continuep }

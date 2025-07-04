import { describe, expect, test } from "bun:test"
import { resolvePath } from "@/core/lib/path"
import { _createLink, _expandAndResolveLinks } from "@/plugins/misc/link-files.ts"

const LINK_FILES_TEST = `${import.meta.dir}/link-files-test`

// Source -> Destination cases:
// ./file1, ./file2 -> ./file2
// ./file1, ./dir1/ -> ./dir1/file1
// ./file1, ./dir1/file1 -> ./dir1/file1
// ./file1, ./dir1/different-name -> ./dir1/different-name

// Directory cases:
// ./dir1, ./dir2 -> ./dir2
// ./dir1, ./dir2/ -> ./dir2/dir1
// ./dir1, ./dir2/dir1 -> ./dir2/dir1

// Multiple sources:
// ./file1 ./file2, ./dir/ -> ./dir/file1, ./dir/file2

// Error cases:
// ./nonexistent, ./dest -> error
// ./file1, ./existing-file (without force) -> error
// ./dir1, ./existing-dir (without force) -> error

// Symlink behavior:
// ./symlink1, ./dest -> copies the symlink
// ./symlink1/, ./dest -> copies symlink target if directory

// Trailing slash significance:
// ./file1, ./dir -> ./dir (treats dir as file)
// ./file1, ./dir/ -> ./dir/file1 (treats dir as directory)

describe("link-files", () => {
  describe("_expandAndResolveLinks", () => {
    test("handles globs and naturally sorts names", async () => {
      const links = [
        {
          source: `${LINK_FILES_TEST}/file*`,
          dest: `${LINK_FILES_TEST}/dest/`,
        },
      ]
      const expandedLinks = await _expandAndResolveLinks(links)
      expect(expandedLinks).toEqual([
        { source: `${LINK_FILES_TEST}/file1`, dest: `${LINK_FILES_TEST}/dest/file1` },
        { source: `${LINK_FILES_TEST}/file1.5`, dest: `${LINK_FILES_TEST}/dest/file1.5` },
        { source: `${LINK_FILES_TEST}/file2`, dest: `${LINK_FILES_TEST}/dest/file2` },
        { source: `${LINK_FILES_TEST}/file11`, dest: `${LINK_FILES_TEST}/dest/file11` },
      ])
    })
  })

  // test when files don't exist
  describe("_createLink", () => {
    test("handles file to file: ./foo, ./bar -> ./bar", async () => {
      const links = [
        {
          source: `${LINK_FILES_TEST}/file1`,
          dest: `${LINK_FILES_TEST}/links/file2`,
        },
      ]
      const expandedLinks = await _expandAndResolveLinks(links)
      console.log("expandedLinks", expandedLinks)
      await _createLink(expandedLinks[0]!)
    })
  })
})

import { test, expect, describe } from "vitest";
import {
  extractFileName,
  parseStrReplaceEditor,
  parseFileManager,
  parseToolInvocation,
} from "../tool-message-parser";
import {
  FilePlus,
  FileEdit,
  FileX,
  FileSymlink,
  Eye,
  Undo,
} from "lucide-react";

describe("extractFileName", () => {
  test("extracts filename from full path", () => {
    expect(extractFileName("/src/components/Button.tsx")).toBe("Button.tsx");
  });

  test("handles root level files", () => {
    expect(extractFileName("/App.jsx")).toBe("App.jsx");
  });

  test("handles nested paths", () => {
    expect(extractFileName("/src/lib/utils/helper.ts")).toBe("helper.ts");
  });

  test("handles root directory", () => {
    expect(extractFileName("/")).toBe("/");
  });

  test("handles empty string", () => {
    expect(extractFileName("")).toBe("/");
  });

  test("handles path without leading slash", () => {
    expect(extractFileName("components/Card.tsx")).toBe("Card.tsx");
  });
});

describe("parseStrReplaceEditor", () => {
  test("parses create command correctly", () => {
    const result = parseStrReplaceEditor({
      command: "create",
      path: "/App.jsx",
      file_text: "export default App",
    });

    expect(result.action).toBe("Creating");
    expect(result.fileName).toBe("App.jsx");
    expect(result.filePath).toBe("/App.jsx");
    expect(result.icon).toBe(FilePlus);
    expect(result.colorClass).toBe("text-green-600");
    expect(result.bgColorClass).toBe("bg-green-50");
    expect(result.borderColorClass).toBe("border-green-200");
  });

  test("parses str_replace command correctly", () => {
    const result = parseStrReplaceEditor({
      command: "str_replace",
      path: "/components/Button.tsx",
      old_str: "old",
      new_str: "new",
    });

    expect(result.action).toBe("Editing");
    expect(result.fileName).toBe("Button.tsx");
    expect(result.filePath).toBe("/components/Button.tsx");
    expect(result.icon).toBe(FileEdit);
    expect(result.colorClass).toBe("text-amber-600");
    expect(result.bgColorClass).toBe("bg-amber-50");
  });

  test("parses insert command correctly", () => {
    const result = parseStrReplaceEditor({
      command: "insert",
      path: "/utils/index.ts",
      insert_line: 5,
      new_str: "console.log('test');",
    });

    expect(result.action).toBe("Editing");
    expect(result.fileName).toBe("index.ts");
    expect(result.icon).toBe(FileEdit);
    expect(result.colorClass).toBe("text-amber-600");
  });

  test("parses view command correctly", () => {
    const result = parseStrReplaceEditor({
      command: "view",
      path: "/README.md",
    });

    expect(result.action).toBe("Viewing");
    expect(result.fileName).toBe("README.md");
    expect(result.icon).toBe(Eye);
    expect(result.colorClass).toBe("text-blue-600");
  });

  test("parses undo_edit command correctly", () => {
    const result = parseStrReplaceEditor({
      command: "undo_edit",
      path: "/src/App.tsx",
    });

    expect(result.action).toBe("Undoing changes to");
    expect(result.fileName).toBe("App.tsx");
    expect(result.icon).toBe(Undo);
    expect(result.colorClass).toBe("text-neutral-600");
  });

  test("handles unknown command with default", () => {
    const result = parseStrReplaceEditor({
      command: "unknown",
      path: "/test.js",
    });

    expect(result.action).toBe("Processing");
    expect(result.fileName).toBe("test.js");
    expect(result.icon).toBe(FileEdit);
  });

  test("handles missing args gracefully", () => {
    const result = parseStrReplaceEditor({});

    expect(result.action).toBe("Processing");
    expect(result.fileName).toBe("/");
    expect(result.filePath).toBe("");
  });

  test("handles null args gracefully", () => {
    const result = parseStrReplaceEditor(null);

    expect(result.action).toBe("Processing");
    expect(result.fileName).toBe("/");
  });
});

describe("parseFileManager", () => {
  test("parses delete command correctly", () => {
    const result = parseFileManager({
      command: "delete",
      path: "/components/OldComponent.tsx",
    });

    expect(result.action).toBe("Deleting");
    expect(result.fileName).toBe("OldComponent.tsx");
    expect(result.filePath).toBe("/components/OldComponent.tsx");
    expect(result.icon).toBe(FileX);
    expect(result.colorClass).toBe("text-red-600");
    expect(result.bgColorClass).toBe("bg-red-50");
  });

  test("parses rename command correctly", () => {
    const result = parseFileManager({
      command: "rename",
      path: "/components/Button.tsx",
      new_path: "/components/ui/Button.tsx",
    });

    expect(result.action).toBe("Renaming");
    expect(result.fileName).toBe("Button.tsx");
    expect(result.filePath).toBe("/components/Button.tsx");
    expect(result.icon).toBe(FileSymlink);
    expect(result.colorClass).toBe("text-purple-600");
    expect(result.details).toBe("to Button.tsx");
  });

  test("handles rename with different filename", () => {
    const result = parseFileManager({
      command: "rename",
      path: "/OldName.tsx",
      new_path: "/NewName.tsx",
    });

    expect(result.fileName).toBe("OldName.tsx");
    expect(result.details).toBe("to NewName.tsx");
  });

  test("handles unknown command with default", () => {
    const result = parseFileManager({
      command: "unknown",
      path: "/test.js",
    });

    expect(result.action).toBe("Processing");
    expect(result.icon).toBe(FileSymlink);
  });

  test("handles missing args gracefully", () => {
    const result = parseFileManager({});

    expect(result.action).toBe("Processing");
    expect(result.fileName).toBe("/");
  });
});

describe("parseToolInvocation", () => {
  test("routes to parseStrReplaceEditor for str_replace_editor", () => {
    const result = parseToolInvocation("str_replace_editor", {
      command: "create",
      path: "/App.jsx",
    });

    expect(result.action).toBe("Creating");
    expect(result.fileName).toBe("App.jsx");
    expect(result.icon).toBe(FilePlus);
  });

  test("routes to parseFileManager for file_manager", () => {
    const result = parseToolInvocation("file_manager", {
      command: "delete",
      path: "/test.tsx",
    });

    expect(result.action).toBe("Deleting");
    expect(result.fileName).toBe("test.tsx");
    expect(result.icon).toBe(FileX);
  });

  test("handles unknown tool with fallback", () => {
    const result = parseToolInvocation("unknown_tool", {});

    expect(result.action).toBe("Running");
    expect(result.fileName).toBe("unknown_tool");
    expect(result.filePath).toBe("");
    expect(result.icon).toBe(FileEdit);
  });

  test("handles str_replace_editor with all command types", () => {
    const commands = ["create", "str_replace", "insert", "view", "undo_edit"];

    commands.forEach((command) => {
      const result = parseToolInvocation("str_replace_editor", {
        command,
        path: "/test.tsx",
      });

      expect(result.fileName).toBe("test.tsx");
      expect(result.icon).toBeDefined();
    });
  });

  test("handles file_manager with all command types", () => {
    const deleteResult = parseToolInvocation("file_manager", {
      command: "delete",
      path: "/test.tsx",
    });
    expect(deleteResult.action).toBe("Deleting");

    const renameResult = parseToolInvocation("file_manager", {
      command: "rename",
      path: "/old.tsx",
      new_path: "/new.tsx",
    });
    expect(renameResult.action).toBe("Renaming");
  });
});

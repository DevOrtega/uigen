import { test, expect, describe, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToolCallDisplay } from "../ToolCallDisplay";

afterEach(() => {
  cleanup();
});

vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react");
  return {
    ...actual,
    FilePlus: () => <div data-testid="icon-file-plus">FilePlus</div>,
    FileEdit: () => <div data-testid="icon-file-edit">FileEdit</div>,
    FileX: () => <div data-testid="icon-file-x">FileX</div>,
    FileSymlink: () => <div data-testid="icon-file-symlink">FileSymlink</div>,
    Eye: () => <div data-testid="icon-eye">Eye</div>,
    Undo: () => <div data-testid="icon-undo">Undo</div>,
    Loader2: () => <div data-testid="icon-loader">Loader2</div>,
    CheckCircle2: () => <div data-testid="icon-check">CheckCircle2</div>,
    ChevronDown: () => <div data-testid="icon-chevron-down">ChevronDown</div>,
    ChevronRight: () => <div data-testid="icon-chevron-right">ChevronRight</div>,
  };
});

describe("ToolCallDisplay", () => {
  describe("Rendering with different tool types", () => {
    test("renders str_replace_editor create command", () => {
      const toolInvocation = {
        toolCallId: "call_123",
        toolName: "str_replace_editor",
        args: {
          command: "create",
          path: "/App.jsx",
          file_text: "export default App",
        },
        state: "result" as const,
        result: "Successfully created /App.jsx",
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      expect(screen.getByText(/Creating/)).toBeDefined();
      expect(screen.getByText(/App.jsx/)).toBeDefined();
      expect(screen.getByTestId("icon-file-plus")).toBeDefined();
    });

    test("renders str_replace_editor str_replace command", () => {
      const toolInvocation = {
        toolCallId: "call_124",
        toolName: "str_replace_editor",
        args: {
          command: "str_replace",
          path: "/components/Button.tsx",
          old_str: "old",
          new_str: "new",
        },
        state: "call" as const,
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      expect(screen.getByText(/Editing/)).toBeDefined();
      expect(screen.getByText(/Button.tsx/)).toBeDefined();
      expect(screen.getByTestId("icon-file-edit")).toBeDefined();
    });

    test("renders str_replace_editor view command", () => {
      const toolInvocation = {
        toolCallId: "call_125",
        toolName: "str_replace_editor",
        args: {
          command: "view",
          path: "/README.md",
        },
        state: "call" as const,
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      expect(screen.getByText(/Viewing/)).toBeDefined();
      expect(screen.getByText(/README.md/)).toBeDefined();
      expect(screen.getByTestId("icon-eye")).toBeDefined();
    });

    test("renders file_manager delete command", () => {
      const toolInvocation = {
        toolCallId: "call_126",
        toolName: "file_manager",
        args: {
          command: "delete",
          path: "/old/Component.tsx",
        },
        state: "result" as const,
        result: "Successfully deleted",
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      expect(screen.getByText(/Deleting/)).toBeDefined();
      expect(screen.getByText(/Component.tsx/)).toBeDefined();
      expect(screen.getByTestId("icon-file-x")).toBeDefined();
    });

    test("renders file_manager rename command", () => {
      const toolInvocation = {
        toolCallId: "call_127",
        toolName: "file_manager",
        args: {
          command: "rename",
          path: "/OldName.tsx",
          new_path: "/NewName.tsx",
        },
        state: "call" as const,
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      expect(screen.getByText(/Renaming/)).toBeDefined();
      expect(screen.getByText(/OldName.tsx/)).toBeDefined();
      expect(screen.getByText(/to NewName.tsx/)).toBeDefined();
      expect(screen.getByTestId("icon-file-symlink")).toBeDefined();
    });
  });

  describe("State indicators", () => {
    test("shows spinner for in-progress state (call)", () => {
      const toolInvocation = {
        toolCallId: "call_128",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "call" as const,
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      expect(screen.getByTestId("icon-loader")).toBeDefined();
    });

    test("shows spinner for partial-call state", () => {
      const toolInvocation = {
        toolCallId: "call_129",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "partial-call" as const,
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      expect(screen.getByTestId("icon-loader")).toBeDefined();
    });

    test("shows checkmark for completed state (result)", () => {
      const toolInvocation = {
        toolCallId: "call_130",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      expect(screen.getByTestId("icon-check")).toBeDefined();
    });
  });

  describe("Expand/collapse functionality", () => {
    test("starts collapsed by default", () => {
      const toolInvocation = {
        toolCallId: "call_131",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      expect(screen.getByTestId("icon-chevron-right")).toBeDefined();
      expect(screen.queryByText("Tool:")).toBeNull();
    });

    test("expands when clicked", async () => {
      const user = userEvent.setup();
      const toolInvocation = {
        toolCallId: "call_132",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(screen.getByTestId("icon-chevron-down")).toBeDefined();
      expect(screen.getByText("Tool:")).toBeDefined();
      expect(screen.getByText("str_replace_editor")).toBeDefined();
    });

    test("collapses when clicked again", async () => {
      const user = userEvent.setup();
      const toolInvocation = {
        toolCallId: "call_133",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      const button = screen.getByRole("button");

      await user.click(button);
      expect(screen.getByText("Tool:")).toBeDefined();

      await user.click(button);
      expect(screen.queryByText("Tool:")).toBeNull();
    });

    test("expands with Enter key", async () => {
      const user = userEvent.setup();
      const toolInvocation = {
        toolCallId: "call_134",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");

      expect(screen.getByText("Tool:")).toBeDefined();
    });

    test("expands with Space key", async () => {
      const user = userEvent.setup();
      const toolInvocation = {
        toolCallId: "call_135",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard(" ");

      expect(screen.getByText("Tool:")).toBeDefined();
    });
  });

  describe("Expanded state content", () => {
    test("shows full path in expanded state", async () => {
      const user = userEvent.setup();
      const toolInvocation = {
        toolCallId: "call_136",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/src/components/Button.tsx" },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(screen.getByText("Path:")).toBeDefined();
      expect(screen.getByText("/src/components/Button.tsx")).toBeDefined();
    });

    test("shows command name in expanded state", async () => {
      const user = userEvent.setup();
      const toolInvocation = {
        toolCallId: "call_137",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(screen.getByText("Command:")).toBeDefined();
      expect(screen.getByText("create")).toBeDefined();
    });

    test("shows result in expanded state when completed", async () => {
      const user = userEvent.setup();
      const toolInvocation = {
        toolCallId: "call_138",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "result" as const,
        result: "Successfully created file at /test.tsx",
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(screen.getByText("Result:")).toBeDefined();
      expect(
        screen.getByText("Successfully created file at /test.tsx")
      ).toBeDefined();
    });

    test("shows new_path for rename operations", async () => {
      const user = userEvent.setup();
      const toolInvocation = {
        toolCallId: "call_139",
        toolName: "file_manager",
        args: {
          command: "rename",
          path: "/old/path.tsx",
          new_path: "/new/path.tsx",
        },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(screen.getByText("New Path:")).toBeDefined();
      expect(screen.getByText("/new/path.tsx")).toBeDefined();
    });

    test("handles object results with JSON stringification", async () => {
      const user = userEvent.setup();
      const toolInvocation = {
        toolCallId: "call_140",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "result" as const,
        result: { success: true, message: "Created" },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(screen.getByText(/success/)).toBeDefined();
      expect(screen.getByText(/Created/)).toBeDefined();
    });
  });

  describe("Edge cases", () => {
    test("handles missing args gracefully", () => {
      const toolInvocation = {
        toolCallId: "call_141",
        toolName: "str_replace_editor",
        args: null,
        state: "call" as const,
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      expect(screen.getByRole("button")).toBeDefined();
    });

    test("handles empty path strings", () => {
      const toolInvocation = {
        toolCallId: "call_142",
        toolName: "str_replace_editor",
        args: { command: "create", path: "" },
        state: "call" as const,
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      expect(screen.getByRole("button")).toBeDefined();
    });

    test("handles tools with no result yet", () => {
      const toolInvocation = {
        toolCallId: "call_143",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "call" as const,
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      expect(screen.getByTestId("icon-loader")).toBeDefined();
      expect(screen.queryByTestId("icon-check")).toBeNull();
    });

    test("applies custom className", () => {
      const toolInvocation = {
        toolCallId: "call_144",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "call" as const,
      };

      const { container } = render(
        <ToolCallDisplay toolInvocation={toolInvocation} className="custom-class" />
      );

      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain("custom-class");
    });
  });

  describe("Accessibility", () => {
    test("has proper aria-expanded attribute when collapsed", () => {
      const toolInvocation = {
        toolCallId: "call_145",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "call" as const,
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      const button = screen.getByRole("button");
      expect(button.getAttribute("aria-expanded")).toBe("false");
    });

    test("has proper aria-expanded attribute when expanded", async () => {
      const user = userEvent.setup();
      const toolInvocation = {
        toolCallId: "call_146",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "call" as const,
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(button.getAttribute("aria-expanded")).toBe("true");
    });

    test("has proper aria-label", () => {
      const toolInvocation = {
        toolCallId: "call_147",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call" as const,
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      const button = screen.getByRole("button");
      expect(button.getAttribute("aria-label")).toContain("Creating App.jsx");
    });

    test("has proper tabIndex for keyboard navigation", () => {
      const toolInvocation = {
        toolCallId: "call_148",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/test.tsx" },
        state: "call" as const,
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);

      const button = screen.getByRole("button");
      expect(button.getAttribute("tabindex")).toBe("0");
    });
  });
});

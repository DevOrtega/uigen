import type { LucideIcon } from "lucide-react";
import {
  FilePlus,
  FileEdit,
  FileX,
  FileSymlink,
  Eye,
  Undo,
} from "lucide-react";

export interface ToolMessage {
  action: string;
  fileName: string;
  filePath: string;
  icon: LucideIcon;
  colorClass: string;
  bgColorClass: string;
  borderColorClass: string;
  details?: string;
}

export function extractFileName(path: string): string {
  if (!path || path === "/") return "/";
  const parts = path.split("/").filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : "/";
}

export function parseStrReplaceEditor(args: any): ToolMessage {
  const { command, path } = args || {};
  const fileName = extractFileName(path || "");
  const filePath = path || "";

  switch (command) {
    case "create":
      return {
        action: "Creating",
        fileName,
        filePath,
        icon: FilePlus,
        colorClass: "text-green-600",
        bgColorClass: "bg-green-50",
        borderColorClass: "border-green-200",
      };

    case "str_replace":
    case "insert":
      return {
        action: "Editing",
        fileName,
        filePath,
        icon: FileEdit,
        colorClass: "text-amber-600",
        bgColorClass: "bg-amber-50",
        borderColorClass: "border-amber-200",
      };

    case "view":
      return {
        action: "Viewing",
        fileName,
        filePath,
        icon: Eye,
        colorClass: "text-blue-600",
        bgColorClass: "bg-blue-50",
        borderColorClass: "border-blue-200",
      };

    case "undo_edit":
      return {
        action: "Undoing changes to",
        fileName,
        filePath,
        icon: Undo,
        colorClass: "text-neutral-600",
        bgColorClass: "bg-neutral-50",
        borderColorClass: "border-neutral-200",
      };

    default:
      return {
        action: "Processing",
        fileName,
        filePath,
        icon: FileEdit,
        colorClass: "text-neutral-600",
        bgColorClass: "bg-neutral-50",
        borderColorClass: "border-neutral-200",
      };
  }
}

export function parseFileManager(args: any): ToolMessage {
  const { command, path, new_path } = args || {};
  const fileName = extractFileName(path || "");
  const filePath = path || "";

  switch (command) {
    case "delete":
      return {
        action: "Deleting",
        fileName,
        filePath,
        icon: FileX,
        colorClass: "text-red-600",
        bgColorClass: "bg-red-50",
        borderColorClass: "border-red-200",
      };

    case "rename":
      const newFileName = extractFileName(new_path || "");
      return {
        action: "Renaming",
        fileName,
        filePath,
        icon: FileSymlink,
        colorClass: "text-purple-600",
        bgColorClass: "bg-purple-50",
        borderColorClass: "border-purple-200",
        details: `to ${newFileName}`,
      };

    default:
      return {
        action: "Processing",
        fileName,
        filePath,
        icon: FileSymlink,
        colorClass: "text-neutral-600",
        bgColorClass: "bg-neutral-50",
        borderColorClass: "border-neutral-200",
      };
  }
}

export function parseToolInvocation(
  toolName: string,
  args: any
): ToolMessage {
  switch (toolName) {
    case "str_replace_editor":
      return parseStrReplaceEditor(args);

    case "file_manager":
      return parseFileManager(args);

    default:
      return {
        action: "Running",
        fileName: toolName,
        filePath: "",
        icon: FileEdit,
        colorClass: "text-neutral-600",
        bgColorClass: "bg-neutral-50",
        borderColorClass: "border-neutral-200",
      };
  }
}

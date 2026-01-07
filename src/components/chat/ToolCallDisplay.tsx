"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { parseToolInvocation } from "@/lib/utils/tool-message-parser";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: any;
  state: "partial-call" | "call" | "result";
  result?: any;
}

interface ToolCallDisplayProps {
  toolInvocation: ToolInvocation;
  className?: string;
}

export function ToolCallDisplay({
  toolInvocation,
  className,
}: ToolCallDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { toolName, args, state, result } = toolInvocation;
  const isCompleted = state === "result" && result !== undefined;

  const message = parseToolInvocation(toolName, args);
  const OperationIcon = message.icon;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      className={cn(
        "inline-flex flex-col mt-2 rounded-lg text-xs border transition-all",
        message.bgColorClass,
        message.borderColorClass,
        className
      )}
    >
      <div
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:shadow-sm transition-shadow rounded-lg",
          message.colorClass
        )}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${message.action} ${message.fileName}${message.details ? ` ${message.details}` : ""}`}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        ) : (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 flex-shrink-0" />
        )}

        <OperationIcon className="w-3.5 h-3.5 flex-shrink-0" />

        <span className="font-medium">
          {message.action} {message.fileName}
        </span>

        {message.details && (
          <span className="text-neutral-500 ml-1">{message.details}</span>
        )}

        <div className="ml-auto flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 py-2 bg-white/50 border-t border-neutral-200 rounded-b-lg">
          <div className="space-y-2 text-neutral-700">
            <div>
              <span className="font-medium text-neutral-900">Tool: </span>
              <span className="font-mono text-xs">{toolName}</span>
            </div>

            {args?.command && (
              <div>
                <span className="font-medium text-neutral-900">Command: </span>
                <span className="font-mono text-xs">{args.command}</span>
              </div>
            )}

            {message.filePath && (
              <div>
                <span className="font-medium text-neutral-900">Path: </span>
                <span className="font-mono text-xs">{message.filePath}</span>
              </div>
            )}

            {args?.new_path && (
              <div>
                <span className="font-medium text-neutral-900">New Path: </span>
                <span className="font-mono text-xs">{args.new_path}</span>
              </div>
            )}

            {isCompleted && result && (
              <div className="pt-2 border-t border-neutral-200">
                <div className="font-medium text-neutral-900 mb-1">Result:</div>
                <div className="font-mono text-xs bg-neutral-50 rounded p-2 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
                  {typeof result === "string"
                    ? result
                    : JSON.stringify(result, null, 2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

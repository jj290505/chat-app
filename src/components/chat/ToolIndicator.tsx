"use client";

import React from "react";

interface ToolIndicatorProps {
  toolName: string;
  isExecuting?: boolean;
  result?: string;
  error?: string;
}

/**
 * Tool Indicator Component
 * Shows when MCP tools are being used and their results
 */
export const ToolIndicator: React.FC<ToolIndicatorProps> = ({
  toolName,
  isExecuting = false,
  result,
  error,
}) => {
  const getToolIcon = (tool: string) => {
    if (tool.includes("search_knowledge")) return "🧠";
    if (tool.includes("search_contacts")) return "🕵️";
    if (tool.includes("web_search")) return "🛰️";
    if (tool.includes("fetch_web")) return "🎣";
    if (tool.includes("weather")) return "⛅";
    if (tool.includes("trending")) return "🔥";
    if (tool.includes("math") || tool.includes("calculate")) return "⚡";
    if (tool.includes("unit") || tool.includes("convert")) return "🌀";
    if (tool.includes("statistics") || tool.includes("data")) return "📈";
    if (tool.includes("json")) return "📦";
    if (tool.includes("text")) return "📝";
    if (tool.includes("conversation") || tool.includes("message")) return "🧬";
    if (tool.includes("store")) return "💾";
    return "🤖";
  };

  const getToolColor = (tool: string) => {
    if (tool.includes("search_knowledge")) return "from-indigo-500 to-blue-600";
    if (tool.includes("contacts")) return "from-emerald-500 to-teal-600";
    if (tool.includes("web") || tool.includes("fetch")) return "from-blue-400 to-indigo-500";
    if (tool.includes("math") || tool.includes("calculate")) return "from-amber-400 to-orange-600";
    if (tool.includes("unit") || tool.includes("convert")) return "from-cyan-400 to-blue-500";
    if (tool.includes("statistics") || tool.includes("data")) return "from-violet-500 to-purple-600";
    if (tool.includes("weather") || tool.includes("trending")) return "from-orange-400 to-pink-500";
    return "from-slate-500 to-slate-700";
  };

  return (
    <div className="my-2 rounded-lg border border-gray-300 bg-gradient-to-r bg-opacity-10 p-3 dark:border-gray-600">
      {/* Tool Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{getToolIcon(toolName)}</span>
        <span className="font-semibold text-gray-700 dark:text-gray-300">
          {toolName.replace(/_/g, " ").toUpperCase()}
        </span>
        {isExecuting && (
          <span className="ml-auto flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400"></span>
            Executing...
          </span>
        )}
      </div>

      {/* Tool Result */}
      {result && !error && (
        <div className="mt-2 rounded bg-green-50 p-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          ✅ {result.substring(0, 150)}
          {result.length > 150 ? "..." : ""}
        </div>
      )}

      {/* Tool Error */}
      {error && (
        <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          ❌ {error}
        </div>
      )}
    </div>
  );
};

/**
 * Tool Usage Panel Component
 * Shows all tools used in a conversation
 */
interface ToolUsagePanelProps {
  tools: ToolIndicatorProps[];
  isOpen?: boolean;
  onClose?: () => void;
}

export const ToolUsagePanel: React.FC<ToolUsagePanelProps> = ({
  tools,
  isOpen = true,
  onClose,
}) => {
  if (!isOpen || tools.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 max-h-64 w-80 overflow-y-auto rounded-lg border border-gray-300 bg-white p-4 shadow-lg dark:border-gray-600 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          🛠️ Tools Used ({tools.length})
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>
      <div className="space-y-2">
        {tools.map((tool, idx) => (
          <div key={idx} className="text-sm">
            <div className="flex items-center gap-2">
              <span>🔧</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {tool.toolName.replace(/_/g, " ")}
              </span>
              {tool.isExecuting && (
                <span className="ml-auto text-blue-600 dark:text-blue-400">
                  ⏳
                </span>
              )}
              {tool.result && !tool.error && (
                <span className="ml-auto text-green-600 dark:text-green-400">
                  ✅
                </span>
              )}
              {tool.error && (
                <span className="ml-auto text-red-600 dark:text-red-400">
                  ❌
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Tool Badge Component
 * Small badge showing tool usage inline
 */
interface ToolBadgeProps {
  toolName: string;
  size?: "small" | "medium";
}

export const ToolBadge: React.FC<ToolBadgeProps> = ({
  toolName,
  size = "medium",
}) => {
  const icons: { [key: string]: string } = {
    search_knowledge_base: "🧠",
    web_search: "🛰️",
    get_weather: "⛅",
    math_calculate: "⚡",
    unit_converter: "🌀",
    data_statistics: "📊",
    json_formatter: "📦",
    text_statistics: "📝",
    get_user_conversations: "🧬",
    search_contacts: "🕵️",
  };

  const baseClasses =
    size === "small"
      ? "text-xs px-2 py-1 rounded"
      : "text-sm px-3 py-1 rounded-full";

  return (
    <span
      className={`inline-flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 ${baseClasses}`}
    >
      <span>{icons[toolName] || "🛠️"}</span>
      <span>{toolName.replace(/_/g, " ")}</span>
    </span>
  );
};

/**
 * Tool Stats Component
 * Shows statistics about tool usage
 */
interface ToolStatsProps {
  totalToolsUsed: number;
  toolTypes: { [key: string]: number };
  successRate?: number;
}

export const ToolStats: React.FC<ToolStatsProps> = ({
  totalToolsUsed,
  toolTypes,
  successRate = 100,
}) => {
  return (
    <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:from-blue-900/20 dark:to-indigo-900/20">
      <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
        📊 Tool Usage Statistics
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded bg-white p-2 dark:bg-gray-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalToolsUsed}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Tools Used
          </div>
        </div>
        <div className="rounded bg-white p-2 dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {successRate}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Success Rate
          </div>
        </div>
        {Object.entries(toolTypes).map(([type, count]) => (
          <div key={type} className="rounded bg-white p-2 dark:bg-gray-800">
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {count}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolIndicator;

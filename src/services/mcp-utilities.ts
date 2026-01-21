/**
 * MCP Utility Tools Server
 * Provides file operations, math calculations, and utilities
 * 
 * Features:
 * - File size calculations
 * - Math operations (complex calculations)
 * - Data analysis (statistics)
 * - Unit conversions
 * - JSON operations
 */

export interface MCPTool {
  name: string;
  description: string;
  execute: (params: any) => Promise<string>;
}

/**
 * Tool 1: Math Calculator
 * Perform mathematical calculations
 */
const mathCalculatorTool: MCPTool = {
  name: "math_calculate",
  description: "Perform complex mathematical calculations. Supports basic math, trigonometry, and statistics.",
  execute: async (params: { expression: string; type?: "basic" | "stats" }) => {
    try {
      const { expression, type = "basic" } = params;

      // Simple safe math evaluation
      // Only allow numbers and basic operators
      if (!/^[0-9+\-*/.()Math\s]+$/.test(expression)) {
        return "Invalid expression. Only numbers and basic math operators allowed.";
      }

      // Replace Math functions
      let expr = expression
        .replace(/sqrt/g, "Math.sqrt")
        .replace(/sin/g, "Math.sin")
        .replace(/cos/g, "Math.cos")
        .replace(/tan/g, "Math.tan")
        .replace(/abs/g, "Math.abs")
        .replace(/floor/g, "Math.floor")
        .replace(/ceil/g, "Math.ceil")
        .replace(/round/g, "Math.round")
        .replace(/pow/g, "Math.pow")
        .replace(/log/g, "Math.log")
        .replace(/exp/g, "Math.exp")
        .replace(/pi/gi, "Math.PI")
        .replace(/e\b/g, "Math.E");

      // Evaluate
      const result = Function('"use strict"; return (' + expr + ")")();

      return `📊 Calculation Result:\n\n**Expression:** ${expression}\n**Result:** ${result}\n\n*Calculated by Math Tool*`;
    } catch (error: any) {
      return `Math Error: ${error.message}`;
    }
  },
};

/**
 * Tool 2: Unit Converter
 * Convert between different units
 */
const unitConverterTool: MCPTool = {
  name: "unit_converter",
  description: "Convert between different units (length, weight, temperature, speed, etc.)",
  execute: async (params: {
    value: number;
    fromUnit: string;
    toUnit: string;
  }) => {
    try {
      const { value, fromUnit, toUnit } = params;

      // Conversion factors to base units
      const conversions: { [key: string]: { [key: string]: number } } = {
        // Length (to meters)
        length: {
          mm: 0.001,
          cm: 0.01,
          m: 1,
          km: 1000,
          inch: 0.0254,
          foot: 0.3048,
          yard: 0.9144,
          mile: 1609.34,
        },
        // Weight (to kg)
        weight: {
          mg: 0.000001,
          g: 0.001,
          kg: 1,
          oz: 0.0283495,
          lb: 0.453592,
          ton: 1000,
        },
        // Temperature (special handling)
        temperature: {
          c: 1,
          f: 1,
          k: 1,
        },
      };

      // Find which category
      let category = "";
      for (const cat in conversions) {
        if (conversions[cat][fromUnit] && conversions[cat][toUnit]) {
          category = cat;
          break;
        }
      }

      if (!category) {
        return `Unknown units: ${fromUnit} or ${toUnit}`;
      }

      let result: number;

      if (category === "temperature") {
        // Special temperature handling
        if (fromUnit === "c" && toUnit === "f") {
          result = (value * 9) / 5 + 32;
        } else if (fromUnit === "f" && toUnit === "c") {
          result = ((value - 32) * 5) / 9;
        } else if (fromUnit === "c" && toUnit === "k") {
          result = value + 273.15;
        } else if (fromUnit === "k" && toUnit === "c") {
          result = value - 273.15;
        } else if (fromUnit === "f" && toUnit === "k") {
          result = ((value - 32) * 5) / 9 + 273.15;
        } else if (fromUnit === "k" && toUnit === "f") {
          result = ((value - 273.15) * 9) / 5 + 32;
        } else {
          result = value;
        }
      } else {
        // Convert through base unit
        const baseValue =
          value * conversions[category][fromUnit];
        result = baseValue / conversions[category][toUnit];
      }

      return `🔄 Unit Conversion:\n\n**${value} ${fromUnit.toUpperCase()}** = **${result.toFixed(4)} ${toUnit.toUpperCase()}**`;
    } catch (error: any) {
      return `Conversion Error: ${error.message}`;
    }
  },
};

/**
 * Tool 3: Data Statistics
 * Calculate statistics from numbers
 */
const dataStatisticsTool: MCPTool = {
  name: "data_statistics",
  description: "Calculate statistics (mean, median, standard deviation) from a list of numbers.",
  execute: async (params: { numbers: number[] }) => {
    try {
      const { numbers } = params;

      if (!Array.isArray(numbers) || numbers.length === 0) {
        return "Please provide an array of numbers";
      }

      // Sort for median calculation
      const sorted = [...numbers].sort((a, b) => a - b);

      // Mean
      const mean = numbers.reduce((a, b) => a + b) / numbers.length;

      // Median
      const median =
        numbers.length % 2 === 0
          ? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
          : sorted[Math.floor(numbers.length / 2)];

      // Standard deviation
      const variance =
        numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        numbers.length;
      const stdDev = Math.sqrt(variance);

      // Min and Max
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);

      return `📊 Data Statistics:\n\n**Count:** ${numbers.length}\n**Mean:** ${mean.toFixed(2)}\n**Median:** ${median.toFixed(2)}\n**Std Dev:** ${stdDev.toFixed(2)}\n**Min:** ${min}\n**Max:** ${max}\n**Range:** ${max - min}`;
    } catch (error: any) {
      return `Statistics Error: ${error.message}`;
    }
  },
};

/**
 * Tool 4: JSON Parser & Formatter
 * Parse and format JSON
 */
const jsonParserTool: MCPTool = {
  name: "json_formatter",
  description: "Parse, validate, and format JSON data. Helps with JSON debugging and formatting.",
  execute: async (params: { json: string; action?: "format" | "validate" }) => {
    try {
      const { json, action = "format" } = params;

      // Try to parse
      const parsed = JSON.parse(json);

      if (action === "validate") {
        return `✅ JSON is valid!\n\nKeys found: ${Object.keys(parsed).join(", ")}`;
      }

      // Format with indentation
      const formatted = JSON.stringify(parsed, null, 2);

      return `📋 Formatted JSON:\n\n\`\`\`json\n${formatted}\n\`\`\``;
    } catch (error: any) {
      return `❌ JSON Error: ${error.message}`;
    }
  },
};

/**
 * Tool 5: Text Statistics
 * Get statistics about text
 */
const textStatisticsTool: MCPTool = {
  name: "text_statistics",
  description: "Analyze text: word count, character count, reading time, etc.",
  execute: async (params: { text: string }) => {
    try {
      const { text } = params;

      const charCount = text.length;
      const charCountNoSpaces = text.replace(/\s/g, "").length;
      const wordCount = text.trim().split(/\s+/).length;
      const lineCount = text.split("\n").length;
      const paragraphCount = text.split(/\n\n+/).length;

      // Estimate reading time (average 200 words per minute)
      const readingTimeMinutes = Math.ceil(wordCount / 200);

      // Find longest word
      const words = text.split(/\s+/);
      const longestWord = words.reduce((a, b) =>
        a.length > b.length ? a : b
      );

      return `📝 Text Statistics:\n\n**Characters:** ${charCount} (${charCountNoSpaces} without spaces)\n**Words:** ${wordCount}\n**Lines:** ${lineCount}\n**Paragraphs:** ${paragraphCount}\n**Reading Time:** ~${readingTimeMinutes} min\n**Longest Word:** "${longestWord}" (${longestWord.length} chars)`;
    } catch (error: any) {
      return `Text Analysis Error: ${error.message}`;
    }
  },
};

// ============================================
// Export all Utility MCP Tools
// ============================================

export const UtilityMCPTools: MCPTool[] = [
  mathCalculatorTool,
  unitConverterTool,
  dataStatisticsTool,
  jsonParserTool,
  textStatisticsTool,
];

export function getUtilityMCPTools() {
  return UtilityMCPTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
  }));
}

export async function executeUtilityMCPTool(
  toolName: string,
  params: any
): Promise<string> {
  const tool = UtilityMCPTools.find((t) => t.name === toolName);
  if (!tool) {
    return `Tool "${toolName}" not found. Available tools: ${UtilityMCPTools.map((t) => t.name).join(", ")}`;
  }
  return await tool.execute(params);
}

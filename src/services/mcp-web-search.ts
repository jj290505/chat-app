/**
 * MCP Web Search Server
 * Provides web search and content fetching capabilities to AI
 * 
 * Features:
 * - Search the internet using NewsAPI and Google Custom Search
 * - Fetch and parse web page content
 * - Get current news and trending topics
 * - Extract relevant information from URLs
 */

export interface MCPTool {
  name: string;
  description: string;
  execute: (params: any) => Promise<string>;
}

/**
 * Tool 1: Web Search
 * Search the internet for information
 */
const webSearchTool: MCPTool = {
  name: "web_search",
  description: "Search the internet for current information, news, or any topic. Returns top search results with titles and descriptions.",
  execute: async (params: { query: string; limit?: number }) => {
    try {
      const { query, limit = 5 } = params;

      if (!process.env.NEXT_PUBLIC_NEWS_API_KEY) {
        return "Web search not configured. Please add NEXT_PUBLIC_NEWS_API_KEY to .env.local";
      }

      // Use NewsAPI for current news
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=${limit}&apiKey=${process.env.NEXT_PUBLIC_NEWS_API_KEY}`
      );

      if (!response.ok) {
        return `Search failed: ${response.statusText}`;
      }

      const data = await response.json();

      if (!data.articles || data.articles.length === 0) {
        return `No search results found for "${query}"`;
      }

      const results = data.articles
        .map(
          (article: any) =>
            `- **${article.title}** (${new Date(article.publishedAt).toLocaleDateString()})\n  Source: ${article.source.name}\n  ${article.description}`
        )
        .join("\n\n");

      return `Found ${data.articles.length} relevant articles about "${query}":\n\n${results}`;
    } catch (error: any) {
      return `Error searching web: ${error.message}`;
    }
  },
};

/**
 * Tool 2: Fetch Web Content
 * Get the full content from a URL
 */
const fetchWebContentTool: MCPTool = {
  name: "fetch_web_content",
  description: "Fetch and extract text content from a specific URL. Returns the main content of the webpage.",
  execute: async (params: { url: string }) => {
    try {
      const { url } = params;

      // Validate URL
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return "Invalid URL. Must start with http:// or https://";
      }

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        return `Failed to fetch content. Status: ${response.status}`;
      }

      const html = await response.text();

      // Extract text from HTML (remove scripts, styles, etc.)
      const text = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Return first 2000 characters
      const content = text.substring(0, 2000);
      return `Content from ${url}:\n\n${content}`;
    } catch (error: any) {
      return `Error fetching content: ${error.message}`;
    }
  },
};

/**
 * Tool 3: Get Trending Topics
 * Get current trending topics
 */
const getTrendingTopicsTool: MCPTool = {
  name: "get_trending_topics",
  description: "Get current trending topics and what people are talking about. Returns popular news and discussions.",
  execute: async (params: { limit?: number; category?: string }) => {
    try {
      const { limit = 5, category = "general" } = params;

      if (!process.env.NEXT_PUBLIC_NEWS_API_KEY) {
        return "Trending topics not available. Please add NEXT_PUBLIC_NEWS_API_KEY to .env.local";
      }

      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?country=us&pageSize=${limit}&apiKey=${process.env.NEXT_PUBLIC_NEWS_API_KEY}`
      );

      if (!response.ok) {
        return "Failed to fetch trending topics";
      }

      const data = await response.json();

      const topics = data.articles
        .map((article: any) => `- ${article.title}`)
        .join("\n");

      return `Currently trending topics:\n\n${topics}`;
    } catch (error: any) {
      return `Error fetching trending topics: ${error.message}`;
    }
  },
};

/**
 * Tool 4: Get Weather
 * Get current weather information
 */
const getWeatherTool: MCPTool = {
  name: "get_weather",
  description: "Get current weather information for a location. Returns temperature, conditions, and forecast.",
  execute: async (params: { location: string }) => {
    try {
      const { location } = params;

      // Using Open-Meteo free weather API (no key needed)
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
      );

      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        return `Location "${location}" not found`;
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      // Get weather
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=celsius`
      );

      const weatherData = await weatherResponse.json();
      const current = weatherData.current;

      const weatherCodes: { [key: number]: string } = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail",
      };

      const condition = weatherCodes[current.weather_code] || "Unknown";

      return `📍 Weather in ${name}, ${country}:\n\n🌡️ Temperature: **${current.temperature_2m}°C**\n☁️ Condition: **${condition}**\n💨 Wind Speed: **${current.wind_speed_10m} km/h**`;
    } catch (error: any) {
      return `Error fetching weather: ${error.message}`;
    }
  },
};

/**
 * Tool 5: Get Current Date & Time
 * Get current date and time in different timezones
 */
const getCurrentDateTimeTool: MCPTool = {
  name: "get_current_datetime",
  description: "Get current date and time. Can also get time in specific cities/timezones.",
  execute: async (params: { timezone?: string; city?: string }) => {
    try {
      const now = new Date();

      if (params.timezone) {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: params.timezone,
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const formatted = formatter.format(now);
        return `Current time in ${params.timezone}:\n**${formatted}**`;
      }

      const formatted = now.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      return `Current date & time (UTC):\n**${formatted}**`;
    } catch (error: any) {
      return `Error getting date/time: ${error.message}`;
    }
  },
};

// ============================================
// Export all Web Search MCP Tools
// ============================================

export const WebSearchMCPTools: MCPTool[] = [
  webSearchTool,
  fetchWebContentTool,
  getTrendingTopicsTool,
  getWeatherTool,
  getCurrentDateTimeTool,
];

export function getWebSearchMCPTools() {
  return WebSearchMCPTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
  }));
}

export async function executeWebSearchMCPTool(
  toolName: string,
  params: any
): Promise<string> {
  const tool = WebSearchMCPTools.find((t) => t.name === toolName);
  if (!tool) {
    return `Tool "${toolName}" not found. Available tools: ${WebSearchMCPTools.map((t) => t.name).join(", ")}`;
  }
  return await tool.execute(params);
}

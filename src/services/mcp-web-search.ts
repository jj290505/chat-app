/**
 * MCP Web Search Server
 * Provides web search and content fetching capabilities to AI
 * 
 * Features:
 * - Search the internet using NewsAPI and Google Custom Search
 * - Fetch and parse web page content
 * - Get current news and trending topics
 * - Extract relevant information from URLs
 * - **NEW** Real-time Financial Data (Crypto, Stocks, Gold/Commodities)
 * - **NEW** Weather + Air Quality Index (AQI)
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
 * Tool 4: Get Weather (Updated with AQI)
 * Get current weather information + Air Quality Index
 */
const getWeatherTool: MCPTool = {
  name: "get_weather",
  description: "Get current weather and Air Quality Index (AQI) for any city using OpenWeather API.",
  execute: async (params: { location: string }) => {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      const { location } = params;

      // Fallback if no key
      if (!apiKey) return "Error: OPENWEATHER_API_KEY is missing.";

      // 1. Get Weather & Coordinates
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;
      const res = await fetch(url);

      if (!res.ok) return `Weather not found for "${location}".`;

      const data = await res.json();
      const { lat, lon } = data.coord;

      // 2. Get Air Quality Index (AQI)
      let aqiResult = "N/A";
      let aqiDescription = "Unknown";
      try {
        const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        const aqiRes = await fetch(aqiUrl);
        if (aqiRes.ok) {
          const aqiData = await aqiRes.json();
          const aqi = aqiData.list[0].main.aqi; // 1 = Good, 5 = Poor
          aqiResult = aqi.toString();

          // Map AQI number to description
          const aqiMap: Record<number, string> = {
            1: "Good 🟢",
            2: "Fair 🟡",
            3: "Moderate 🟠",
            4: "Poor 🔴",
            5: "Very Poor 🟣"
          };
          aqiDescription = aqiMap[aqi] || "Unknown";
        }
      } catch (e) {
        console.error("AQI fetch failed:", e);
      }

      return `📍 Weather in ${data.name}, ${data.sys.country}:\n` +
        `🌡️ Temperature: **${data.main.temp}°C** (Feels like: ${data.main.feels_like}°C)\n` +
        `☁️ Condition: **${data.weather[0].description}**\n` +
        `💨 Wind: **${data.wind.speed} m/s**\n` +
        `💧 Humidity: **${data.main.humidity}%**\n` +
        `🌫️ Air Quality (AQI): **${aqiResult} - ${aqiDescription}**`;
    } catch (error: any) {
      return `Error fetching weather: ${error.message}`;
    }
  },
};

/**
 * Tool 5: Get News
 * Get latest news using GNews API
 */
const getNewsTool: MCPTool = {
  name: "get_news",
  description: "Get latest news headlines for a topic (e.g., 'technology', 'sports', 'finance') or general news.",
  execute: async (params: { topic?: string }) => {
    try {
      const apiKey = process.env.GNEWS_API_KEY;
      if (!apiKey) return "Error: GNEWS_API_KEY is missing.";

      const { topic = "general" } = params;
      // GNews 'topic' parameter is limited (breaking-news, world, nation, business, technology, entertainment, sports, science, health)
      // If the user asks for a specific keyword query, we should use 'q' search instead.

      // Heuristic: if topic is one of the standard topics, use category param. Else search.
      const standardTopics = ["breaking-news", "world", "nation", "business", "technology", "entertainment", "sports", "science", "health"];

      let url = "";
      if (standardTopics.includes(topic)) {
        url = `https://gnews.io/api/v4/top-headlines?category=${topic}&token=${apiKey}&lang=en&max=5`;
      } else {
        // Perform a search for non-standard topics
        url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&token=${apiKey}&lang=en&max=5`;
      }

      const res = await fetch(url);
      if (!res.ok) return `News not found for topic: ${topic}.`;

      const data = await res.json();
      if (!data.articles || data.articles.length === 0) return "No articles found.";

      const articles = data.articles.map((a: any) =>
        `- [${a.source.name}] **${a.title}**\n  ${a.description}\n  Link: ${a.url}`
      ).join("\n\n");

      return `📰 Top headlines for "${topic}":\n\n${articles}`;
    } catch (error: any) {
      return `Error fetching news: ${error.message}`;
    }
  },
};

/**
 * Tool 6: Get Current Date & Time
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

/**
 * Tool 7: Get Financial Data
 * Real-time prices for Crypto and Stocks/Gold
 */
const getFinancialDataTool: MCPTool = {
  name: "get_financial_data",
  description: "Get real-time prices for cryptocurrencies (e.g., BTC, ETH) or stocks/commodities (e.g., AAPL, TSLA, GOLD).",
  execute: async (params: { symbol: string; type: "crypto" | "stock" }) => {
    try {
      const { symbol, type } = params;

      if (type === "crypto") {
        // Use CoinGecko for crypto
        // Need to map common symbols to ids (basic mapping)
        const symbolMap: Record<string, string> = {
          "BTC": "bitcoin",
          "ETH": "ethereum",
          "SOL": "solana",
          "DOGE": "dogecoin",
          "XRP": "ripple",
          "BITCOIN": "bitcoin",
          "ETHEREUM": "ethereum"
        };

        const id = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd,inr&include_24hr_change=true`;

        const res = await fetch(url);
        if (!res.ok) return `Failed to fetch crypto data for ${symbol}`;

        const data = await res.json();
        if (!data[id]) return `Crypto symbol "${symbol}" not found (try full name like 'bitcoin').`;

        const usd = data[id].usd;
        const change = data[id].usd_24h_change?.toFixed(2);

        return `💰 **${symbol.toUpperCase()} Price:**\n$${usd} USD (${change}% 24h)`;
      }

      if (type === "stock") {
        // Use Yahoo Finance Chart API (unofficial but effective for basic price)
        // GOLD symbol on Yahoo is usually 'GC=F' (Gold Futures) or 'GLD' (ETF). 
        // Let's try to be smart about symbols.
        let querySymbol = symbol.toUpperCase();
        if (querySymbol === "GOLD") querySymbol = "GC=F";
        if (querySymbol === "SILVER") querySymbol = "SI=F";

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${querySymbol}?interval=1d&range=1d`;
        const res = await fetch(url);

        if (!res.ok) return `Failed to fetch stock data for ${symbol}`;

        const data = await res.json();
        const result = data.chart?.result?.[0];

        if (!result || !result.meta) return `Stock symbol "${symbol}" not found.`;

        const price = result.meta.regularMarketPrice;
        const prevClose = result.meta.chartPreviousClose;
        const rawChange = ((price - prevClose) / prevClose * 100);
        const change = rawChange.toFixed(2);
        const currency = result.meta.currency;

        return `📈 **${querySymbol} Price:**\n${price} ${currency} (${rawChange > 0 ? '+' : ''}${change}%)`;
      }

      return "Invalid type. Use 'crypto' or 'stock'.";

    } catch (error: any) {
      return `Error fetching financial data: ${error.message}`;
    }
  }
};

// ============================================
// Export all Web Search MCP Tools
// ============================================

export const WebSearchMCPTools: MCPTool[] = [
  webSearchTool,
  fetchWebContentTool,
  getTrendingTopicsTool,
  getWeatherTool,
  getNewsTool,
  getCurrentDateTimeTool,
  getFinancialDataTool, // Added new tool
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
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate slight delay for realism/prevent rate limits
  return await tool.execute(params);
}

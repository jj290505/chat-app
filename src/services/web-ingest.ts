
import { addKnowledge } from "./knowledge";

/**
 * Fetches content from a URL and ingests it into the knowledge base.
 */
export async function ingestFromUrl(url: string, conversationId?: string) {
    try {
        // In a real app, you'd use a library like 'cheerio' or 'puppeteer' 
        // to scrape the content properly. For this demo, we'll use a simple fetch.
        const response = await fetch(url);
        const html = await response.text();

        // Very basic text extraction (removing script/style tags would be better)
        const text = html
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 5000); // Limit size for now

        if (text.length < 100) {
            throw new Error("Could not extract enough text from URL");
        }

        await addKnowledge(`Content from ${url}: ${text}`, conversationId, { source: url, type: "url_ingest" });
        return { success: true, length: text.length };
    } catch (error: any) {
        console.error("URL Ingestion Error:", error);
        throw error;
    }
}

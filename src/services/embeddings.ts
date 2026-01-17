
export async function getEmbedding(text: string): Promise<number[]> {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY is missing");
    }

    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "openai/text-embedding-3-small",
            input: text.replace(/\n/g, " "),
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter Embedding Error: ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

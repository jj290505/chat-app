
import fs from "fs";
import path from "path";

// Manually load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const groqKeyMatch = envContent.match(/OPENROUTER_API_KEY=(.*)/);
const apiKey = groqKeyMatch ? groqKeyMatch[1].trim() : null;

async function testOpenRouter() {
    if (!apiKey) {
        console.error("OPENROUTER_API_KEY not found in .env.local");
        return;
    }
    console.log("Using API Key:", apiKey.substring(0, 10) + "...");

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.3-70b-instruct:free",
                messages: [
                    { role: "user", content: "Hi" }
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`Error ${response.status}: ${error}`);
            return;
        }

        const data = await response.json();
        console.log("Response:", data.choices[0].message.content);
        console.log("Test finished successfully!");
    } catch (error) {
        console.error("Error during test:", error);
    }
}

testOpenRouter();

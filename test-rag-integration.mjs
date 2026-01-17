
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const openRouterKey = envContent.match(/OPENROUTER_API_KEY=(.*)/)?.[1].trim();

async function testRAG() {
    console.log("🚀 Starting RAG Integration Test...");

    // 1. Ingest a secret fact
    console.log("📥 Ingesting secret knowledge...");
    const ingestRes = await fetch("http://localhost:3000/api/ai/knowledge/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            content: "The secret code for the Nexus Vault is ALPHA-DELTA-99. It was established on January 17th, 2026.",
            metadata: { category: "secrets", test: true }
        }),
    });

    const ingestData = await ingestRes.json();
    console.log("Result:", ingestData);

    // 2. Ask Llama about it
    console.log("\n🤖 Asking Llama about the secret...");
    const chatRes = await fetch("http://localhost:3000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            currentMessage: "What is the secret code for the Nexus Vault?",
            userName: "Tester"
        }),
    });

    if (!chatRes.ok) {
        console.error("Chat API Error:", await chatRes.text());
        return;
    }

    const reader = chatRes.body.getReader();
    const decoder = new TextDecoder();
    process.stdout.write("Llama Response: ");

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        process.stdout.write(decoder.decode(value));
    }
    console.log("\n\n✅ Test Complete!");
}

testRAG().catch(console.error);

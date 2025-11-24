/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  AI: Ai;
  KV_BINDING: KVNamespace;
}

export interface ChatRequestBody {
  prompt: string;
}


export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const method = request.method.toUpperCase();
        const url = new URL(request.url);


    // Route to get chat history
    if (method === "GET" && url.pathname === "/history") {
      try {
        const historyJSON = await env.KV_BINDING.get("history");
        const history: string[] = historyJSON ? JSON.parse(historyJSON) : [];
        return new Response(JSON.stringify({history}), {
          headers: {
            "content-type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (err) {
        console.error("Error reading history from KV:", err);
        return new Response("Error reading history", { status: 500 });
      }
    }
    let body: ChatRequestBody;
    try {
      body = await request.json();
    } catch (e) {
      return new Response("Invalid JSON", { status: 400 });
    }

    const userPrompt = body.prompt;
    if (!userPrompt) {
      return new Response("Missing `prompt` field", { status: 400 });
    }

    // Save user prompt to KV
    void (async () => {
      try {
        const historyJSON = await env.KV_BINDING.get("history");
        const history: string[] = historyJSON ? JSON.parse(historyJSON) : [];

        const newHistory = [...history, userPrompt].slice(-50); // keep last 50 prompts
        await env.KV_BINDING.put("history", JSON.stringify(newHistory));

        console.log("Saved new history:", newHistory);
      } catch (err) {
        console.error("Error saving to KV:", err);
      }
    })();


    const messages = [
      { role: "system", content: "You are a friendly assistant" },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    const stream = await env.AI.run("@cf/meta/llama-2-7b-chat-int8", {
      messages,
      stream: true,
    });

    return new Response(stream, {
      headers: { "content-type": "text/event-stream" },
    });
  },
} satisfies ExportedHandler<Env>;
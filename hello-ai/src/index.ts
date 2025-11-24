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
}

export interface ChatRequestBody {
  prompt: string;
}


export default {
  async fetch(request: Request, env: Env): Promise<Response> {

	 if (request.method !== "POST") {
      return new Response("This is an ai chatbot api deployed with cloudflare, only POST requests allowed", { status: 405 });
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
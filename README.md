# Demo URL
https://cf-ai-chatbot.streamlit.app/

### 1. LLM (Large Language Model)
The assistant is powered by **llama-2-7b-chat-int8** on **Cloudflare Workers AI**.  
It handles user prompts and generates responses in a streaming manner.

- Streaming responses for a smooth UI experience
- Friendly system prompt included for tone and behavior

---

### 2. Workflow / Coordination
The application uses **Cloudflare Workers** to handle the chat workflow:

- Receives user input via HTTP POST
- Sends prompt to the LLM
- Streams response back to the frontend
- Saves the users prompts using **KV Storage** for state persistence

---

### 3. User Input via Chat
The frontend uses **Streamlit Pages** to provide a live chat interface:

- Users can type messages in a chat box
- Responses are streamed in real-time to the chat container
- Chat history is retrieved from KV Storage

---

### 4. Memory / State
Memory is implemented via **Cloudflare KV Storage**, which stores recent user prompts:

- Keeps up to the last 50 user prompts
- Allows retrieval of previous messages for display or further processing
- Simple JSON storage structure


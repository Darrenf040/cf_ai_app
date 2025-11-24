import json
import requests
import streamlit as st

st.set_page_config(page_title="Chatbot UI", page_icon="🤖")
st.title("Friendly Chatbot Assistant")

# Worker URL
# api_url = "http://127.0.0.1:8787/"  
api_url = "https://cf-ai-chatbot.darrenfr83.workers.dev/"  

# Chat history in session
if "messages" not in st.session_state:
    st.session_state.messages = []

# -------------------------------
# Stream from Cloudflare Worker
# -------------------------------
def stream_response(prompt: str):
    headers = {
        "Accept": "text/event-stream",
        "Content-Type": "application/json",
    }

    try:
        resp = requests.post(api_url, headers=headers, json={"prompt": prompt}, stream=True)
    except Exception as e:
        yield "[error] Network error: " + str(e)
        return

    if resp.status_code >= 400:
        yield "[error] " + resp.text
        return

    buffer = ""

    try:
        for raw in resp.iter_lines(decode_unicode=True):
            if raw is None:
                continue

            line = raw.strip()
            if not line:
                continue

            if line.startswith("data:"):
                data = line[len("data:"):].strip()

                if data == "[DONE]":
                    break

                try:
                    obj = json.loads(data)

                    # Ignore metadata
                    if "usage" in obj or "prompt_tokens" in obj:
                        continue

                    chunk = (
                        obj.get("response")
                        or obj.get("text")
                        or obj.get("delta")
                        or ""
                    )
                except Exception:
                    chunk = data

                buffer += chunk
                yield buffer
    finally:
        resp.close()


# -------------------------------
# Chat UI Display
# -------------------------------
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.write(msg["content"])

# User input box
prompt = st.chat_input("Ask something...")

if prompt:
    # Show user message immediately
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.write(prompt)

    # Assistant streaming bubble
    with st.chat_message("assistant"):
        placeholder = st.empty()

    assistant_text = ""

    for chunk in stream_response(prompt):
        assistant_text = chunk
        placeholder.write(assistant_text)

    # Save final assistant message
    st.session_state.messages.append({"role": "assistant", "content": assistant_text})

# -------------------------------
# User Prompt History Section
# -------------------------------
st.markdown("---")
st.header("User Prompt History")

def fetch_prompt_history():
    try:
        resp = requests.get(f"{api_url}history")  # your Worker should have a /history GET route
        if resp.status_code == 200:
            data = resp.json()
            return data.get("history", [])
        else:
            return [f"Error fetching history: {resp.status_code}"]
    except Exception as e:
        return [f"Error fetching history: {e}"]

history = fetch_prompt_history()

if history:
    for i, item in enumerate(history, start=1):
        st.write(f"{i}. {item}")
else:
    st.write("No history found.")

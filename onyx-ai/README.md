# Onyx Chat UI (React)

A minimal React + Vite chat console using `@chatscope/chat-ui-kit-react` and the
OpenAI SDK pointed to Onyx (`https://ai.onyx.dev/v1`). Enter a message, the app
calls the Onyx Chat Completions API, and displays the reply.

## Prerequisites

- Node.js 18+
- Onyx API key (OpenAI-compatible)

## Setup

1. Copy env template and set your key:

   ```bash
   cp .env.example .env.local
   # edit .env.local
   ```

   - `VITE_OPENAI_API_KEY` (required) — your Onyx (or OpenAI) API key
   - `VITE_OPENAI_BASE_URL` (optional; defaults to `/api`. Leave as `/api` in dev so the Vite proxy avoids CORS.)
   - `VITE_PROXY_TARGET` (optional; dev proxy upstream. Default `https://ai.onyx.dev/v1`, set to `https://api.openai.com/v1` if testing OpenAI.)

   Note: This demo runs fully in the browser, so the key is exposed. Use only a
   non-sensitive key and rotate as needed.

2. Install deps and run dev server:

   ```bash
   npm install
   npm run dev   # or ./scripts/run.sh
   ```

3. Open `http://127.0.0.1:5173` (or the port Vite prints) and chat.

## How it works

- UI: `@chatscope/chat-ui-kit-react` for the chat layout.
- Client: `openai` SDK configured via env; relative bases are normalized to
  `http(s)://<origin>/<path>` so the Vite proxy handles CORS in dev.
  `dangerouslyAllowBrowser: true` is required because this runs in-browser.
  Errors from the API are logged and shown in chat.
- Models: the app calls `models.list()` at startup and populates a selector. It
  defaults to `onyx` if present, otherwise the first returned model. Responses
  stream token-by-token into the UI.
- Chat logic lives in `src/components/ChatPanel.tsx`, building conversation
  history and calling `chat.completions.create` with the selected model.
- Config and client setup are in `src/lib/openaiClient.ts`.

## Files of interest

- `src/App.tsx`: page shell + chat panel
- `src/components/ChatPanel.tsx`: chat behavior and API calls
- `src/lib/openaiClient.ts`: OpenAI client pointed at Onyx
- `.env.example`: environment variables for local dev

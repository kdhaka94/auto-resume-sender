# LinkedIn Resume API

This is a Bun-based Express-like API for the LinkedIn Resume Chrome Extension.

## Features
- **/send-resume**: Accepts email, post content, and resume; generates a subject/message (Gemini, placeholder for now) and sends an email with the resume attached.
- **/gemini/generate**: Generates a message using Gemini (placeholder for now).

## Tech Stack
- [Bun](https://bun.sh/) (runtime)
- [Express](https://expressjs.com/) (API framework)
- [Nodemailer](https://nodemailer.com/) (email sending)
- [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Gemini integration, placeholder)

## Setup
1. Install [Bun](https://bun.sh/)
2. Install dependencies:
   ```sh
   bun install
   ```
3. Set up your SMTP credentials in `services/mailer.ts`.
4. (Optional) Integrate Gemini API in `services/gemini.ts`.
5. Start the server:
   ```sh
   bun run index.ts
   ```

## Endpoints
- `POST /send-resume` — `{ email, postContent, resume }`
- `POST /gemini/generate` — `{ prompt }`

---
This API is designed to be used by the LinkedIn Resume Chrome Extension, but can be adapted for other use cases. 
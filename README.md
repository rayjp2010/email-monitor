# Email-to-LINE Todo Monitor

Monitor a Gmail inbox for high-signal messages, extract actionable todos with Gemini, and push structured notifications to a LINE group. The project targets Google Apps Script and bundles TypeScript into a single `Code.js` output that can be deployed with `clasp`.

## How It Works
- Fetch new Gmail messages from a configurable sender whitelist.
- Use Google Gemini (`gemini-2.5-flash`) to extract todo items from each email body.
- Format todos into a single LINE message, respecting message length constraints.
- Push notifications to a LINE group and send a run summary (success/failure) after each execution.
- Persist the `lastProcessedTime` so subsequent runs only handle new emails.

## Features
- Whitelist-based Gmail filtering to avoid noisy messages.
- AI-assisted extraction with fallback handling for malformed responses.
- LINE Messaging API integration with retry logic and structured error reporting.
- Time-limit awareness to respect Apps Script’s 6-minute execution window.
- Centralized logging with leveled output for easier debugging in Apps Script executions.

## Requirements
- Node.js ≥ 18 and pnpm 9 (alternatively npm/yarn if you prefer).
- Google account with Gmail and Google Apps Script access.
- LINE Messaging API channel (group bot) and a long-lived Channel Access Token.
- Gemini API key for the Generative Language API.
- `@google/clasp` installed globally for deploying to Apps Script.

## Project Structure
```
src/
  config/        Script Properties loading and validation
  email/         Gmail fetching and type definitions
  gemini/        Gemini API client for todo extraction
  line/          LINE Messaging API client and message formatting
  logging/       Minimal logger wrapper
  main.ts        Apps Script entry point (`processEmails`)
dist/            Bundled Apps Script output (generated)
appsscript.json  Apps Script project configuration (timezone, scopes)
webpack.config.js  Bundles TypeScript for Apps Script (ts-loader + gas-webpack-plugin)
```

## Setup

1. **Install dependencies**
   ```bash
   pnpm install
   # or: npm install
   ```

2. **Install clasp globally (if not already)**
   ```bash
   npm install -g @google/clasp
   clasp login
   ```

3. **Create or link an Apps Script project**
   ```bash
   clasp create --title "Email-to-LINE Monitor" --type standalone
   # or, if you already have a project:
   clasp clone <script-id>
   ```
   > Remember to add `.clasp.json` and `.clasprc.json` to `.gitignore` if they are not already ignored.

4. **Build the Apps Script bundle**
   ```bash
   pnpm run build
   ```
   The bundled output lives at `dist/Code.js`.

5. **Push to Apps Script**
   ```bash
   pnpm run deploy
   # equivalent to: pnpm run build && cp appsscript.json dist/ && clasp push --force
   ```

6. **Open the Apps Script editor (optional)**
   ```bash
   clasp open
   ```

## Configuration (Script Properties)
Set the following Script Properties in the Apps Script editor (`Project Settings → Script properties`). Each property is stored individually:

| Property             | Required | Notes |
|----------------------|----------|-------|
| `lineAccessToken`    | ✅       | Long-lived LINE Messaging API channel access token. |
| `lineGroupId`        | ✅       | LINE group ID that receives notifications (starts with `C`). |
| `geminiApiKey`       | ✅       | Google Generative Language (Gemini) API key. |
| `senderWhitelist`    | ✅       | Comma-separated list of email addresses to monitor. |
| `lastProcessedTime`  | ✅       | Unix timestamp (ms). Use `0` for first deployment to process new mail only. |
| `maxEmailsPerRun`    | Optional | Defaults to `100` if omitted. Controls the Gmail fetch limit per run. |

After the first successful run, `lastProcessedTime` is updated automatically to prevent reprocessing.

## Running & Automation
- The Apps Script entry point is `processEmails`. Trigger it manually from the editor or add time-based triggers (e.g., twice a day).
- The script logs detailed progress via `console.log`, which is viewable in the Apps Script execution logs.
- Each run sends a summary message (success or error) to the configured LINE group so failures are visible quickly.

## Development Scripts
| Command             | Description |
|---------------------|-------------|
| `pnpm run build`    | Compile TypeScript and bundle into `dist/Code.js`. |
| `pnpm run build:dev`| Development build with source maps. |
| `pnpm run watch`    | Rebuild on file changes. |
| `pnpm run lint`     | Run ESLint against `src/**/*.ts`. |
| `pnpm run lint:fix` | Autofix lint issues where possible. |
| `pnpm run type-check` | Run the TypeScript compiler without emitting output. |
| `pnpm run format`   | Format source files with Prettier. |

> Automated tests are not yet implemented (`tests/` currently holds placeholders). Consider adding unit tests for message formatting and config validation as the next improvement.

## Deployment Tips
- Ensure the Apps Script project has the OAuth scopes declared in `appsscript.json` (`gmail.readonly`, `script.scriptapp`, `script.external_request`).
- If you use CI/CD, replicate the build and deploy steps (build → copy `appsscript.json` → `clasp push`). Store `~/.clasprc.json` and `.clasp.json` contents securely as secrets.
- LINE API allows only five messages per push request; `MessageFormatter` keeps output within the 5,000 character limit, truncating if needed.

## Monitoring & Troubleshooting
- Use Apps Script **Executions** to inspect logs with timestamps and log levels.
- LINE errors are returned with parsed details; check run summaries in the LINE group if something fails silently.
- Gemini responses are validated—malformed or empty responses fall back to an empty todo list and are logged for follow-up.

## License
MIT License. See `LICENSE` (create one if needed) or update this section to match your chosen license.

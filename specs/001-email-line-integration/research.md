# Research: Email-to-LINE Todo Notification System

**Date**: 2025-10-19
**Feature**: Email-to-LINE Integration
**Purpose**: Document technology decisions, best practices, and implementation patterns

## 1. Google Apps Script + TypeScript Setup

### Decision: Use clasp with TypeScript and webpack bundling

**Rationale**:
- clasp is the official Google tool for local Apps Script development
- TypeScript provides type safety required by constitution
- webpack bundles TypeScript code into single .gs file for Apps Script
- Enables modern development workflow with IDE support

**Implementation Approach**:
```bash
# Install clasp globally
npm install -g @google/clasp

# Project dependencies
npm install --save-dev @types/google-apps-script typescript webpack webpack-cli ts-loader gas-webpack-plugin
```

**Key Configuration**:
- `tsconfig.json`: Target ES2019 (V8 runtime), strict mode enabled
- `webpack.config.js`: Bundle src/ into single Code.gs for deployment
- `gas-webpack-plugin`: Handles Google Apps Script global functions
- `.clasp.json`: Points to Apps Script project ID (gitignored for security)

**Alternatives Considered**:
- **Raw JavaScript**: Rejected due to TypeScript requirement in constitution
- **Apps Script IDE only**: Rejected due to lack of version control, linting, and type safety
- **Rollup instead of webpack**: Rejected due to better webpack ecosystem for Apps Script

**Best Practices**:
- Use named exports for all functions except main entry points
- Declare global functions (trigger handlers) explicitly for Apps Script
- Keep webpack bundle under 50MB limit (shouldn't be an issue)
- Use source maps for debugging

### Decision: V8 Runtime (not Rhino)

**Rationale**:
- Modern JavaScript features (ES6+, async/await, classes)
- Better performance
- Required for TypeScript transpilation
- Rhino is deprecated

**Configuration**:
```json
// appsscript.json
{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

## 2. LINE Messaging API Integration

### Decision: Use native UrlFetchApp with typed wrappers (no SDK)

**Rationale**:
- Google Apps Script cannot import external npm packages at runtime
- LINE Messaging API is simple HTTP REST API
- UrlFetchApp is native and type-safe with @types/google-apps-script
- Custom TypeScript wrapper provides type safety

**Implementation Pattern**:
```typescript
interface LineMessage {
  type: 'text';
  text: string;
}

interface LinePushRequest {
  to: string;  // Group ID or User ID
  messages: LineMessage[];
}

class LineService {
  private readonly baseUrl = 'https://api.line.me/v2/bot/message';

  constructor(private accessToken: string) {}

  pushMessage(groupId: string, text: string): void {
    const payload: LinePushRequest = {
      to: groupId,
      messages: [{ type: 'text', text }]
    };

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(`${this.baseUrl}/push`, options);
    // Handle response...
  }
}
```

**Authentication**:
- Use Channel Access Token (long-lived token)
- Store in Script Properties
- Never commit to source code

**Rate Limiting**:
- LINE free plan: 500 messages/month
- Implement exponential backoff on 429 errors
- Log all API calls for monitoring

**Error Handling**:
- 400: Invalid request format
- 401: Invalid access token
- 429: Rate limit exceeded
- 500: LINE server error
- Retry with exponential backoff (1s, 2s, 4s max)

**Alternatives Considered**:
- **@line/bot-sdk**: Rejected, cannot bundle for Apps Script runtime
- **Custom HTTP library**: Rejected, UrlFetchApp is native and sufficient

**Best Practices**:
- Always set `muteHttpExceptions: true` to handle errors gracefully
- Parse response body to check for LINE error messages
- Implement retry logic for transient failures
- Log all LINE API interactions for debugging

## 3. Todo Extraction Patterns

### Decision: Multi-pattern regex matching with fallback

**Rationale**:
- Emails have varied formats (bullets, numbers, action verbs)
- Regex provides flexible pattern matching
- Multiple patterns increase extraction accuracy
- Fallback pattern prevents missed todos

**Extraction Patterns**:

1. **Numbered Lists**:
   ```typescript
   const numberedPattern = /^\s*\d+[\.)]\s+(.+)$/gm;
   // Matches: "1. Buy groceries", "1) Call client"
   ```

2. **Bullet Lists**:
   ```typescript
   const bulletPattern = /^\s*[-*•]\s+(.+)$/gm;
   // Matches: "- Finish report", "* Review code", "• Send email"
   ```

3. **Action Verbs**:
   ```typescript
   const actionPattern = /^(TODO|TASK|Action|Follow up|Follow-up):\s*(.+)$/gmi;
   // Matches: "TODO: Update docs", "Action: Schedule meeting"
   ```

4. **Checkbox Format**:
   ```typescript
   const checkboxPattern = /^\s*\[[ x]\]\s+(.+)$/gm;
   // Matches: "[ ] Incomplete task", "[x] Completed task"
   ```

**Implementation**:
```typescript
class EmailParser {
  extractTodos(emailBody: string): TodoItem[] {
    const patterns = [
      /^\s*\d+[\.)]\s+(.+)$/gm,      // Numbered
      /^\s*[-*•]\s+(.+)$/gm,          // Bullets
      /^(TODO|TASK|Action):\s*(.+)$/gmi, // Action verbs
      /^\s*\[[ x]\]\s+(.+)$/gm        // Checkboxes
    ];

    const todos: TodoItem[] = [];
    const plainText = this.stripHtml(emailBody);

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(plainText)) !== null) {
        const description = match[1] || match[2]; // Handle different capture groups
        if (description && !this.isDuplicate(todos, description)) {
          todos.push({
            description: description.trim(),
            source: 'email',
            timestamp: new Date()
          });
        }
      }
    }

    return todos;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  private isDuplicate(todos: TodoItem[], description: string): boolean {
    return todos.some(t => t.description === description);
  }
}
```

**Alternatives Considered**:
- **Natural Language Processing**: Rejected, too complex and slow for Apps Script
- **Single regex pattern**: Rejected, insufficient coverage of formats
- **Machine learning**: Rejected, overkill and not feasible in Apps Script

**Best Practices**:
- Strip HTML tags before pattern matching
- Deduplicate extracted todos
- Preserve original text formatting where possible
- Handle both plain text and HTML emails
- Log extraction failures for pattern refinement

## 4. GitHub Actions for clasp Deployment

### Decision: GitHub Actions with clasp and service account authentication

**Rationale**:
- Native GitHub integration (no third-party CI needed)
- Free for public repos, generous limits for private
- clasp supports service account authentication
- Automated deployment on merge to main

**Workflow Configuration**:
```yaml
# .github/workflows/deploy.yml
name: Deploy to Google Apps Script

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint and type-check
        run: |
          npm run lint
          npm run type-check

      - name: Build
        run: npm run build

      - name: Setup clasp
        run: |
          echo "$CLASP_CREDENTIALS" > ~/.clasprc.json
          echo "$CLASP_PROJECT" > .clasp.json
        env:
          CLASP_CREDENTIALS: ${{ secrets.CLASP_CREDENTIALS }}
          CLASP_PROJECT: ${{ secrets.CLASP_PROJECT }}

      - name: Deploy to Apps Script
        run: npx @google/clasp push
```

**GitHub Secrets Setup**:
1. **CLASP_CREDENTIALS**: OAuth credentials from `~/.clasprc.json`
   ```json
   {
     "token": {
       "access_token": "...",
       "refresh_token": "...",
       "scope": "...",
       "token_type": "Bearer"
     },
     "oauth2ClientSettings": {
       "clientId": "...",
       "clientSecret": "...",
       "redirectUri": "..."
     }
   }
   ```

2. **CLASP_PROJECT**: Project configuration from `.clasp.json`
   ```json
   {
     "scriptId": "your-script-id",
     "rootDir": "./dist"
   }
   ```

**Security Considerations**:
- Never commit `.clasprc.json` or `.clasp.json` with credentials
- Use GitHub repository secrets for sensitive data
- Rotate OAuth tokens if leaked
- Limit deployment to protected branches

**Alternatives Considered**:
- **Manual deployment**: Rejected, prone to errors and not automated
- **GitLab CI**: Rejected, using GitHub already
- **Service account**: Considered but OAuth is simpler for personal projects

**Best Practices**:
- Run linting and type-checking before deployment
- Use `npm ci` instead of `npm install` for reproducible builds
- Cache npm packages to speed up workflow
- Deploy only from main branch
- Add deployment status badge to README

## 5. Google Apps Script Limitations & Workarounds

### Execution Time Limit: 6 minutes

**Issue**: Scripts timeout after 6 minutes
**Workaround**:
- Process emails in batches
- Track last processed email timestamp
- Resume from checkpoint on next run
- Avoid processing same emails twice

```typescript
function processEmails(): void {
  const startTime = Date.now();
  const MAX_RUNTIME = 5.5 * 60 * 1000; // 5.5 minutes (safety buffer)

  const lastProcessedTime = getLastProcessedTime();
  const emails = getNewEmails(lastProcessedTime);

  for (const email of emails) {
    if (Date.now() - startTime > MAX_RUNTIME) {
      Logger.log('Approaching timeout, stopping processing');
      break;
    }

    processEmail(email);
    updateLastProcessedTime(email.date);
  }
}
```

### Properties Service: 500KB limit

**Issue**: Script Properties limited to 500KB total
**Workaround**:
- Store only essential config (tokens, whitelist, timestamp)
- Use compact JSON format
- Avoid storing logs or history in Properties
- Estimated usage: <10KB for typical config

```typescript
interface AppConfig {
  lineAccessToken: string;      // ~200 bytes
  lineGroupId: string;           // ~50 bytes
  senderWhitelist: string[];     // ~500 bytes (10 senders × 50 chars)
  lastProcessedTime: number;     // ~20 bytes
  // Total: ~800 bytes (well under limit)
}
```

### Trigger Configuration

**Issue**: Need to run twice daily at specific times
**Solution**: Use time-based triggers via Apps Script UI or script setup

```typescript
function setupTriggers(): void {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // Create morning trigger (8 AM)
  ScriptApp.newTrigger('processEmails')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .create();

  // Create evening trigger (6 PM)
  ScriptApp.newTrigger('processEmails')
    .timeBased()
    .atHour(18)
    .everyDays(1)
    .create();
}
```

### Error Handling & Retries

**Best Practices**:
```typescript
function withRetry<T>(fn: () => T, maxRetries = 3): T {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return fn();
    } catch (error) {
      lastError = error as Error;
      Logger.log(`Attempt ${attempt + 1} failed: ${error}`);

      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        Utilities.sleep(delay);
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

### Gmail API Quotas

**Limits**:
- 100,000 reads/day (free tier)
- 10,000 recipient operations/day

**Workaround**:
- Twice-daily runs = ~100-200 emails processed/day
- Well within quota limits
- Use search filters to minimize reads

## Summary of Technology Decisions

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Language | TypeScript 5.x | Constitution requirement, type safety |
| Runtime | Google Apps Script V8 | Modern JS, async support |
| Build Tool | webpack + gas-webpack-plugin | Bundle TS for Apps Script |
| Deployment | clasp + GitHub Actions | Automated CI/CD pipeline |
| LINE Integration | UrlFetchApp + typed wrappers | Native, no external dependencies |
| Todo Extraction | Multi-pattern regex | Flexible, covers common formats |
| Configuration | Script Properties | Native, secure key-value store |
| Code Quality | ESLint + Prettier | Constitution requirement |
| Testing | Jest (optional) | Unit tests for parsers/formatters |

All decisions align with constitution principles: TypeScript for type safety, ESLint/Prettier for code quality, externalized configuration, and automated deployment.

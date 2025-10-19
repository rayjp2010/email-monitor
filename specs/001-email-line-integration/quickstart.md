# Quickstart Guide: Email-to-LINE Todo Notification System

**Last Updated**: 2025-10-19
**Estimated Setup Time**: 10-15 minutes

## Prerequisites

Before you begin, ensure you have:

- ✅ Google account with Gmail access
- ✅ LINE account and access to create a LINE bot
- ✅ Node.js 18+ and npm installed locally
- ✅ Git installed
- ✅ GitHub account (for automated deployment)
- ✅ Text editor or IDE (VS Code recommended)

## Overview

This guide will walk you through:
1. Setting up a LINE Messaging API bot
2. Cloning and configuring the project locally
3. Deploying to Google Apps Script
4. Configuring the application
5. Setting up automated deployment via GitHub Actions
6. Testing the integration

## Part 1: LINE Bot Setup

### Step 1.1: Create LINE Messaging API Channel

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Log in with your LINE account
3. Create a new provider (or select existing)
4. Click "Create a Messaging API channel"
5. Fill in required information:
   - **Channel name**: Email Todo Notifier
   - **Channel description**: Automated email todo notifications
   - **Category**: Productivity tools
   - **Subcategory**: Task management
6. Agree to terms and create channel

### Step 1.2: Configure Channel Settings

1. In channel settings, navigate to "Messaging API" tab
2. **Disable** "Use webhooks" (we only push messages)
3. **Disable** "Auto-reply messages"
4. **Disable** "Greeting messages"
5. Issue a **Channel Access Token** (long-lived)
6. Copy and save the token securely (you'll need this later)

### Step 1.3: Add Bot to LINE Group

1. In channel settings, find the QR code or channel ID
2. On your phone, scan QR code or search for the bot
3. Add the bot to your desired LINE group
4. Get the **Group ID**:
   - Method 1: Use LINE API to get group ID when bot joins
   - Method 2: Send a test message and check webhook (if enabled temporarily)
   - Method 3: Use developer tools to extract from LINE app

**Note**: Group ID starts with 'C' (e.g., `C1234567890abcdef1234567890abcdef`)

## Part 2: Local Development Setup

### Step 2.1: Clone Repository

```bash
git clone https://github.com/your-username/email-monitor.git
cd email-monitor
```

### Step 2.2: Install Dependencies

```bash
npm install
```

This installs:
- TypeScript compiler
- @google/clasp (Apps Script CLI)
- @types/google-apps-script (type definitions)
- ESLint and Prettier
- webpack and build tools

### Step 2.3: Install clasp Globally

```bash
npm install -g @google/clasp
```

### Step 2.4: Login to Google Apps Script

```bash
clasp login
```

This opens a browser window for Google OAuth authentication. Grant permissions to clasp.

### Step 2.5: Create Apps Script Project

```bash
clasp create --title "Email to LINE Monitor" --type standalone
```

This creates:
- A new Google Apps Script project
- `.clasp.json` file with project ID (DO NOT COMMIT THIS)

**Important**: Add `.clasp.json` to `.gitignore`:

```bash
echo ".clasp.json" >> .gitignore
echo ".clasprc.json" >> .gitignore
```

## Part 3: Initial Deployment

### Step 3.1: Build TypeScript

```bash
npm run build
```

This compiles TypeScript to JavaScript and bundles for Apps Script.

### Step 3.2: Deploy to Apps Script

```bash
clasp push
```

This uploads your code to Google Apps Script.

### Step 3.3: Open in Apps Script Editor

```bash
clasp open
```

This opens the Apps Script project in your browser.

## Part 4: Configuration

### Step 4.1: Set Script Properties

In the Apps Script editor:

1. Click **Project Settings** (gear icon)
2. Scroll to **Script Properties**
3. Click **Add script property**
4. Add the following properties:

| Property | Value | Example |
|----------|-------|---------|
| `config` | JSON string with configuration | See below |

**Configuration JSON Structure**:

```json
{
  "lineAccessToken": "YOUR_LINE_CHANNEL_ACCESS_TOKEN",
  "lineGroupId": "YOUR_LINE_GROUP_ID",
  "senderWhitelist": [
    "boss@company.com",
    "important@example.com"
  ],
  "lastProcessedTime": 0,
  "maxEmailsPerRun": 100,
  "enableLogging": true,
  "retryAttempts": 3
}
```

**Important**:
- Replace `YOUR_LINE_CHANNEL_ACCESS_TOKEN` with actual token from LINE
- Replace `YOUR_LINE_GROUP_ID` with actual group ID (starts with 'C')
- Add email addresses you want to monitor to `senderWhitelist`
- Set `lastProcessedTime` to `0` for first run (processes all emails)

### Step 4.2: Alternative - Use Setup Script

You can also use the provided setup function:

1. In Apps Script editor, select `setup.ts > initializeConfig` function
2. Click **Run**
3. Grant permissions when prompted
4. Follow prompts to enter configuration values

## Part 5: Trigger Configuration

### Step 5.1: Set Up Time-Based Triggers

In the Apps Script editor:

1. Click **Triggers** (clock icon) in left sidebar
2. Click **Add Trigger**
3. Configure **First Trigger** (Morning):
   - Function: `processEmails`
   - Event source: `Time-driven`
   - Type: `Day timer`
   - Time of day: `8 AM to 9 AM`
4. Click **Save**

5. Click **Add Trigger** again
6. Configure **Second Trigger** (Evening):
   - Function: `processEmails`
   - Event source: `Time-driven`
   - Type: `Day timer`
   - Time of day: `6 PM to 7 PM`
7. Click **Save**

**Note**: You can customize the times based on your preference.

### Step 5.2: Alternative - Use Setup Script

Run the `setupTriggers()` function from `setup.ts` to automatically create triggers.

## Part 6: GitHub Actions Deployment (Optional)

### Step 6.1: Prepare Credentials

1. **Get clasp credentials**:
   ```bash
   cat ~/.clasprc.json
   ```
   Copy the entire JSON content

2. **Get project configuration**:
   ```bash
   cat .clasp.json
   ```
   Copy the entire JSON content

### Step 6.2: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add two secrets:

   **Secret 1: CLASP_CREDENTIALS**
   - Name: `CLASP_CREDENTIALS`
   - Value: Contents of `~/.clasprc.json`

   **Secret 2: CLASP_PROJECT**
   - Name: `CLASP_PROJECT`
   - Value: Contents of `.clasp.json`

### Step 6.3: Verify Workflow

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:
- Run on pushes to `main` branch
- Lint and type-check code
- Build TypeScript
- Deploy to Google Apps Script

Push to `main` to trigger first automated deployment:

```bash
git add .
git commit -m "Initial setup"
git push origin main
```

## Part 7: Testing

### Step 7.1: Test Configuration

In Apps Script editor:

1. Select function: `testConfiguration`
2. Click **Run**
3. Check **Execution log** for results
4. Should see: "✅ Configuration valid"

### Step 7.2: Test LINE Connection

1. Select function: `testLineConnection`
2. Click **Run**
3. Check your LINE group for test message
4. Should receive: "🧪 Test message from Email-to-LINE Monitor"

### Step 7.3: Send Test Email

1. Send an email to your Gmail account from a whitelisted sender
2. Include todos in the email:
   ```
   Here are the tasks for today:

   1. Review pull request #123
   2. Update documentation
   3. Schedule team meeting
   ```

3. Manually run `processEmails` function in Apps Script
4. Check LINE group for notification

### Step 7.4: Verify Processing

Check execution logs for:
- ✅ Emails fetched
- ✅ Sender filtering applied
- ✅ Todos extracted
- ✅ LINE message sent
- ✅ No errors

## Part 8: Monitoring

### View Execution Logs

1. In Apps Script editor, click **Executions** (list icon)
2. View recent executions
3. Click on execution to see detailed logs

### Check Trigger History

1. Click **Triggers** (clock icon)
2. View trigger execution history
3. Check for failures

### LINE Message Delivery

- Check LINE group for notifications
- Verify message format is correct
- Ensure todos are properly extracted

## Troubleshooting

### Issue: "Configuration not found"

**Solution**: Ensure Script Properties are set correctly
1. Check Apps Script > Project Settings > Script Properties
2. Verify `config` property exists
3. Validate JSON format

### Issue: "LINE API 401 Unauthorized"

**Solution**: Check LINE access token
1. Verify token in Script Properties
2. Ensure token hasn't expired
3. Check token has correct permissions

### Issue: "No emails processed"

**Solution**: Check sender whitelist
1. Verify sender email addresses in whitelist
2. Check `lastProcessedTime` isn't too recent
3. Manually set `lastProcessedTime` to `0` to reprocess all

### Issue: "Gmail quota exceeded"

**Solution**: Google Apps Script has daily quotas
1. Check quota usage in Apps Script dashboard
2. Reduce `maxEmailsPerRun` if processing too many
3. Wait 24 hours for quota reset

### Issue: "Execution timeout"

**Solution**: Script exceeded 6-minute limit
1. Reduce `maxEmailsPerRun` in configuration
2. Process emails in smaller batches
3. Check for infinite loops in code

### Issue: "GitHub Actions deployment fails"

**Solution**: Check secrets and permissions
1. Verify `CLASP_CREDENTIALS` secret is correct
2. Verify `CLASP_PROJECT` secret is correct
3. Check GitHub Actions logs for specific error

## Next Steps

After successful setup:

1. **Monitor for a week**: Ensure triggers run successfully
2. **Refine whitelist**: Add/remove senders as needed
3. **Customize extraction**: Adjust todo patterns if needed
4. **Review logs**: Check for any errors or issues
5. **Optimize**: Adjust `maxEmailsPerRun` based on volume

## Additional Resources

- [LINE Messaging API Documentation](https://developers.line.biz/en/reference/messaging-api/)
- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [clasp Documentation](https://github.com/google/clasp)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Support

If you encounter issues:

1. Check execution logs in Apps Script
2. Review troubleshooting section above
3. Check GitHub Issues for similar problems
4. Create new issue with detailed error logs

---

**Congratulations!** Your Email-to-LINE Todo Notification System is now configured and running.

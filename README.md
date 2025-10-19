# playwright-telegram-reporter

Simple and Effective Playwright Reporter via Telegram Bot

Send your Playwright test results directly to Telegram with flexible reporting options.

## Features

- 🚀 **Simple Setup** - Just add to your Playwright config
- 📊 **Multiple Report Types** - Simple, Summary, or Detailed reports
- 🎨 **Custom Formatters** - Full control over message formatting
- ⚙️ **Configurable Triggers** - Send always, only on failure, or only on success
- 🔒 **Zero Dependencies** - Uses native Node.js fetch (requires Node.js 18+)
- 📦 **TypeScript Support** - Full type definitions included

## Installation

```bash
npm install @b3nab/playwright-telegram-reporter
# or
pnpm add @b3nab/playwright-telegram-reporter
# or
yarn add @b3nab/playwright-telegram-reporter
```

## Prerequisites

1. **Node.js 18+** - Required for native fetch support
2. **Telegram Bot Token** - Get one from [@BotFather](https://t.me/BotFather)
3. **Chat ID** - The Telegram chat where messages will be sent

### Getting Your Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow the prompts to create your bot
4. Copy the bot token provided

### Getting Your Chat ID

1. Start a chat with your bot or add it to a group
2. Send any message to the chat
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for the `chat.id` field in the JSON response

## Usage

### Quick Start (Recommended)

The simplest way to add the reporter to your `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'], // Keep the default list reporter for console output
    [
      '@b3nab/playwright-telegram-reporter',
      {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
      },
    ],
  ],
  // ... other config
});
```

### Environment Variables

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

## Configuration Options

### Report Types

Choose from three built-in report types:

#### Simple Report (Minimal)

```typescript
export default defineConfig({
  reporter: [
    ['@b3nab/playwright-telegram-reporter', {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
      reportType: 'simple',
    }]
  ],
});
```

Output:
```
✅ Test run passed
```

#### Summary Report (Default)

```typescript
export default defineConfig({
  reporter: [
    ['@b3nab/playwright-telegram-reporter', {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
      reportType: 'summary',
    }]
  ],
});
```

Output:
```
✅ Playwright Test Results

Status: PASSED
Duration: 12.45s

📊 Summary:
• Total: 15
• Passed: 15
• Failed: 0
• Skipped: 0
```

#### Detailed Report

```typescript
export default defineConfig({
  reporter: [
    ['@b3nab/playwright-telegram-reporter', {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
      reportType: 'detailed',
    }]
  ],
});
```

Output includes **summary statistics and all individual test names with durations**, plus full error messages for failures:

```
✅ Playwright Test Results

Status: PASSED
Duration: 12.45s

📊 Summary:
• Total: 15
• Passed: 13
• Failed: 2
• Skipped: 0

❌ FAILED (2):

  • Auth Tests › Login with invalid credentials (3.21s)
    Error: Expected "error" but got "success"
           at page.locator...
           ...

  • API Tests › API returns 404 (1.15s)
    Error: Request failed with status 404

✅ PASSED (13):
  • Home Page › Homepage loads correctly (0.85s)
  • Home Page › Navigation menu works (1.20s)
  • Search › Search functionality (2.30s)
  • Auth Tests › User can logout (0.95s)
  ...
```

> **Note:** You can customize the title using the `title` option and test name format using the `testFormat` option (see below).

### Custom Formatter

For complete control over the message format:

```typescript
import { defineConfig } from '@playwright/test';
import type { FullResult, Suite } from '@playwright/test/reporter';

export default defineConfig({
  reporter: [
    ['@b3nab/playwright-telegram-reporter', {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
      customFormatter: (result: FullResult, suite: Suite) => {
        const tests = suite.allTests();
        return `🎭 Custom Report

Tests completed: ${tests.length}
Status: ${result.status}
Time: ${new Date().toLocaleString()}

Custom message here!`;
      },
    }]
  ],
});
```

### Send Conditions

Control when reports are sent:

```typescript
export default defineConfig({
  reporter: [
    ['@b3nab/playwright-telegram-reporter', {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
      sendOn: 'always', // 'always' | 'failure' | 'success'
    }]
  ],
});
```

- **`always`** (default) - Send report on every test run
- **`failure`** - Only send when tests fail
- **`success`** - Only send when all tests pass

### Custom Title

Customize the report title (first line):

```typescript
export default defineConfig({
  reporter: [
    ['@b3nab/playwright-telegram-reporter', {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
      title: '🎭 My Test Suite', // Simple string
    }]
  ],
});
```

Or use a function for dynamic titles based on pass/fail:

```typescript
export default defineConfig({
  reporter: [
    ['@b3nab/playwright-telegram-reporter', {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
      title: (passed) => passed ? '✅ All Tests Passed!' : '❌ Tests Failed',
    }]
  ],
});
```

### Test Name Format (Detailed Reports Only)

Customize how test names appear in detailed reports:

```typescript
export default defineConfig({
  reporter: [
    ['@b3nab/playwright-telegram-reporter', {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
      reportType: 'detailed',
      testFormat: '{GROUP} › {TEST} ({TIME})', // Default
    }]
  ],
});
```

**Available variables:**
- `{GROUP}` - Test suite/group (e.g., `Example Tests`)
- `{TEST}` - Test name (e.g., `has heading`)
- `{TIME}` - Duration (e.g., `0.58s`)
- `{BROWSER}` - Browser/project (e.g., `chromium`)
- `{FILENAME}` - File name (e.g., `example.spec.ts`)

**Example formats:**

| Format | Output |
|--------|--------|
| `{GROUP} › {TEST} ({TIME})` | `Example Tests › has heading (0.58s)` |
| `{TEST} ({TIME})` | `has heading (0.58s)` |
| `{BROWSER} \| {TEST}` | `chromium \| has heading` |
| `{FILENAME} › {TEST}` | `example.spec.ts › has heading` |

## Complete Example

```typescript
import { defineConfig } from '@playwright/test';
import type { TelegramReporterOptions } from '@b3nab/playwright-telegram-reporter';

export default defineConfig({
  testDir: './tests',
  reporter: [
    ['html'],
    ['list'],
    [
      '@b3nab/playwright-telegram-reporter',
      {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || '',
        reportType: 'summary',
        sendOn: 'always',
      } satisfies TelegramReporterOptions,
    ],
  ],
  use: {
    baseURL: 'https://example.com',
    trace: 'on-first-retry',
  },
});
```

## TypeScript Support

Full TypeScript definitions are included. Import types for better type safety:

```typescript
import type {
  TelegramReporterOptions,
  ReportType,
  SendOn,
} from '@b3nab/playwright-telegram-reporter';

const options: TelegramReporterOptions = {
  botToken: 'your-token',
  chatId: 'your-chat-id',
  reportType: 'summary',
  sendOn: 'failure',
};
```

You can also use the `satisfies` operator for inline type checking:

```typescript
import { defineConfig } from '@playwright/test';
import type { TelegramReporterOptions } from '@b3nab/playwright-telegram-reporter';

export default defineConfig({
  reporter: [
    [
      '@b3nab/playwright-telegram-reporter',
      {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || '',
        reportType: 'detailed',
        sendOn: 'failure',
      } satisfies TelegramReporterOptions,
    ],
  ],
});
```

## API Reference

### TelegramReporterOptions

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `botToken` | `string` | ✅ Yes | - | Telegram Bot Token from @BotFather |
| `chatId` | `string` | ✅ Yes | - | Telegram Chat ID where messages are sent |
| `reportType` | `'simple' \| 'summary' \| 'detailed'` | No | `'detailed'` | Report type: **simple** (pass/fail), **summary** (counts + duration), **detailed** (all tests + summary) |
| `customFormatter` | `(result, suite) => string` | No | - | Custom function to format the entire message |
| `sendOn` | `'always' \| 'failure' \| 'success'` | No | `'always'` | When to send: **always**, **failure** only, or **success** only |
| `title` | `string \| ((passed) => string)` | No | `'✅/❌ Playwright Test Results'` | Custom title for the report. Can be string or function |
| `testFormat` | `string` | No | `'{GROUP} › {TEST} ({TIME})'` | Template for test names. Variables: `{GROUP}`, `{TEST}`, `{TIME}`, `{BROWSER}`, `{FILENAME}` |

## Development

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm test

# Lint code
pnpm run lint

# Format code
pnpm run format
```

## Troubleshooting

### Bot doesn't send messages

1. **Check credentials**: Verify your bot token and chat ID are correct
2. **Test the bot**: Send a message directly via Telegram API:
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage" \
     -H "Content-Type: application/json" \
     -d '{"chat_id":"<YOUR_CHAT_ID>","text":"Test"}'
   ```
3. **Check permissions**: Ensure the bot has permission to send messages in the chat
4. **Environment variables**: Make sure variables are loaded (e.g., using `dotenv`)

### Reporter not running

1. **Import path**: Use the string path `'@b3nab/playwright-telegram-reporter'` instead of importing the class if you have issues
2. **Check Node version**: This package requires Node.js 18+ for native fetch support
3. **Review logs**: Check console for any error messages from `TelegramReporter`

### TypeScript errors

If you get type errors, make sure you have `@playwright/test` installed:

```bash
pnpm add -D @playwright/test
```

## Publishing

For maintainers: See [PUBLISHING.md](./PUBLISHING.md) for instructions on how to publish new versions to npm.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/org-b3nab/playwright-telegram-reporter.git
cd playwright-telegram-reporter

# Install dependencies
pnpm install

# Run linter
pnpm run lint

# Build the project
pnpm run build

# Run tests (requires Telegram credentials)
pnpm test
```

## License

AGPL-3.0-only

## Author

Benedetto Abbenanti
- Website: [ben.abbenanti.com](https://ben.abbenanti.com)

## Links

- [npm Package](https://www.npmjs.com/package/@b3nab/playwright-telegram-reporter)
- [GitHub Repository](https://github.com/org-b3nab/playwright-telegram-reporter)
- [Playwright Documentation](https://playwright.dev)
- [Telegram Bot API](https://core.telegram.org/bots/api)

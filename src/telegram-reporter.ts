import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
} from "@playwright/test/reporter"
import type { TelegramReporterOptions } from "./types"

/**
 * Playwright Reporter that sends test results to Telegram
 */
export class TelegramReporter implements Reporter {
  private options: Required<
    Omit<TelegramReporterOptions, "customFormatter">
  > & {
    customFormatter?: TelegramReporterOptions["customFormatter"]
  }
  private suite: Suite | null = null
  private startTime = 0

  constructor(options: TelegramReporterOptions) {
    this.options = {
      botToken: options.botToken,
      chatId: options.chatId,
      reportType: options.reportType || "summary",
      customFormatter: options.customFormatter,
      sendOn: options.sendOn || "always",
    }

    if (!this.options.botToken || !this.options.chatId) {
      throw new Error(
        "TelegramReporter: botToken and chatId are required options",
      )
    }
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    this.suite = suite
    this.startTime = Date.now()
  }

  async onEnd(result: FullResult): Promise<void> {
    if (!this.suite) {
      console.error("TelegramReporter: Suite data not available")
      return
    }

    // Check if we should send based on sendOn option
    if (!this.shouldSend(result)) {
      return
    }

    const message = this.generateReport(result, this.suite)
    await this.sendTelegramMessage(message)
  }

  private shouldSend(result: FullResult): boolean {
    const { sendOn } = this.options

    if (sendOn === "always") {
      return true
    }

    if (sendOn === "failure") {
      return result.status !== "passed"
    }

    if (sendOn === "success") {
      return result.status === "passed"
    }

    return true
  }

  private generateReport(result: FullResult, suite: Suite): string {
    // Use custom formatter if provided
    if (this.options.customFormatter) {
      return this.options.customFormatter(result, suite)
    }

    // Use built-in formatters based on reportType
    const { reportType } = this.options

    switch (reportType) {
      case "simple":
        return this.generateSimpleReport(result)
      case "summary":
        return this.generateSummaryReport(result, suite)
      case "detailed":
        return this.generateDetailedReport(result, suite)
      default:
        return this.generateSummaryReport(result, suite)
    }
  }

  private generateSimpleReport(result: FullResult): string {
    const emoji = result.status === "passed" ? "✅" : "❌"
    return `${emoji} Test run ${result.status}`
  }

  private generateSummaryReport(result: FullResult, suite: Suite): string {
    const allTests = suite.allTests()
    const duration = Date.now() - this.startTime
    const durationSec = (duration / 1000).toFixed(2)

    const passed = allTests.filter(
      (test) => test.results[0]?.status === "passed",
    ).length
    const failed = allTests.filter(
      (test) => test.results[0]?.status === "failed",
    ).length
    const skipped = allTests.filter(
      (test) => test.results[0]?.status === "skipped",
    ).length
    const timedOut = allTests.filter(
      (test) => test.results[0]?.status === "timedOut",
    ).length

    const emoji = result.status === "passed" ? "✅" : "❌"

    return `${emoji} Playwright Test Results

Status: ${result.status.toUpperCase()}
Duration: ${durationSec}s

📊 Summary:
• Total: ${allTests.length}
• Passed: ${passed}
• Failed: ${failed}
• Skipped: ${skipped}
${timedOut > 0 ? `• Timed Out: ${timedOut}` : ""}`
  }

  private generateDetailedReport(result: FullResult, suite: Suite): string {
    const allTests = suite.allTests()
    const duration = Date.now() - this.startTime
    const durationSec = (duration / 1000).toFixed(2)

    let report = `${result.status === "passed" ? "✅" : "❌"} Playwright Test Results\n\n`
    report += `Status: ${result.status.toUpperCase()}\n`
    report += `Duration: ${durationSec}s\n`
    report += `Total Tests: ${allTests.length}\n\n`

    // Group tests by status
    const passed: TestCase[] = []
    const failed: TestCase[] = []
    const skipped: TestCase[] = []
    const timedOut: TestCase[] = []

    for (const test of allTests) {
      const status = test.results[0]?.status
      if (status === "passed") passed.push(test)
      else if (status === "failed") failed.push(test)
      else if (status === "skipped") skipped.push(test)
      else if (status === "timedOut") timedOut.push(test)
    }

    // Failed tests with details
    if (failed.length > 0) {
      report += `❌ Failed (${failed.length}):\n`
      for (const test of failed) {
        report += `  • ${test.title}\n`
        const error = test.results[0]?.error
        if (error) {
          const errorMsg = error.message
            ? error.message.split("\n")[0]
            : "Unknown error"
          report += `    ${errorMsg}\n`
        }
      }
      report += "\n"
    }

    // Timed out tests
    if (timedOut.length > 0) {
      report += `⏱️ Timed Out (${timedOut.length}):\n`
      for (const test of timedOut) {
        report += `  • ${test.title}\n`
      }
      report += "\n"
    }

    // Skipped tests
    if (skipped.length > 0) {
      report += `⏭️ Skipped (${skipped.length}):\n`
      for (const test of skipped) {
        report += `  • ${test.title}\n`
      }
      report += "\n"
    }

    // Passed tests (just count in detailed mode to avoid too much text)
    if (passed.length > 0) {
      report += `✅ Passed: ${passed.length} tests\n`
    }

    return report
  }

  private async sendTelegramMessage(message: string): Promise<void> {
    const { botToken, chatId } = this.options
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`

    // Telegram has a 4096 character limit for messages
    const maxLength = 4096
    let textToSend = message

    if (message.length > maxLength) {
      textToSend = `${message.substring(0, maxLength - 50)}...\n\n[Message truncated]`
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: textToSend,
          parse_mode: "HTML",
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error(
          `TelegramReporter: Failed to send message. Status: ${response.status}`,
        )
        console.error(`TelegramReporter: Error: ${errorData}`)
      }
    } catch (error) {
      console.error(
        "TelegramReporter: Error sending message to Telegram:",
        error,
      )
    }
  }
}

// Default export for Playwright config when using string path
export default TelegramReporter

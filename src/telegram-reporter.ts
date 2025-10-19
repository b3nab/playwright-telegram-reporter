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
    Omit<TelegramReporterOptions, "customFormatter" | "title">
  > & {
    customFormatter?: TelegramReporterOptions["customFormatter"]
    title?: TelegramReporterOptions["title"]
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
      testFormat: options.testFormat || "{GROUP} › {TEST} ({TIME})",
      title: options.title,
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

  /**
   * Generate report title based on test status
   */
  private getTitle(passed: boolean): string {
    const { title } = this.options

    if (title) {
      return typeof title === "function" ? title(passed) : title
    }

    // Default title with emoji
    const emoji = passed ? "✅" : "❌"
    return `${emoji} Playwright Test Results`
  }

  /**
   * Main formatting function - formats test information using template
   */
  private formatTest(test: TestCase, duration: string): string {
    const titlePath = test.titlePath()
    const browser = test.parent.project()?.name || ""
    const filename = test.location.file.split("/").pop() || ""

    // titlePath format: [project, file, ...suites, testName]
    // We need to extract just the suite names (exclude project, file, and test name)
    const testName = titlePath[titlePath.length - 1] || ""

    // Filter out project name and filename to get only suite titles
    const suites = titlePath
      .slice(0, -1) // Remove test name
      .filter((title) => title !== browser && title !== filename)

    const group = suites.join(" › ")

    return this.options.testFormat
      .replace(/\{BROWSER\}/g, browser)
      .replace(/\{FILENAME\}/g, filename)
      .replace(/\{GROUP\}/g, group)
      .replace(/\{TEST\}/g, testName)
      .replace(/\{TIME\}/g, duration)
  }

  private generateSimpleReport(result: FullResult): string {
    const passed = result.status === "passed"
    return `${this.getTitle(passed)}\n\nStatus: ${result.status.toUpperCase()}`
  }

  private generateSummaryReport(result: FullResult, suite: Suite): string {
    const allTests = suite.allTests()
    const duration = Date.now() - this.startTime
    const durationSec = (duration / 1000).toFixed(2)
    const isPassed = result.status === "passed"

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

    return `${this.getTitle(isPassed)}

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
    const isPassed = result.status === "passed"

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

    // Build report with title and summary
    let report = `${this.getTitle(isPassed)}\n\n`
    report += `Status: ${result.status.toUpperCase()}\n`
    report += `Duration: ${durationSec}s\n\n`
    report += `📊 Summary:\n`
    report += `• Total: ${allTests.length}\n`
    report += `• Passed: ${passed.length}\n`
    report += `• Failed: ${failed.length}\n`
    report += `• Skipped: ${skipped.length}\n`
    if (timedOut.length > 0) report += `• Timed Out: ${timedOut.length}\n`
    report += `\n`

    // Helper to format test with duration
    const formatTestLine = (test: TestCase): string => {
      const duration = test.results[0]?.duration
        ? `${(test.results[0].duration / 1000).toFixed(2)}s`
        : "N/A"
      return this.formatTest(test, duration)
    }

    // Failed tests with full details
    if (failed.length > 0) {
      report += `❌ FAILED (${failed.length}):\n`
      for (const test of failed) {
        report += `\n  • ${formatTestLine(test)}\n`
        const error = test.results[0]?.error
        if (error) {
          const errorLines = error.message
            ? error.message.split("\n").slice(0, 3)
            : ["Unknown error"]
          report += `    Error: ${errorLines.join("\n           ")}\n`
        }
      }
      report += "\n"
    }

    // Timed out tests
    if (timedOut.length > 0) {
      report += `⏱️ TIMED OUT (${timedOut.length}):\n`
      for (const test of timedOut) {
        report += `  • ${formatTestLine(test)}\n`
      }
      report += "\n"
    }

    // Skipped tests
    if (skipped.length > 0) {
      report += `⏭️ SKIPPED (${skipped.length}):\n`
      for (const test of skipped) {
        report += `  • ${this.formatTest(test, "N/A")}\n`
      }
      report += "\n"
    }

    // Passed tests
    if (passed.length > 0) {
      report += `✅ PASSED (${passed.length}):\n`
      for (const test of passed) {
        report += `  • ${formatTestLine(test)}\n`
      }
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

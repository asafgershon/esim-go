import { DebugLevel, type DebugReport, type DebugEntry } from "./debug-collector";

/**
 * Debug output format options
 */
export interface FormatOptions {
  includeTimestamps?: boolean;
  includeData?: boolean;
  includeIds?: boolean;
  maxDataLength?: number;
  colorize?: boolean;
  indent?: string;
}

/**
 * Debug information formatter
 */
export class DebugFormatter {
  private static readonly DEFAULT_OPTIONS: FormatOptions = {
    includeTimestamps: true,
    includeData: true,
    includeIds: false,
    maxDataLength: 500,
    colorize: false,
    indent: "  ",
  };
  
  /**
   * Format debug report as text
   */
  static formatReport(report: DebugReport, options: Partial<FormatOptions> = {}): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const lines: string[] = [];
    
    // Header
    lines.push("=".repeat(80));
    lines.push(`DEBUG REPORT - ${report.context.correlationId}`);
    lines.push("=".repeat(80));
    lines.push("");
    
    // Summary
    lines.push("SUMMARY:");
    lines.push(`${opts.indent}Total Entries: ${report.summary.totalEntries}`);
    lines.push(`${opts.indent}Categories: ${report.summary.categories}`);
    lines.push(`${opts.indent}Steps: ${report.summary.steps}`);
    lines.push(`${opts.indent}Rules: ${report.summary.rules}`);
    lines.push(`${opts.indent}Duration: ${report.summary.timeSpan.duration}ms`);
    lines.push(`${opts.indent}Time Span: ${report.summary.timeSpan.start.toISOString()} → ${report.summary.timeSpan.end.toISOString()}`);
    lines.push("");
    
    // Category breakdown
    if (report.categorySummary.length > 0) {
      lines.push("CATEGORIES:");
      report.categorySummary.forEach(cat => {
        lines.push(`${opts.indent}${cat.category}: ${cat.count} entries`);
      });
      lines.push("");
    }
    
    // Step breakdown
    if (report.stepSummary.length > 0) {
      lines.push("STEPS:");
      report.stepSummary.forEach(step => {
        lines.push(`${opts.indent}${step.stepName}: ${step.count} entries`);
      });
      lines.push("");
    }
    
    // Entries
    lines.push("ENTRIES:");
    lines.push("-".repeat(80));
    
    report.entries.forEach((entry, index) => {
      lines.push(this.formatEntry(entry, opts, index + 1));
      lines.push("");
    });
    
    return lines.join("\n");
  }
  
  /**
   * Format debug report as JSON
   */
  static formatReportAsJSON(report: DebugReport, pretty: boolean = true): string {
    return JSON.stringify(report, null, pretty ? 2 : 0);
  }
  
  /**
   * Format debug entries as table
   */
  static formatEntriesAsTable(entries: DebugEntry[], options: Partial<FormatOptions> = {}): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    if (entries.length === 0) {
      return "No debug entries found.";
    }
    
    const lines: string[] = [];
    
    // Header
    const headers = ["#", "Time", "Level", "Category", "Step", "Rule", "Message"];
    const widths = [3, 12, 8, 12, 15, 15, 40];
    
    lines.push(this.formatTableRow(headers, widths));
    lines.push("-".repeat(widths.reduce((sum, w) => sum + w + 3, 0)));
    
    // Entries
    entries.forEach((entry, index) => {
      const row = [
        (index + 1).toString(),
        opts.includeTimestamps ? entry.timestamp.toTimeString().split(' ')[0] : "",
        this.formatLevel(entry.level),
        entry.category,
        entry.stepName || "",
        entry.ruleId || "",
        this.truncateText(entry.message, 40),
      ];
      
      lines.push(this.formatTableRow(row, widths));
    });
    
    return lines.join("\n");
  }
  
  /**
   * Format a single debug entry
   */
  static formatEntry(entry: DebugEntry, options: FormatOptions, index?: number): string {
    const lines: string[] = [];
    
    // Entry header
    const header = [
      index ? `[${index}]` : "",
      options.includeTimestamps ? entry.timestamp.toISOString() : "",
      `[${this.formatLevel(entry.level)}]`,
      `[${entry.category.toUpperCase()}]`,
      entry.stepName ? `[${entry.stepName}]` : "",
      entry.ruleId ? `[${entry.ruleId}]` : "",
    ].filter(Boolean).join(" ");
    
    lines.push(header);
    lines.push(`${options.indent}${entry.message}`);
    
    // Entry data
    if (options.includeData && entry.data && Object.keys(entry.data).length > 0) {
      const dataStr = JSON.stringify(entry.data, null, 2);
      const truncatedData = options.maxDataLength && dataStr.length > options.maxDataLength
        ? dataStr.substring(0, options.maxDataLength) + "..."
        : dataStr;
      
      lines.push(`${options.indent}Data: ${truncatedData}`);
    }
    
    // Entry ID
    if (options.includeIds) {
      lines.push(`${options.indent}ID: ${entry.id}`);
    }
    
    return lines.join("\n");
  }
  
  /**
   * Format debug level as string
   */
  private static formatLevel(level: DebugLevel): string {
    switch (level) {
      case DebugLevel.NONE: return "NONE";
      case DebugLevel.BASIC: return "BASIC";
      case DebugLevel.DETAILED: return "DETAIL";
      case DebugLevel.VERBOSE: return "VERBOSE";
      default: return "UNKNOWN";
    }
  }
  
  /**
   * Format table row with proper spacing
   */
  private static formatTableRow(cells: string[], widths: number[]): string {
    return cells.map((cell, i) => cell.padEnd(widths[i] || 0)).join(" | ");
  }
  
  /**
   * Truncate text to specified length
   */
  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }
}
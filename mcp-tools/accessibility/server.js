#!/usr/bin/env node
// Designpowers accessibility MCP server.
//
// A thin protocol adapter over the pure WCAG logic in wcag.js. It exposes the
// deterministic contrast checks as MCP tools so any MCP-speaking agent — Claude
// or Gemini — can get *evidence* (measured ratios, pass/fail) instead of
// guessing contrast from a screenshot.
//
// This is Designpowers v2's first "truth layer" tool: the design process stays
// model-agnostic markdown, the checkable facts come from real code.
//
// Run: node server.js   (communicates over stdio per the MCP spec)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { contrastRatio, evaluatePair, evaluatePairs } from "./wcag.js";
import { evaluateReadability } from "./readability.js";
import { evaluateTargets } from "./target-size.js";
import { evaluateAnimations } from "./motion-safety.js";

const server = new McpServer({
  name: "designpowers-accessibility",
  version: "0.2.0",
});

// --- Tool 1: check a single foreground/background pair ---
server.registerTool(
  "check_contrast",
  {
    title: "Check colour contrast (WCAG 2.2)",
    description:
      "Compute the contrast ratio between a foreground and background colour and " +
      "report pass/fail against WCAG 2.2 AA and AAA. Use this instead of estimating " +
      "contrast from a screenshot — it returns measured evidence. textSize 'large' " +
      "(>=18pt or >=14pt bold) and UI components use the 3.0 threshold.",
    inputSchema: {
      foreground: z.string().describe('Foreground/text hex colour, e.g. "#1d2430"'),
      background: z.string().describe('Background hex colour, e.g. "#ffffff"'),
      textSize: z.enum(["normal", "large"]).default("normal").describe("normal = body text (AA 4.5); large = >=18pt or >=14pt bold, and UI components (AA 3.0)"),
      label: z.string().optional().describe("Optional label for what this pair is, e.g. 'primary button'"),
    },
  },
  async ({ foreground, background, textSize, label }) => {
    const r = evaluatePair({ foreground, background, textSize, label: label || "" });
    const verdict = r.passAAA ? "PASS (AAA)" : r.passAA ? "PASS (AA)" : "FAIL (below AA)";
    const text =
      `${label ? label + ": " : ""}${foreground} on ${background} (${textSize})\n` +
      `Contrast ratio: ${r.ratio}:1\n` +
      `WCAG AA (>=${r.aaThreshold}): ${r.passAA ? "PASS" : "FAIL"}\n` +
      `WCAG AAA (>=${r.aaaThreshold}): ${r.passAAA ? "PASS" : "FAIL"}\n` +
      `Verdict: ${verdict}`;
    return {
      content: [{ type: "text", text }],
      structuredContent: r,
      isError: false,
    };
  }
);

// --- Tool 2: check many pairs at once (a whole palette/screen) ---
server.registerTool(
  "check_palette",
  {
    title: "Check many contrast pairs (WCAG 2.2)",
    description:
      "Evaluate a list of foreground/background pairs at once — e.g. every text/surface " +
      "combination on a screen or in a DESIGN.md palette. Returns each result plus a " +
      "summary of how many pass/fail WCAG AA.",
    inputSchema: {
      pairs: z
        .array(
          z.object({
            foreground: z.string(),
            background: z.string(),
            textSize: z.enum(["normal", "large"]).default("normal"),
            label: z.string().optional(),
          })
        )
        .describe("List of colour pairs to check"),
    },
  },
  async ({ pairs }) => {
    const { results, summary } = evaluatePairs(pairs);
    const lines = results.map((r) => {
      const v = r.passAAA ? "AAA" : r.passAA ? "AA" : "FAIL";
      return `  ${(r.label || `${r.foreground} on ${r.background}`).padEnd(34)} ${String(r.ratio).padStart(6)}:1  ${v}`;
    });
    const text = `Checked ${summary.total} pair(s) — ${summary.verdict}\n` + lines.join("\n");
    return {
      content: [{ type: "text", text }],
      structuredContent: { results, summary },
      isError: false,
    };
  }
);

// --- Tool 3: reading level (WCAG 3.1.5) ---
server.registerTool(
  "check_reading_level",
  {
    title: "Check reading level (WCAG 3.1.5)",
    description:
      "Compute the Flesch–Kincaid grade level of interface copy and report whether it " +
      "meets a target grade (default 6). Use this instead of guessing 'this feels grade 6' — " +
      "it returns a reproducible standard estimate (exact word/sentence counts; the syllable " +
      "step is the standard heuristic). For the content-writer's reading-level claims.",
    inputSchema: {
      text: z.string().describe("The interface copy to evaluate"),
      targetGrade: z.number().default(6).describe("Target reading grade level (Designpowers default 6)"),
      label: z.string().optional().describe("Optional label, e.g. 'empty-state body'"),
    },
  },
  async ({ text, targetGrade, label }) => {
    const r = evaluateReadability({ text, targetGrade, label: label || "" });
    const verdict = r.meetsTarget ? `MEETS grade ${targetGrade}` : `ABOVE grade ${targetGrade}`;
    const out =
      `${label ? label + ": " : ""}reading level (${r.method})\n` +
      `Flesch–Kincaid grade: ${r.fleschKincaidGrade} (target ≤ ${targetGrade})\n` +
      `Flesch reading ease: ${r.fleschReadingEase}\n` +
      `${r.wordCount} words, ${r.sentenceCount} sentence(s), ${r.syllablesPerWord} syllables/word\n` +
      `Verdict: ${verdict}`;
    return { content: [{ type: "text", text: out }], structuredContent: r, isError: false };
  }
);

// --- Tool 4: touch-target size (WCAG 2.5.8 / 2.5.5) ---
server.registerTool(
  "check_touch_targets",
  {
    title: "Check touch-target sizes (WCAG 2.5.8 / 2.5.5)",
    description:
      "Evaluate the rendered size (CSS px) of interactive targets against WCAG target-size: " +
      "AA = 24×24 (2.5.8), AAA = 44×44 (2.5.5). Exact geometry, not judgment. Pass the actual " +
      "width/height of each clickable/tappable control. For the heuristic-evaluator.",
    inputSchema: {
      targets: z
        .array(
          z.object({
            width: z.number().describe("Rendered width in CSS px"),
            height: z.number().describe("Rendered height in CSS px"),
            label: z.string().optional(),
          })
        )
        .describe("List of interactive targets to check"),
    },
  },
  async ({ targets }) => {
    const { results, summary } = evaluateTargets(targets);
    const lines = results.map((r) => {
      const v = r.passAAA ? "AAA" : r.passAA ? "AA" : "FAIL";
      return `  ${(r.label || `${r.width}×${r.height}`).padEnd(24)} ${r.width}×${r.height}px  ${v}`;
    });
    const text = `Checked ${summary.total} target(s) — ${summary.verdict}\n` + lines.join("\n");
    return { content: [{ type: "text", text }], structuredContent: { results, summary }, isError: false };
  }
);

// --- Tool 5: motion safety (WCAG 2.2.2 / 2.3.1 / 2.3.3) ---
server.registerTool(
  "check_motion_safety",
  {
    title: "Check motion safety (WCAG 2.2.2 / 2.3.1 / 2.3.3)",
    description:
      "Check declared animation properties against the motion-sensitivity criteria: flashes/sec " +
      "(2.3.1, ≤3 — seizure risk), reduced-motion fallback for non-essential motion (2.3.3), and " +
      "pausability of looping/long motion (2.2.2). Checks the declared spec, not the 'feel'. " +
      "For the motion-designer's reduced-motion commitments.",
    inputSchema: {
      animations: z
        .array(
          z.object({
            label: z.string().optional(),
            durationSeconds: z.number().default(0).describe("Run length; for looping motion, the cycle/total"),
            loops: z.boolean().default(false).describe("Repeats / auto-plays continuously"),
            flashesPerSecond: z.number().default(0).describe("Peak flash rate (0 if none)"),
            reducedMotionFallback: z.boolean().default(false).describe("Has a prefers-reduced-motion alternative"),
            essential: z.boolean().default(false).describe("Motion is essential to the info/activity"),
            pausable: z.boolean().default(false).describe("User can pause/stop/hide it"),
          })
        )
        .describe("List of animations (declared properties) to check"),
    },
  },
  async ({ animations }) => {
    const { results, summary } = evaluateAnimations(animations);
    const lines = results.map((r) => {
      const tag = r.safe ? "SAFE" : r.severity.toUpperCase();
      const why = r.issues.map((i) => i.criterion).join(", ");
      return `  ${(r.label || "animation").padEnd(20)} ${tag}${why ? "  — " + why : ""}`;
    });
    const text = `Checked ${summary.total} animation(s) — ${summary.verdict}\n` + lines.join("\n");
    return { content: [{ type: "text", text }], structuredContent: { results, summary }, isError: false };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
// stderr is safe for logs (stdout is the MCP channel)
console.error("designpowers-accessibility MCP server running on stdio");

// Pure-logic tests for readability.js. Run: node readability.test.mjs
import assert from "node:assert";
import { countSyllables, evaluateReadability } from "./readability.js";

let pass = 0, fail = 0;
const ok = (n) => { pass++; console.log("  ✓ " + n); };
const no = (n, e) => { fail++; console.log("  ✗ " + n + " — " + e.message); };
const t = (n, fn) => { try { fn(); ok(n); } catch (e) { no(n, e); } };

console.log("readability pure-logic tests");

t("syllables: simple words", () => {
  assert.equal(countSyllables("cat"), 1);
  assert.equal(countSyllables("hello"), 2);
  assert.equal(countSyllables("beautiful"), 3);
});

t("short words count as 1 syllable", () => {
  assert.equal(countSyllables("a"), 1);
  assert.equal(countSyllables("the"), 1);
});

t("plain sentence scores at/below grade 6", () => {
  const r = evaluateReadability({ text: "The cat sat on the mat. It was a warm day." });
  assert.ok(r.fleschKincaidGrade <= 6, `grade ${r.fleschKincaidGrade}`);
  assert.equal(r.meetsTarget, true);
});

t("dense academic sentence scores high and fails the grade-6 target", () => {
  const r = evaluateReadability({
    text: "The implementation necessitates comprehensive evaluation of multifaceted architectural considerations.",
  });
  assert.ok(r.fleschKincaidGrade > 6, `grade ${r.fleschKincaidGrade}`);
  assert.equal(r.meetsTarget, false);
});

t("exact counts are right", () => {
  const r = evaluateReadability({ text: "One two three. Four five." });
  assert.equal(r.wordCount, 5);
  assert.equal(r.sentenceCount, 2);
});

t("empty text is handled", () => {
  const r = evaluateReadability({ text: "" });
  assert.equal(r.wordCount, 0);
  assert.equal(r.meetsTarget, true);
});

t("custom target grade is honoured", () => {
  const r = evaluateReadability({ text: "The quick brown fox jumps over the lazy dog today.", targetGrade: 1 });
  assert.equal(r.targetGrade, 1);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

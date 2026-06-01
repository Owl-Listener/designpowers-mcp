// Pure reading-level logic — deterministic, zero-dependency, unit-testable.
//
// WCAG 3.1.5 (Reading Level) asks that text not require reading ability beyond
// lower-secondary education, or that a simpler alternative be available.
// Designpowers content typically targets ~Grade 6.
//
// This computes the **Flesch–Kincaid Grade Level** and **Flesch Reading Ease** via
// the standard formulas. Word and sentence counts are exact; the syllable count is
// a well-known *heuristic* (English spelling is irregular), so the grade is a
// reproducible STANDARD ESTIMATE — deterministic and far better than a model
// guessing "this feels grade 6," but not exact the way contrast is. We label it as
// such honestly.

/** Count syllables in a single word — standard deterministic heuristic. */
export function countSyllables(word) {
  let w = String(word).toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  // drop common silent endings
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  w = w.replace(/^y/, "");
  // Each maximal run of contiguous vowels ≈ one syllable (beau-ti-ful → 3).
  const groups = w.match(/[aeiouy]+/g);
  return groups ? groups.length : 1;
}

/** Split text into words (alphanumeric tokens). */
function words(text) {
  return (String(text).match(/[A-Za-z0-9']+/g) || []);
}

/** Count sentences: runs of terminal punctuation. At least 1 if any words exist. */
function sentenceCount(text) {
  const m = String(text).match(/[.!?]+(?:\s|$)/g);
  const n = m ? m.length : 0;
  return Math.max(n, words(text).length ? 1 : 0);
}

/**
 * Analyse text readability. Returns exact counts plus the two standard scores and
 * a pass/fail against a target grade (default 6, the Designpowers house target).
 */
export function evaluateReadability({ text, targetGrade = 6, label = "" }) {
  const wordList = words(text);
  const wordCount = wordList.length;
  const sentences = sentenceCount(text);
  const syllables = wordList.reduce((s, w) => s + countSyllables(w), 0);

  if (wordCount === 0) {
    return {
      label, wordCount: 0, sentenceCount: 0, syllableCount: 0,
      wordsPerSentence: 0, syllablesPerWord: 0,
      fleschKincaidGrade: 0, fleschReadingEase: 100,
      targetGrade, meetsTarget: true, method: "flesch-kincaid (standard estimate)",
      note: "empty text",
    };
  }

  const wps = wordCount / sentences;
  const spw = syllables / wordCount;

  // Standard formulas.
  const grade = 0.39 * wps + 11.8 * spw - 15.59;
  const ease = 206.835 - 1.015 * wps - 84.6 * spw;

  const fleschKincaidGrade = Math.round(grade * 10) / 10;
  const fleschReadingEase = Math.round(ease * 10) / 10;

  return {
    label,
    wordCount,
    sentenceCount: sentences,
    syllableCount: syllables,
    wordsPerSentence: Math.round(wps * 100) / 100,
    syllablesPerWord: Math.round(spw * 100) / 100,
    fleschKincaidGrade,
    fleschReadingEase,
    targetGrade,
    meetsTarget: fleschKincaidGrade <= targetGrade,
    method: "flesch-kincaid (standard estimate)",
  };
}

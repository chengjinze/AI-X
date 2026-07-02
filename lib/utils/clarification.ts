export interface ClarificationOption {
  question: string;
  options: string[];
  selectedIndex: number;
}

/** Parse AI message for structured options — handles XML tags, Markdown, and plain text fallback. */
export function parseClarificationOptions(content: string): {
  hasOptions: boolean;
  preamble: string;
  questions: ClarificationOption[];
} {
  // ---- Path 1: <question>/<option> XML tag format ----
  const questionMatches = Array.from(
    content.matchAll(/<question>([\s\S]*?)<\/question>/gi)
  );

  if (questionMatches.length > 0) {
    const questions: ClarificationOption[] = [];
    const firstQuestionIdx = content.indexOf("<question>");
    const preamble =
      firstQuestionIdx > 0
        ? content.slice(0, firstQuestionIdx).replace(/\[CLARIFY\]/i, "").trim()
        : "";

    for (let i = 0; i < questionMatches.length; i++) {
      const qMatch = questionMatches[i];
      const qText = qMatch[1].trim();
      const qStart = qMatch.index! + qMatch[0].length;
      const nextQIdx = content.indexOf("<question>", qStart);
      const segment = nextQIdx === -1 ? content.slice(qStart) : content.slice(qStart, nextQIdx);

      const options: string[] = [];
      const optMatches = Array.from(segment.matchAll(/<option>([\s\S]*?)<\/option>/gi));
      for (let j = 0; j < optMatches.length; j++) {
        options.push(optMatches[j][1].trim());
      }

      if (options.length > 0) {
        questions.push({ question: qText, options, selectedIndex: -1 });
      }
    }

    if (questions.length > 0) {
      return { hasOptions: true, preamble, questions };
    }
  }

  // ---- Path 2: Rich Markdown fallback ----
  const markdownQuestions = parseMarkdownOptions(content);
  if (markdownQuestions.length > 0) {
    const cleanPreamble = extractPreamble(content);
    return { hasOptions: true, preamble: cleanPreamble, questions: markdownQuestions };
  }

  // ---- Path 3: Safety net — [CLARIFY] present but no structured options ----
  // Show a free-text response card so the user can always respond.
  if (/\[CLARIFY\]/i.test(content)) {
    const preamble = content.replace(/\[CLARIFY\]/i, "").trim();
    return {
      hasOptions: true,
      preamble,
      questions: [{ question: "Your response", options: [], selectedIndex: -1 }],
    };
  }

  return { hasOptions: false, preamble: content, questions: [] };
}

/** Extract preamble text before the first structured option/question block. */
function extractPreamble(content: string): string {
  // Strip [CLARIFY] tag
  let text = content.replace(/\[CLARIFY\]/i, "");

  // Find the first structured marker and take everything before it
  const markers = [
    /\*\*[^*]+\*\*/,           // **bold text**
    /[A-D][\.\)、]\s/,         // A. or A) or A、
    /\d+[\.\)、]\s/,           // 1. or 1) or 1、
    /^[-*]\s/gm,               // - or * at start of line
  ];

  let earliestIdx = text.length;
  for (const marker of markers) {
    const m = text.match(marker);
    if (m && m.index !== undefined && m.index < earliestIdx) {
      earliestIdx = m.index;
    }
  }

  if (earliestIdx < text.length) {
    return text.slice(0, earliestIdx).trim();
  }
  return text.trim();
}

/** Parse Markdown-style options with broad pattern matching. */
function parseMarkdownOptions(content: string): ClarificationOption[] {
  // Strategy: find question headers, then scan for option groups that follow them.

  // Normalize content: strip [CLARIFY] prefix
  const cleanContent = content.replace(/^\s*\[CLARIFY\]\s*/i, "");

  // Step 1: Find question boundaries using multiple heuristics
  const questionHeaders = findQuestionHeaders(cleanContent);

  if (questionHeaders.length === 0) {
    // No clear question headers — try whole-content option scan
    return tryWholeContentScan(cleanContent);
  }

  // Step 2: For each question header, extract options until the next header
  const questions: ClarificationOption[] = [];
  for (let i = 0; i < questionHeaders.length; i++) {
    const h = questionHeaders[i];
    const nextStart = i + 1 < questionHeaders.length
      ? questionHeaders[i + 1].startIndex
      : cleanContent.length;
    const segment = cleanContent.slice(h.startIndex + h.headerText.length, nextStart);

    const options = extractOptionsFromSegment(segment);
    if (options.length >= 2) {
      questions.push({
        question: h.questionText,
        options,
        selectedIndex: -1,
      });
    }
  }

  return questions;
}

interface QuestionHeader {
  questionText: string;
  headerText: string;  // The full matched header (e.g., "**1. What?**")
  startIndex: number;
}

/** Find question headers — bold text, numbered items, or lines ending with ? or ： */
function findQuestionHeaders(content: string): QuestionHeader[] {
  const headers: QuestionHeader[] = [];

  // Pattern 1: **numbered. text?** or **text?**
  const boldPattern = /\*\*(\d+[\.\)、]\s*[^*]+\?)\*\*/g;
  let match: RegExpExecArray | null;
  while ((match = boldPattern.exec(content)) !== null) {
    headers.push({
      questionText: match[1].trim(),
      headerText: match[0],
      startIndex: match.index,
    });
  }

  // Pattern 2: **simple bold question** (ends with ? or ：)
  const boldSimple = /\*\*([^*]+[？?：:])\*\*/g;
  while ((match = boldSimple.exec(content)) !== null) {
    // Avoid duplicates from pattern 1
    if (!headers.some(h => h.startIndex === match!.index)) {
      headers.push({
        questionText: match[1].trim(),
        headerText: match[0],
        startIndex: match.index,
      });
    }
  }

  // Pattern 3: Numbered question line: "1. text?" or "1) text？"
  const numberedQ = /^(\d+[\.\)、]\s*.+[？?：:])\s*$/gm;
  while ((match = numberedQ.exec(content)) !== null) {
    if (!headers.some(h => h.startIndex === match!.index)) {
      headers.push({
        questionText: match[1].trim(),
        headerText: match[0],
        startIndex: match.index,
      });
    }
  }

  // Pattern 4: Lines ending with ? or ：that look like standalone questions
  // (not inside a paragraph — preceded by newline or start)
  const standaloneQ = /(?:^|\n\n)([^\n]+[？?：:])\s*\n/gm;
  while ((match = standaloneQ.exec(content)) !== null) {
    if (!headers.some(h => h.startIndex === match!.index)) {
      headers.push({
        questionText: match[1].trim(),
        headerText: match[0],
        startIndex: match.index,
      });
    }
  }

  // Sort by position
  headers.sort((a, b) => a.startIndex - b.startIndex);

  return headers;
}

/** Extract option strings from a text segment using multiple patterns. */
function extractOptionsFromSegment(segment: string): string[] {
  const options: string[] = [];

  // Pattern A: Lettered options with optional bold — "A. **label**：desc" or "A. plain text"
  // Groups: (letter)(. or ) or 、)(whitespace)(optional **)(label)(optional **)(optional ：desc)
  const letteredBold = /([A-D])[\.\)、]\s+\*\*([^*]+)\*\*(?:[：:]\s*(.+))?/g;
  let match: RegExpExecArray | null;
  while ((match = letteredBold.exec(segment)) !== null) {
    const desc = match[3] ? "：" + match[3] : "";
    options.push(match[2] + desc);
  }

  // If bold pattern already found options, use those (most reliable)
  if (options.length >= 2) return options;

  // Pattern B: Lettered plain options — "A. text" or "A) text" or "A、text"
  const letteredPlain = /([A-D])[\.\)、]\s+(.+)/g;
  const plainOpts: string[] = [];
  while ((match = letteredPlain.exec(segment)) !== null) {
    // Skip if already captured by bold pattern
    if (!options.some(o => o.startsWith(match![2].split("：")[0].split(":")[0]))) {
      plainOpts.push(match[2].trim());
    }
  }
  if (plainOpts.length >= 2) return plainOpts;

  // Pattern C: Numbered options — "1. text" or "1) text"
  const numbered = /^(\d+)[\.\)、]\s+(.+)$/gm;
  const numOpts: string[] = [];
  while ((match = numbered.exec(segment)) !== null) {
    numOpts.push(match[2].trim());
  }
  if (numOpts.length >= 2) return numOpts;

  // Pattern D: Dash-prefixed options — "- text" or "• text" (at line start)
  const dashed = /^[-•*]\s+(.+)$/gm;
  const dashOpts: string[] = [];
  while ((match = dashed.exec(segment)) !== null) {
    dashOpts.push(match[1].trim());
  }
  if (dashOpts.length >= 2) return dashOpts;

  // Pattern E: Option labels in format "**A**：text" (bold letter + colon)
  const boldLetter = /\*\*([A-D])\*\*\s*[：:]\s*(.+)/g;
  const boldLetterOpts: string[] = [];
  while ((match = boldLetter.exec(segment)) !== null) {
    boldLetterOpts.push(match[2].trim());
  }
  if (boldLetterOpts.length >= 2) return boldLetterOpts;

  return [];
}

/** Fallback: scan the entire content for option groups when no clear question headers found. */
function tryWholeContentScan(content: string): ClarificationOption[] {
  // Try to find option groups of 2+ items
  const allOpts = extractOptionsFromSegment(content);
  if (allOpts.length >= 2) {
    // Extract preamble: text before the first option marker
    const firstOptIdx = Math.min(
      content.search(/[A-D][\.\)、]\s/) === -1 ? Infinity : content.search(/[A-D][\.\)、]\s/),
      content.search(/\d+[\.\)、]\s/) === -1 ? Infinity : content.search(/\d+[\.\)、]\s/),
      content.search(/^[-•*]\s/gm) === -1 ? Infinity : content.search(/^[-•*]\s/gm),
    );

    const question = firstOptIdx > 0 && firstOptIdx < Infinity
      ? content.slice(0, firstOptIdx).trim()
      : "";

    if (question) {
      return [{ question, options: allOpts, selectedIndex: -1 }];
    }
  }

  return [];
}

/** Assemble user answers into a formatted response string */
export function assembleClarificationResponse(questions: ClarificationOption[]): string {
  const lines: string[] = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q.selectedIndex >= 0 && q.selectedIndex < q.options.length) {
      lines.push(q.question + "\n  → " + q.options[q.selectedIndex]);
    }
  }
  return lines.join("\n\n");
}

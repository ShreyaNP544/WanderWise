// Pull a JSON object out of model text: handles ```json fences, leading prose,
// trailing commentary, and reasoning that itself contains braces.

function balancedObjects(text) {
  const found = [];
  for (let start = text.indexOf('{'); start !== -1; start = text.indexOf('{', start + 1)) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (c === '\\') escaped = true;
        else if (c === '"') inString = false;
      } else if (c === '"') inString = true;
      else if (c === '{') depth++;
      else if (c === '}' && --depth === 0) {
        found.push(text.slice(start, i + 1));
        break;
      }
    }
  }
  return found;
}

const tidy = (s) => s.replace(/,\s*([}\]])/g, '$1'); // trailing commas are the most common slip

export function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidates = [fenced, text.trim()].filter(Boolean);
  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch {
      try {
        return JSON.parse(tidy(c));
      } catch {
        /* fall through */
      }
    }
  }
  // Largest parseable top-level object wins (the answer is bigger than any example in prose).
  const objects = balancedObjects(text).sort((a, b) => b.length - a.length);
  for (const o of objects) {
    try {
      return JSON.parse(tidy(o));
    } catch {
      /* try next */
    }
  }
  throw new Error('No valid JSON object found in model output');
}

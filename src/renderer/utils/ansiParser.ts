export interface AnsiSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  bgColor?: string;
}

export interface ParsedOutput {
  segments: AnsiSegment[];
  isToolCallStart?: boolean;
  isToolCallEnd?: boolean;
  isMessageBoundary?: boolean;
}

const COLOR_MAP: Record<number, string> = {
  30: '#000000', 31: '#cc0000', 32: '#4e9a06', 33: '#c4a000',
  34: '#3465a4', 35: '#75507b', 36: '#06989a', 37: '#d3d7cf',
  90: '#555753', 91: '#ef2929', 92: '#8ae234', 93: '#fce94f',
  94: '#729fcf', 95: '#ad7fa8', 96: '#34e2e2', 97: '#eeeeec',
};

const BG_COLOR_MAP: Record<number, string> = {
  40: '#000000', 41: '#cc0000', 42: '#4e9a06', 43: '#c4a000',
  44: '#3465a4', 45: '#75507b', 46: '#06989a', 47: '#d3d7cf',
};

// Comprehensive regex that strips ALL terminal escape sequences:
// - CSI sequences: \x1b[ ... (any letter)  — covers SGR, cursor, erase, scroll, etc.
// - OSC sequences: \x1b] ... ST  — operating system commands (title, hyperlinks, etc.)
// - DCS/PM/APC: \x1bP, \x1b^, \x1b_  — device control, privacy, app commands
// - Simple escapes: \x1b followed by single char (RIS, save/restore cursor, etc.)
// - Control chars: \x07 (BEL), \x08 (BS), \x0e, \x0f (shift in/out)
// - Carriage return based overwriting: text\r (overwrite line)
const ALL_ESCAPE_RE = new RegExp(
  [
    '\\x1b\\][^\\x07\\x1b]*(?:\\x07|\\x1b\\\\)',   // OSC ... BEL or OSC ... ST
    '\\x1b[P^_][^\\x1b]*\\x1b\\\\',                  // DCS / PM / APC ... ST
    '\\x1b\\[[0-9;?]*[A-Za-z]',                       // CSI sequences
    '\\x1b\\[[0-9;?]*[ -/]*[A-Za-z]',                 // CSI with intermediate bytes
    '\\x1b[()][A-Z0-9]',                              // charset selection
    '\\x1b[^\\[\\]()P^_]',                            // two-char escapes (e.g. \x1bM, \x1b=)
    '[\\x00-\\x06\\x08\\x0e\\x0f\\x7f]',              // control chars (keep \t \n \r for now)
    '\\x07',                                           // BEL
  ].join('|'),
  'g',
);

// Handle \r (carriage return) to simulate terminal overwrite behavior
function processCarriageReturns(input: string): string {
  return input.split('\n').map((line) => {
    if (!line.includes('\r')) return line;
    const parts = line.split('\r');
    // Each \r resets cursor to beginning, last segment wins
    let result = '';
    for (const part of parts) {
      if (part === '') continue;
      // Overwrite from the start
      const chars = Array.from(result);
      const newChars = Array.from(part);
      for (let i = 0; i < newChars.length; i++) {
        chars[i] = newChars[i];
      }
      result = chars.join('');
    }
    return result;
  }).join('\n');
}

export function stripAnsi(input: string): string {
  let clean = input.replace(ALL_ESCAPE_RE, '');
  clean = processCarriageReturns(clean);
  // Collapse excessive blank lines
  clean = clean.replace(/\n{3,}/g, '\n\n');
  return clean;
}

export function parseAnsi(input: string): ParsedOutput {
  // For rich rendering: use SGR-aware parsing
  const SGR_RE = /\x1b\[([0-9;]*)m/g;
  // First strip non-SGR escapes
  let cleaned = input.replace(
    new RegExp(
      [
        '\\x1b\\][^\\x07\\x1b]*(?:\\x07|\\x1b\\\\)',
        '\\x1b[P^_][^\\x1b]*\\x1b\\\\',
        '\\x1b\\[[0-9;?]*[A-HJ-Za-z]', // CSI but NOT 'm' (SGR)
        '\\x1b\\[[0-9;?]*[ -/]*[A-HJ-Za-z]',
        '\\x1b[()][A-Z0-9]',
        '\\x1b[^\\[\\]()P^_]',
        '[\\x00-\\x06\\x08\\x0e\\x0f\\x7f]',
        '\\x07',
      ].join('|'),
      'g',
    ),
    '',
  );
  cleaned = processCarriageReturns(cleaned);

  const segments: AnsiSegment[] = [];
  let currentStyle: Omit<AnsiSegment, 'text'> = {};
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  SGR_RE.lastIndex = 0;

  while ((match = SGR_RE.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: cleaned.slice(lastIndex, match.index), ...currentStyle });
    }
    const codes = match[1].split(';').map(Number);
    for (const code of codes) {
      if (code === 0) currentStyle = {};
      else if (code === 1) currentStyle.bold = true;
      else if (code === 3) currentStyle.italic = true;
      else if (code === 4) currentStyle.underline = true;
      else if (COLOR_MAP[code]) currentStyle.color = COLOR_MAP[code];
      else if (BG_COLOR_MAP[code]) currentStyle.bgColor = BG_COLOR_MAP[code];
    }
    lastIndex = SGR_RE.lastIndex;
  }

  if (lastIndex < cleaned.length) {
    segments.push({ text: cleaned.slice(lastIndex), ...currentStyle });
  }

  const fullText = segments.map((s) => s.text).join('');
  const isToolCallStart = /^(Running|Calling|Tool:)\s/.test(fullText.trim());
  const isToolCallEnd = /^(Done|Completed|Result:)\s/.test(fullText.trim());
  const isMessageBoundary = fullText.includes('───') || fullText.includes('━━━');

  return { segments, isToolCallStart, isToolCallEnd, isMessageBoundary };
}

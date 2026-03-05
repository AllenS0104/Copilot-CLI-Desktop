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

const ANSI_REGEX = /\x1b\[([0-9;]*)m/g;

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

export function parseAnsi(input: string): ParsedOutput {
  const segments: AnsiSegment[] = [];
  let currentStyle: Omit<AnsiSegment, 'text'> = {};
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  ANSI_REGEX.lastIndex = 0;

  while ((match = ANSI_REGEX.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: input.slice(lastIndex, match.index), ...currentStyle });
    }

    const codes = match[1].split(';').map(Number);
    for (const code of codes) {
      if (code === 0) {
        currentStyle = {};
      } else if (code === 1) {
        currentStyle.bold = true;
      } else if (code === 3) {
        currentStyle.italic = true;
      } else if (code === 4) {
        currentStyle.underline = true;
      } else if (COLOR_MAP[code]) {
        currentStyle.color = COLOR_MAP[code];
      } else if (BG_COLOR_MAP[code]) {
        currentStyle.bgColor = BG_COLOR_MAP[code];
      }
    }
    lastIndex = ANSI_REGEX.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({ text: input.slice(lastIndex), ...currentStyle });
  }

  const fullText = input.replace(ANSI_REGEX, '');
  const isToolCallStart = /^(Running|Calling|Tool:)\s/.test(fullText.trim());
  const isToolCallEnd = /^(Done|Completed|Result:)\s/.test(fullText.trim());
  const isMessageBoundary = fullText.includes('───') || fullText.includes('━━━');

  return { segments, isToolCallStart, isToolCallEnd, isMessageBoundary };
}

export function stripAnsi(input: string): string {
  return input.replace(/\x1b\[[0-9;]*m/g, '');
}

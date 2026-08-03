import { useMemo } from 'react';

/**
 * Nét ký tay giả lập cho ô "Ký, họ tên" trên phiếu. Đường ký được sinh từ chính
 * tên người ký (hash -> PRNG) nên mỗi người luôn có một nét ký cố định, không đổi
 * giữa các lần render — giống chữ ký thật của người đó trên mọi phiếu.
 */
function hashOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// PRNG mulberry32 — nhỏ gọn, đủ ngẫu nhiên cho việc vẽ nét.
function makeRandom(seed) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPath(seedText, w, h) {
  const rnd = makeRandom(hashOf(seedText || 'stockflow'));
  const strokes = 5 + Math.floor(rnd() * 3);
  const step = (w - 14) / strokes;

  let x = 7;
  let y = h * (0.5 + rnd() * 0.2);
  let d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;

  for (let i = 0; i < strokes; i++) {
    const x1 = x + step * 0.32;
    const y1 = y - h * (0.22 + rnd() * 0.34);
    const x2 = x + step * 0.68;
    const y2 = y + h * (0.08 + rnd() * 0.3);
    const nx = x + step;
    const ny = h * (0.42 + rnd() * 0.26);
    d += ` C ${x1.toFixed(1)} ${y1.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}, ${nx.toFixed(1)} ${ny.toFixed(1)}`;
    x = nx;
    y = ny;
  }

  // Nét gạch chân bay ngang bên dưới — thói quen ký của phần lớn chữ ký VN.
  d += ` M ${(w * 0.1).toFixed(1)} ${(h * 0.84).toFixed(1)} Q ${(w * 0.48).toFixed(1)} ${(h * 1.02).toFixed(1)}, ${(w * 0.92).toFixed(1)} ${(h * 0.62).toFixed(1)}`;
  return d;
}

export default function InkSignature({ name = '', width = 110, height = 38, className = '' }) {
  const d = useMemo(() => buildPath(name, width, height), [name, width, height]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
      role="img"
      aria-label={`Chữ ký ${name}`}
    >
      <path
        d={d}
        fill="none"
        stroke="#1e3a8a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}

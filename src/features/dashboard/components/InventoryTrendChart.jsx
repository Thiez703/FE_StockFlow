import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from 'antd';
import { TREND } from '@/mock/dashboard';
import { formatNumber } from '@/utils/formatCurrency';

const MAX = Math.max(...TREND.flatMap((d) => [d.inbound, d.outbound, d.stock]));
const n = TREND.length;

// Toạ độ đường "Tồn cuối kỳ" (0..100) cho SVG overlay.
const stockPoints = TREND.map((d, i) => {
  const x = ((i + 0.5) / n) * 100;
  const y = (1 - d.stock / MAX) * 100;
  return `${x},${y}`;
}).join(' ');

function LegendDot({ className, label }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-ink-sub">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} /> {label}
    </span>
  );
}

/**
 * Biểu đồ Nhập – Xuất – Tồn theo tháng (đơn vị triệu VND). Nhập/Xuất là cột nhóm,
 * Tồn cuối kỳ là đường phủ lên. Vẽ tĩnh bằng div + SVG, không dùng thư viện chart.
 * Hover vào cụm cột của 1 tháng hiện tooltip đủ 3 chỉ số, trượt mượt bằng Framer Motion.
 */
export default function InventoryTrendChart() {
  const [hoverIndex, setHoverIndex] = useState(null);
  const activeIndex = hoverIndex ?? 0;
  const active = TREND[activeIndex];

  return (
    <Card className="h-full border-hair" styles={{ body: { padding: 22 } }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="m-0 text-base font-semibold text-ink">Nhập – Xuất – Tồn</h3>
          <p className="mt-1 mb-0 text-sm text-ink-sub">Giá trị theo tháng (triệu VND)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 sm:flex">
            <LegendDot className="bg-royal" label="Nhập" />
            <LegendDot className="bg-[#93b4fb]" label="Xuất" />
            <LegendDot className="bg-amber" label="Tồn" />
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-ink-sub">6 tháng</span>
        </div>
      </div>

      <div className="relative h-56" onMouseLeave={() => setHoverIndex(null)}>
        {/* Cột Nhập / Xuất — hover cả cụm của 1 tháng */}
        {/* Bề rộng cột thu dần theo màn hình: 12 cột cố định sẽ vượt bề ngang
            máy hẹp (≤360px) và đẩy tràn cả trang. */}
        <div className="flex h-full items-end justify-between gap-1.5 border-b border-slate-100 sm:gap-3">
          {TREND.map((d, i) => (
            <div
              key={d.label}
              className="flex h-full min-w-0 flex-1 items-end justify-center gap-1 sm:gap-1.5"
              onMouseEnter={() => setHoverIndex(i)}
            >
              <div
                className={`w-2.5 rounded-t-md transition-colors min-[380px]:w-4 sm:w-6 ${
                  hoverIndex === i ? 'bg-[#5b8bfb]' : 'bg-royal'
                }`}
                style={{ height: `${(d.inbound / MAX) * 100}%` }}
              />
              <div
                className={`w-2.5 rounded-t-md transition-colors min-[380px]:w-4 sm:w-6 ${
                  hoverIndex === i ? 'bg-[#c3d7fd]' : 'bg-[#93b4fb]'
                }`}
                style={{ height: `${(d.outbound / MAX) * 100}%` }}
              />
            </div>
          ))}
        </div>

        {/* Đường Tồn cuối kỳ */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polyline
            points={stockPoints}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </svg>
        {/* Điểm mốc trên đường Tồn — to lên khi tháng đó đang hover */}
        {TREND.map((d, i) => (
          <span
            key={d.label}
            className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber transition-all ${
              hoverIndex === i ? 'h-3 w-3' : 'h-2 w-2'
            }`}
            style={{ left: `${((i + 0.5) / n) * 100}%`, top: `${(1 - d.stock / MAX) * 100}%` }}
          />
        ))}

        {/* Tooltip dùng chung, trượt mượt theo tháng đang hover */}
        <motion.div
          className="pointer-events-none absolute top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-hair bg-white px-3 py-2 text-xs shadow-lg"
          initial={false}
          animate={{
            left: `${((activeIndex + 0.5) / n) * 100}%`,
            opacity: hoverIndex !== null ? 1 : 0,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        >
          <p className="m-0 mb-1 font-semibold text-ink">{active.label}</p>
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 text-ink-sub">
              <span className="h-2 w-2 rounded-full bg-royal" /> Nhập:{' '}
              <span className="font-semibold text-ink">{formatNumber(active.inbound)} tr</span>
            </span>
            <span className="flex items-center gap-1.5 text-ink-sub">
              <span className="h-2 w-2 rounded-full bg-[#93b4fb]" /> Xuất:{' '}
              <span className="font-semibold text-ink">{formatNumber(active.outbound)} tr</span>
            </span>
            <span className="flex items-center gap-1.5 text-ink-sub">
              <span className="h-2 w-2 rounded-full bg-amber" /> Tồn:{' '}
              <span className="font-semibold text-ink">{formatNumber(active.stock)} tr</span>
            </span>
          </div>
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white" />
        </motion.div>
      </div>

      <div className="flex justify-between gap-3 pt-2">
        {TREND.map((d, i) => (
          <span
            key={d.label}
            className={`flex-1 text-center text-xs transition-colors ${
              hoverIndex === i ? 'font-semibold text-royal' : 'text-ink-sub'
            }`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </Card>
  );
}

import { useState } from 'react';
import { Card, Segmented } from 'antd';
import { TREND } from '@/mock/dashboard';

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
 */
export default function InventoryTrendChart() {
  const [range, setRange] = useState('6 tháng');

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
          <Segmented size="small" value={range} onChange={setRange} options={['6 tháng', 'Năm']} />
        </div>
      </div>

      <div className="relative h-56">
        {/* Cột Nhập / Xuất */}
        <div className="flex h-full items-end justify-between gap-3 border-b border-slate-100">
          {TREND.map((d) => (
            <div key={d.label} className="flex h-full flex-1 items-end justify-center gap-1.5">
              <div
                className="w-4 rounded-t-md bg-royal sm:w-6"
                style={{ height: `${(d.inbound / MAX) * 100}%` }}
                title={`Nhập: ${d.inbound}`}
              />
              <div
                className="w-4 rounded-t-md bg-[#93b4fb] sm:w-6"
                style={{ height: `${(d.outbound / MAX) * 100}%` }}
                title={`Xuất: ${d.outbound}`}
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
        {/* Điểm mốc trên đường Tồn */}
        {TREND.map((d, i) => (
          <span
            key={d.label}
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber"
            style={{ left: `${((i + 0.5) / n) * 100}%`, top: `${(1 - d.stock / MAX) * 100}%` }}
          />
        ))}
      </div>

      <div className="flex justify-between gap-3 pt-2">
        {TREND.map((d) => (
          <span key={d.label} className="flex-1 text-center text-xs text-ink-sub">
            {d.label}
          </span>
        ))}
      </div>
    </Card>
  );
}

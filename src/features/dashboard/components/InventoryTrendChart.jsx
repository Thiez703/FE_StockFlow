import { Card, Segmented } from 'antd';
import { useState } from 'react';

// Dữ liệu mẫu — thay bằng API sau. Mỗi phần tử: nhập (in) / xuất (out) trong ngày.
const DATA = [
  { label: 'T2', in: 120, out: 90 },
  { label: 'T3', in: 150, out: 110 },
  { label: 'T4', in: 90, out: 140 },
  { label: 'T5', in: 180, out: 120 },
  { label: 'T6', in: 210, out: 160 },
  { label: 'T7', in: 160, out: 130 },
  { label: 'CN', in: 80, out: 60 },
];

const MAX = Math.max(...DATA.flatMap((d) => [d.in, d.out]));

function Bar({ value, className }) {
  return (
    <div
      className={`w-3.5 rounded-t-md transition-all sm:w-5 ${className}`}
      style={{ height: `${(value / MAX) * 100}%` }}
      title={`${value}`}
    />
  );
}

/**
 * Biểu đồ cột nhập/xuất kho theo ngày. Tự vẽ bằng CSS (không thêm thư viện chart).
 */
export default function InventoryTrendChart() {
  const [range, setRange] = useState('Tuần này');

  return (
    <Card
      className="h-full border-slate-200/80 shadow-sm"
      styles={{ body: { padding: 22 } }}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="m-0 text-base font-semibold text-slate-900">
            Biến động nhập / xuất kho
          </h3>
          <p className="mt-1 mb-0 text-sm text-slate-500">Số lượng thùng theo ngày</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 sm:flex">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Nhập
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-300" /> Xuất
            </span>
          </div>
          <Segmented
            size="small"
            value={range}
            onChange={setRange}
            options={['Tuần này', 'Tháng này']}
          />
        </div>
      </div>

      <div className="flex h-56 items-end justify-between gap-2 border-b border-slate-100 pb-0">
        {DATA.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-full w-full items-end justify-center gap-1">
              <Bar value={d.in} className="bg-blue-600" />
              <Bar value={d.out} className="bg-sky-300" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-2 pt-2">
        {DATA.map((d) => (
          <span key={d.label} className="flex-1 text-center text-xs text-slate-400">
            {d.label}
          </span>
        ))}
      </div>
    </Card>
  );
}

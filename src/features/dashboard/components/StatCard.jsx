import { Card } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

// Bảng màu theo "tone" — dùng cho ô icon.
const TONES = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-rose-50 text-rose-600',
};

/**
 * Thẻ số liệu tổng quan cho Dashboard.
 *
 * @param {string} title
 * @param {string} value            Giá trị đã format sẵn (chuỗi).
 * @param {React.ReactNode} icon
 * @param {('blue'|'green'|'amber'|'red')} [tone]
 * @param {number} [delta]          % thay đổi; >0 tăng (xanh), <0 giảm (đỏ).
 * @param {string} [deltaLabel]
 */
export default function StatCard({ title, value, icon, tone = 'blue', delta, deltaLabel }) {
  const isUp = (delta ?? 0) >= 0;

  return (
    <Card className="h-full border-slate-200/80 shadow-sm" styles={{ body: { padding: 20 } }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 mb-0 text-[26px] font-bold leading-none tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${TONES[tone]}`}
        >
          {icon}
        </span>
      </div>

      {delta !== undefined && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold ${
              isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {Math.abs(delta)}%
          </span>
          {deltaLabel && <span className="text-slate-400">{deltaLabel}</span>}
        </div>
      )}
    </Card>
  );
}

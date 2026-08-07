import { Card } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

// Bảng màu theo "tone" cho ô icon (đồng bộ palette deep-navy/royal).
const TONES = {
  blue: 'bg-tint text-royal',
  green: 'bg-[#dcfce7] text-[#15803d]',
  amber: 'bg-[#fef3c7] text-[#b45309]',
  red: 'bg-[#fee2e2] text-[#b91c1c]',
};

// Nền + viền của cả thẻ khi cần làm nổi bật (vd 2 thẻ cảnh báo ở Tra cứu tồn).
// Không truyền `cardTone` thì thẻ giữ nguyên viền xám mặc định như trước.
const CARD_TONES = {
  amber: 'bg-amber/10 border-amber/40',
  red: 'bg-danger/10 border-danger/40',
};

/**
 * Thẻ số liệu (KPI phụ) cho Dashboard.
 *
 * @param {string} title
 * @param {string} value            Giá trị đã format sẵn.
 * @param {string} [suffix]         Hậu tố nhỏ sau giá trị (vd "mặt hàng").
 * @param {React.ReactNode} icon
 * @param {('blue'|'green'|'amber'|'red')} [tone]       Màu ô icon.
 * @param {('amber'|'red')} [cardTone]                  Màu nền/viền cả thẻ (mặc định không tô, giữ nguyên như cũ).
 * @param {boolean} [compact]                           Padding nhỏ hơn (16 thay vì 20).
 * @param {number} [delta]          % thay đổi; >0 tăng (xanh), <0 giảm (đỏ).
 * @param {string} [deltaLabel]
 * @param {string} [hint]           Dòng chú thích thay cho delta khi không có delta.
 */
export default function StatCard({
  title,
  value,
  suffix,
  icon,
  tone = 'blue',
  cardTone,
  compact = false,
  delta,
  deltaLabel,
  hint,
}) {
  const isUp = (delta ?? 0) >= 0;
  // Có cardTone thì thay hẳn viền xám mặc định bằng viền/nền theo tone đó,
  // tránh 2 class border-color cùng lúc tranh nhau ghi đè.
  const borderBgClass = cardTone ? CARD_TONES[cardTone] : 'border-hair';

  return (
    <Card className={`h-full ${borderBgClass}`} styles={{ body: { padding: compact ? 16 : 20, height: '100%' } }}>
      <div className="flex h-full flex-col justify-center">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 text-sm font-medium text-ink-sub">{title}</p>
            <p className="mt-2 mb-0 flex items-baseline gap-1 leading-none">
              <span className="text-[26px] font-bold tracking-tight text-ink">{value}</span>
              {suffix && <span className="text-sm font-medium text-ink-sub">{suffix}</span>}
            </p>
          </div>
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${TONES[tone]}`}
          >
            {icon}
          </span>
        </div>

        {delta !== undefined ? (
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold ${
                isUp ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fee2e2] text-[#b91c1c]'
              }`}
            >
              {isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {Math.abs(delta)}%
            </span>
            {deltaLabel && <span className="text-ink-sub">{deltaLabel}</span>}
          </div>
        ) : (
          hint && <p className="mt-4 mb-0 text-xs text-ink-sub">{hint}</p>
        )}
      </div>
    </Card>
  );
}

import { Card, Progress, Button } from 'antd';
import { AlertOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { LOW_STOCK, NEAR_EXPIRY } from '@/mock/alerts';
import { daysUntil } from '@/utils/date';

/**
 * Panel "Cảnh báo" trên Dashboard: gộp Tồn dưới định mức + Hàng cận hạn (rút gọn).
 * Xem đầy đủ tại trang /alerts.
 */
export default function AlertsPanel() {
  const navigate = useNavigate();

  return (
    <Card className="h-full border-hair" styles={{ body: { padding: 22 } }}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="m-0 flex items-center gap-2 text-base font-semibold text-ink">
          <AlertOutlined className="text-amber" /> Cảnh báo
        </h3>
        <Button type="link" className="!px-0" onClick={() => navigate('/alerts')}>
          Xem tất cả <RightOutlined className="text-[10px]" />
        </Button>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-ink-sub">
          Tồn dưới định mức
        </p>
        <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-xs font-semibold text-[#b45309]">
          {LOW_STOCK.length} mặt hàng
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {LOW_STOCK.slice(0, 3).map((item) => {
          const percent = Math.min(100, Math.round((item.onHand / item.minStock) * 100));
          const out = item.onHand === 0;
          return (
            <li key={item.sku}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-ink">{item.productName}</span>
                <span className="shrink-0 text-xs font-semibold text-ink-sub">
                  {item.onHand}/{item.minStock}
                </span>
              </div>
              <Progress
                percent={percent}
                showInfo={false}
                size="small"
                strokeColor={out ? '#dc2626' : percent < 50 ? '#f59e0b' : '#1e5af0'}
                className="!mb-0"
              />
            </li>
          );
        })}
      </ul>

      <div className="mb-2 mt-5 flex items-center justify-between">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-ink-sub">
          Hàng cận hạn
        </p>
        <span className="rounded-full bg-[#fee2e2] px-2 py-0.5 text-xs font-semibold text-[#b91c1c]">
          {NEAR_EXPIRY.length} lô
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {NEAR_EXPIRY.slice(0, 3).map((item) => {
          const d = daysUntil(item.expDate);
          const overdue = d < 0;
          return (
            <li key={item.lot} className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-ink">{item.productName}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  overdue
                    ? 'bg-[#fee2e2] text-[#b91c1c]'
                    : d <= 14
                      ? 'bg-[#fef3c7] text-[#b45309]'
                      : 'bg-tint text-royal'
                }`}
              >
                {overdue ? 'Quá hạn' : `Còn ${d} ngày`}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

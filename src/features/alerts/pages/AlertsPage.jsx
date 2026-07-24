import { Card, Progress, Tag } from 'antd';
import { WarningFilled, FieldTimeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import TableEmptyState from '@/components/ui/TableEmptyState';
import { StaggerList, StaggerItem } from '@/components/ui/StaggerList';
import { LOW_STOCK, NEAR_EXPIRY } from '@/mock/alerts';
import { daysUntil, formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/formatCurrency';

export default function AlertsPage() {
  const navigate = useNavigate();

  // Ưu tiên mặt hàng nghiêm trọng nhất lên đầu (hết hàng / % tồn so với định mức thấp nhất).
  const sortedLowStock = [...LOW_STOCK].sort((a, b) => a.onHand / a.minStock - b.onHand / b.minStock);
  const sortedExpiry = [...NEAR_EXPIRY].sort((a, b) => daysUntil(a.expDate) - daysUntil(b.expDate));

  const goToInventory = (query) => navigate(`/inventory?q=${encodeURIComponent(query)}`);

  return (
    <>
      <PageHeader
        title="Cảnh báo"
        subtitle="Hàng tồn dưới định mức và hàng cận hạn cần xử lý"
        breadcrumb={[{ title: 'Tồn kho & Báo cáo' }, { title: 'Cảnh báo' }]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Tồn dưới định mức */}
        <Card className="border-hair" styles={{ body: { padding: 20 } }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="m-0 flex items-center gap-2 text-base font-semibold text-ink">
              <WarningFilled className="text-amber" /> Tồn dưới định mức
            </h3>
            <Tag bordered={false} color="warning" className="font-semibold">
              {LOW_STOCK.length} mặt hàng
            </Tag>
          </div>

          {sortedLowStock.length === 0 ? (
            <TableEmptyState message="Không có sản phẩm nào dưới định mức tồn" />
          ) : (
            <StaggerList className="m-0 flex list-none flex-col gap-4 p-0">
              {sortedLowStock.map((item) => {
                const percent = Math.min(100, Math.round((item.onHand / item.minStock) * 100));
                const out = item.onHand === 0;
                return (
                  <StaggerItem
                    key={item.sku}
                    onClick={() => goToInventory(item.sku)}
                    className="cursor-pointer rounded-xl border border-hair p-3 transition-colors hover:border-royal/40 hover:bg-tint/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-ink">{item.productName}</div>
                        <div className="mono text-xs text-ink-sub">{item.sku} · {item.location}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`mono text-sm font-bold ${out ? 'text-[#b91c1c]' : 'text-ink'}`}>
                          {formatNumber(item.onHand)}
                        </span>
                        <span className="mono text-xs text-ink-sub"> / {formatNumber(item.minStock)} {item.unit}</span>
                      </div>
                    </div>
                    <Progress
                      percent={percent}
                      size="small"
                      className="!mb-0 !mt-1"
                      strokeColor={out ? '#dc2626' : percent < 50 ? '#f59e0b' : '#1e5af0'}
                    />
                  </StaggerItem>
                );
              })}
            </StaggerList>
          )}
        </Card>

        {/* Hàng cận hạn */}
        <Card className="border-hair" styles={{ body: { padding: 20 } }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="m-0 flex items-center gap-2 text-base font-semibold text-ink">
              <FieldTimeOutlined className="text-[#dc2626]" /> Hàng cận hạn
            </h3>
            <Tag bordered={false} color="error" className="font-semibold">
              {NEAR_EXPIRY.length} lô
            </Tag>
          </div>

          {sortedExpiry.length === 0 ? (
            <TableEmptyState message="Không có lô hàng nào cận hạn" />
          ) : (
            <StaggerList className="m-0 flex list-none flex-col gap-3 p-0">
              {sortedExpiry.map((item) => {
                const d = daysUntil(item.expDate);
                const overdue = d < 0;
                return (
                  <StaggerItem
                    key={item.lot}
                    onClick={() => goToInventory(item.lot)}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-hair p-3 transition-colors hover:border-royal/40 hover:bg-tint/40"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink">{item.productName}</div>
                      <div className="mono text-xs text-ink-sub">
                        {item.lot} · HSD {formatDate(item.expDate)} · {formatNumber(item.quantity)} {item.unit}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        overdue
                          ? 'bg-[#fee2e2] text-[#b91c1c]'
                          : d <= 14
                            ? 'bg-[#fef3c7] text-[#b45309]'
                            : 'bg-tint text-royal'
                      }`}
                    >
                      {overdue ? `Quá hạn ${Math.abs(d)}n` : `Còn ${d} ngày`}
                    </span>
                  </StaggerItem>
                );
              })}
            </StaggerList>
          )}
        </Card>
      </div>
    </>
  );
}

import { Card, Progress, Button, Spin } from 'antd';
import { AlertOutlined, RightOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { alertApi } from '@/api/alerts';

const FETCH_PARAMS = { page: 0, size: 200 };

/**
 * Panel "Cảnh báo" trên Dashboard: gộp Tồn dưới định mức + Hàng cận hạn (rút gọn).
 * Xem đầy đủ tại trang /alerts.
 */
export default function AlertsPanel() {
  const navigate = useNavigate();
  const expirySoonDays = useSelector((state) => state.settings.expirySoonDays);

  const { data: lowPage, isLoading: loadingLow } = useQuery({
    queryKey: ['alerts', 'low-stock', 'preview'],
    queryFn: () => alertApi.getLowStock(FETCH_PARAMS),
  });
  const { data: outPage, isLoading: loadingOut } = useQuery({
    queryKey: ['alerts', 'out-of-stock', 'preview'],
    queryFn: () => alertApi.getOutOfStock(FETCH_PARAMS),
  });
  const { data: riskPage, isLoading: loadingRisk } = useQuery({
    queryKey: ['alerts', 'sell-through-risk', 'preview'],
    queryFn: () => alertApi.getSellThroughRisk(FETCH_PARAMS),
  });

  const lowItems = lowPage?.content ?? [];
  const outItems = outPage?.content ?? [];
  const stockItems = [...outItems, ...lowItems].slice(0, 3);
  const stockTotal = (lowPage?.totalElements ?? 0) + (outPage?.totalElements ?? 0);

  const riskItemsAll = riskPage?.content ?? [];
  const validRiskItems = riskItemsAll.filter(item => (item.daysUntilExpiry ?? 0) <= expirySoonDays);
  validRiskItems.sort((a, b) => (a.daysUntilExpiry ?? 0) - (b.daysUntilExpiry ?? 0));
  
  const riskItems = validRiskItems.slice(0, 3);
  const riskTotal = validRiskItems.length;

  const isLoading = loadingLow || loadingOut || loadingRisk;

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

      {isLoading ? (
        <div className="flex justify-center py-8"><Spin /></div>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between">
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-ink-sub">
              Tồn dưới định mức
            </p>
            <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-xs font-semibold text-[#b45309]">
              {stockTotal} mặt hàng
            </span>
          </div>
          {stockItems.length === 0 ? (
            <p className="my-3 text-center text-sm text-ink-sub">Không có cảnh báo tồn kho</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {stockItems.map((item) => {
                const out = item.currentStock === 0 || item.currentStock == null;
                const threshold = item.threshold ?? 0;
                const onHand = item.currentStock ?? 0;
                const percent = threshold > 0 ? Math.min(100, Math.round((onHand / threshold) * 100)) : 0;
                return (
                  <li key={item.productId}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-ink">{item.productName}</span>
                      <span className="shrink-0 text-xs font-semibold text-ink-sub">
                        {out ? 'Hết hàng' : `${onHand}/${threshold}`}
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
          )}

          <div className="mb-2 mt-5 flex items-center justify-between">
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-ink-sub">
              Hàng cận hạn
            </p>
            <span className="rounded-full bg-[#fee2e2] px-2 py-0.5 text-xs font-semibold text-[#b91c1c]">
              {riskTotal} lô
            </span>
          </div>
          {riskItems.length === 0 ? (
            <p className="my-3 text-center text-sm text-ink-sub">Không có lô hàng cận hạn</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {riskItems.map((item) => {
                const d = item.daysUntilExpiry ?? 0;
                const overdue = d < 0;
                return (
                  <li key={item.lotId} className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink">{item.productName}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        overdue
                          ? 'bg-[#fee2e2] text-[#b91c1c]'
                          : d <= expirySoonDays
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
          )}
        </>
      )}
    </Card>
  );
}

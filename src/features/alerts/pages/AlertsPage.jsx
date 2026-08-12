import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Progress, Button, Spin } from 'antd';
import { WarningFilled, StopOutlined, ClockCircleOutlined, FieldTimeOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import TableEmptyState from '@/components/ui/TableEmptyState';
import AccessDenied from '@/components/feedback/AccessDenied';
import { usePermissions } from '@/hooks/usePermissions';
import { useIsMobile } from '@/hooks/useIsMobile';
import { alertApi } from '@/api/alerts';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { daysUntil, formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/formatCurrency';

const TIER = { OUT_OF_STOCK: 0, OVERDUE: 1, EXPIRING_SOON: 2, LOW_STOCK: 3, EXPIRING_LATER: 4 };
const EXPIRY_SOON_DAYS = 14;
const BIG_PAGE = { page: 0, size: 200 };

const TIER_META = {
  [TIER.OUT_OF_STOCK]: { icon: StopOutlined, tone: 'bg-danger/10 text-danger', hex: '#dc2626' },
  [TIER.OVERDUE]: { icon: ClockCircleOutlined, tone: 'bg-danger/10 text-danger', hex: '#dc2626' },
  [TIER.EXPIRING_SOON]: { icon: FieldTimeOutlined, tone: 'bg-amber/10 text-amber', hex: '#f59e0b' },
  [TIER.LOW_STOCK]: { icon: WarningFilled, tone: 'bg-amber/10 text-amber', hex: '#f59e0b' },
  [TIER.EXPIRING_LATER]: { icon: CalendarOutlined, tone: 'bg-royal/10 text-royal', hex: '#1e5af0' },
};

const GROUPS = [
  {
    key: 'critical',
    label: 'Khẩn cấp',
    subtitle: 'Cần xử lý ngay trong hôm nay',
    tiers: [TIER.OUT_OF_STOCK, TIER.OVERDUE],
    dot: 'bg-danger',
    color: '#dc2626',
    icon: StopOutlined,
    headerTone: 'bg-danger/5',
    iconTone: 'bg-danger/10 text-danger',
  },
  {
    key: 'attention',
    label: 'Cần chú ý',
    subtitle: 'Nên xử lý trong tuần này',
    tiers: [TIER.EXPIRING_SOON, TIER.LOW_STOCK],
    dot: 'bg-amber',
    color: '#f59e0b',
    icon: WarningFilled,
    headerTone: 'bg-amber/5',
    iconTone: 'bg-amber/10 text-amber',
  },
  {
    key: 'watch',
    label: 'Theo dõi thêm',
    subtitle: 'Chưa gấp, cập nhật định kỳ',
    tiers: [TIER.EXPIRING_LATER],
    dot: 'bg-royal',
    color: '#3b74f5',
    icon: CalendarOutlined,
    headerTone: 'bg-royal/5',
    iconTone: 'bg-royal/10 text-royal',
  },
];

function groupAggregate(items) {
  return {
    stockDeficit: items.filter((a) => a.kind === 'stock').reduce((s, a) => s + a.deficit, 0),
    expiryQty: items.filter((a) => a.kind === 'expiry').reduce((s, a) => s + a.quantity, 0),
  };
}

function buildColumns(goToInventory) {
  return [
    {
      title: 'Sản phẩm',
      dataIndex: 'title',
      render: (_, a) => {
        const meta = TIER_META[a.tier];
        const Icon = meta.icon;
        return (
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${meta.tone}`}>
              <Icon />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink">{a.title}</div>
              <div className="mono mt-0.5 truncate text-xs text-ink-sub">{a.meta}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'badge',
      align: 'center',
      width: 150,
      render: (badge, a) => (
        <span className={`inline-block w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${TIER_META[a.tier].tone}`}>{badge}</span>
      ),
    },
    {
      title: 'Mức độ',
      key: 'progress',
      width: 260,
      render: (_, a) => {
        const meta = TIER_META[a.tier];
        if (a.kind === 'stock') {
          return (
            <div>
              <div className="flex items-center gap-2">
                <Progress percent={a.percent} size="small" showInfo={false} className="!mb-0 !flex-1" strokeColor={meta.hex} />
                <span className="mono shrink-0 text-xs text-ink-sub">
                  {formatNumber(a.onHand)}/{formatNumber(a.minStock)} {a.unit}
                </span>
              </div>
              {a.deficit > 0 && (
                <div className="mt-1 text-xs text-ink-sub">
                  Cần bổ sung <span className="font-semibold" style={{ color: meta.hex }}>{formatNumber(a.deficit)} {a.unit}</span>
                </div>
              )}
            </div>
          );
        }
        return (
          <div>
            <div className="flex items-center justify-between text-xs text-ink-sub">
              <span>HSD {formatDate(a.expDate)}</span>
              <span className="mono">{formatNumber(a.quantity)} {a.unit}</span>
            </div>
            <Progress percent={a.urgencyPercent} size="small" showInfo={false} className="!mb-0 !mt-1.5" strokeColor={meta.hex} />
          </div>
        );
      },
    },
    {
      title: '',
      key: 'action',
      align: 'right',
      width: 100,
      render: (_, a) => (
        <Button size="small" onClick={() => goToInventory(a.query)}>
          Xem tồn
        </Button>
      ),
    },
  ];
}

function AlertCard({ alert: a, goToInventory }) {
  const meta = TIER_META[a.tier];
  const Icon = meta.icon;
  return (
    <div className="rounded-xl border border-hair bg-white p-3">
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${meta.tone}`}>
          <Icon />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink">{a.title}</div>
          <div className="mono mt-0.5 text-xs text-ink-sub">{a.meta}</div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>{a.badge}</span>
      </div>
      <div className="mt-2.5">
        {a.kind === 'stock' ? (
          <>
            <div className="flex items-center gap-2">
              <Progress percent={a.percent} size="small" showInfo={false} className="!mb-0 !flex-1" strokeColor={meta.hex} />
              <span className="mono shrink-0 text-xs text-ink-sub">
                {formatNumber(a.onHand)}/{formatNumber(a.minStock)}
              </span>
            </div>
            {a.deficit > 0 && (
              <div className="mt-1 text-xs text-ink-sub">
                Cần bổ sung <span className="font-semibold" style={{ color: meta.hex }}>{formatNumber(a.deficit)} {a.unit}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between text-xs text-ink-sub">
            <span>HSD {formatDate(a.expDate)}</span>
            <span className="mono">{formatNumber(a.quantity)} {a.unit}</span>
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-end">
        <Button size="small" onClick={() => goToInventory(a.query)}>Xem tồn</Button>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const navigate = useNavigate();
  const { canViewInventory } = usePermissions();
  const isMobile = useIsMobile();

  const { data: lowStockPage, isLoading: loadingLow, isError: errLow, error: errLowObj } = useQuery({
    queryKey: ['alerts', 'low-stock'],
    queryFn: () => alertApi.getLowStock(BIG_PAGE),
  });
  const { data: outOfStockPage, isLoading: loadingOut, isError: errOut, error: errOutObj } = useQuery({
    queryKey: ['alerts', 'out-of-stock'],
    queryFn: () => alertApi.getOutOfStock(BIG_PAGE),
  });
  const { data: sellRiskPage, isLoading: loadingRisk, isError: errRisk, error: errRiskObj } = useQuery({
    queryKey: ['alerts', 'sell-through-risk'],
    queryFn: () => alertApi.getSellThroughRisk(BIG_PAGE),
  });

  const isLoading = loadingLow || loadingOut || loadingRisk;
  const isError = errLow || errOut || errRisk;
  const errorMsg = getErrorMessage(errLowObj || errOutObj || errRiskObj);

  const alerts = useMemo(() => {
    const lowStockItems = (lowStockPage?.content ?? []).map((item) => {
      const percent = item.threshold > 0 ? Math.min(100, Math.round((item.currentStock / item.threshold) * 100)) : 100;
      return {
        id: `low-${item.productId}`,
        kind: 'stock',
        tier: TIER.LOW_STOCK,
        sortValue: item.threshold > 0 ? item.currentStock / item.threshold : 1,
        title: item.productName,
        meta: `${item.productCode} · Ngưỡng: ${item.threshold}`,
        badge: 'Dưới định mức',
        percent,
        onHand: item.currentStock,
        minStock: item.threshold,
        deficit: Math.max(0, item.threshold - item.currentStock),
        unit: item.unit ?? '',
        query: item.productCode,
      };
    });

    const outOfStockItems = (outOfStockPage?.content ?? []).map((item) => ({
      id: `out-${item.productId}`,
      kind: 'stock',
      tier: TIER.OUT_OF_STOCK,
      sortValue: 0,
      title: item.productName,
      meta: item.productCode,
      badge: 'Hết hàng',
      percent: 0,
      onHand: 0,
      minStock: 0,
      deficit: 0,
      unit: item.unit ?? '',
      query: item.productCode,
    }));

    const expiryAlerts = (sellRiskPage?.content ?? []).map((item) => {
      const d = item.daysUntilExpiry ?? daysUntil(item.expDate);
      const overdue = d < 0;
      const soon = !overdue && d <= EXPIRY_SOON_DAYS;
      const urgencyPercent = overdue ? 100 : Math.max(0, Math.min(100, Math.round((1 - d / 30) * 100)));
      return {
        id: `expiry-${item.lotId}`,
        kind: 'expiry',
        tier: overdue ? TIER.OVERDUE : soon ? TIER.EXPIRING_SOON : TIER.EXPIRING_LATER,
        sortValue: d,
        title: item.productName,
        meta: `${item.lotCode} · ${formatNumber(item.currentStock)} ${item.unit ?? ''}`.trim(),
        badge: overdue ? `Quá hạn ${Math.abs(d)}n` : `Còn ${d} ngày`,
        expDate: item.expDate,
        quantity: item.currentStock,
        unit: item.unit ?? '',
        urgencyPercent,
        query: item.lotCode ?? item.productCode,
      };
    });

    return [...outOfStockItems, ...lowStockItems, ...expiryAlerts].sort((a, b) => a.tier - b.tier || a.sortValue - b.sortValue);
  }, [lowStockPage, outOfStockPage, sellRiskPage]);

  const summary = useMemo(
    () => GROUPS.map((group) => ({ ...group, count: alerts.filter((a) => group.tiers.includes(a.tier)).length })),
    [alerts],
  );

  const goToInventory = (query) => navigate(`/inventory?q=${encodeURIComponent(query)}`);
  const columns = buildColumns(goToInventory);

  if (!canViewInventory) return <AccessDenied />;

  return (
    <>
      <PageHeader
        title="Cảnh báo"
        subtitle="Hàng tồn dưới định mức và hàng cận hạn cần xử lý"
        breadcrumb={[{ title: 'Tồn kho & Báo cáo' }, { title: 'Cảnh báo' }]}
      />

      {isError && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message="Không tải được dữ liệu cảnh báo"
          description={errorMsg}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Hero tổng quan */}
          <div className="relative mb-4 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0A1E3F_0%,#12356B_60%,#1E3A8A_100%)] p-4 md:p-6 text-white">
            <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-royal-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber/20 blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-4 md:gap-6">
              <div>
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#a9c1ee]">
                  <WarningFilled /> Cảnh báo cần xử lý
                </div>
                <span className="shelf-line mt-2 block" />
                <div className="mt-3 text-[28px] md:text-[34px] font-bold leading-none tracking-tight">{alerts.length} mặt hàng</div>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3 md:border-l md:border-white/10 md:pl-6">
                {summary.map((s) => (
                  <div key={s.key} className="flex min-w-0 flex-1 md:flex-none md:min-w-[132px] items-center gap-2 md:gap-2.5 rounded-xl border border-white/10 bg-white/10 px-3 md:px-4 py-2.5 md:py-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <div>
                      <div className="text-lg md:text-xl font-bold leading-none">{s.count}</div>
                      <div className="mt-0.5 md:mt-1 text-[11px] md:text-xs text-[#a9c1ee]">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3 khối theo mức độ */}
          {alerts.length === 0 ? (
            <div className="rounded-2xl border border-hair bg-surface p-5">
              <TableEmptyState message="Không có cảnh báo nào cần xử lý" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {GROUPS.map((group) => {
                const items = alerts.filter((a) => group.tiers.includes(a.tier));
                const agg = groupAggregate(items);
                const GroupIcon = group.icon;
                return (
                  <div key={group.key} className="overflow-hidden rounded-2xl border border-hair bg-surface">
                    <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-hair px-5 py-4 ${group.headerTone}`}>
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${group.iconTone}`}>
                          <GroupIcon />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="m-0 text-sm font-semibold text-ink">{group.label}</h4>
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-ink-sub shadow-sm">{items.length}</span>
                          </div>
                          <div className="mt-0.5 text-xs text-ink-sub">{group.subtitle}</div>
                        </div>
                      </div>

                      {(agg.stockDeficit > 0 || agg.expiryQty > 0) && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-sub">
                          {agg.stockDeficit > 0 && (
                            <span>
                              Thiếu <span className="font-semibold text-ink">{formatNumber(agg.stockDeficit)}</span> đơn vị
                            </span>
                          )}
                          {agg.expiryQty > 0 && (
                            <span>
                              Tồn trong lô cận hạn <span className="font-semibold text-ink">{formatNumber(agg.expiryQty)}</span> đơn vị
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-3 md:p-4">
                      {isMobile ? (
                        items.length === 0 ? (
                          <TableEmptyState message="Không có cảnh báo ở mức này" />
                        ) : (
                          <div className="flex flex-col gap-2">
                            {items.map((a) => (
                              <AlertCard key={a.id} alert={a} goToInventory={goToInventory} />
                            ))}
                          </div>
                        )
                      ) : (
                        <DataTable
                          columns={columns}
                          dataSource={items}
                          pagination={false}
                          locale={{ emptyText: <TableEmptyState message="Không có cảnh báo ở mức này" /> }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}

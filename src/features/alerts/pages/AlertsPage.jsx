import { useMemo } from 'react';
import { Progress, Button } from 'antd';
import { WarningFilled, StopOutlined, ClockCircleOutlined, FieldTimeOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import TableEmptyState from '@/components/ui/TableEmptyState';
import { StaggerList, StaggerItem } from '@/components/ui/StaggerList';
import { LOW_STOCK, NEAR_EXPIRY } from '@/mock/alerts';
import { daysUntil, formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/formatCurrency';

// Mức độ nghiêm trọng dùng để xếp hạng chung 2 loại cảnh báo trong 1 feed duy nhất —
// số càng nhỏ càng khẩn cấp, hiện lên đầu danh sách.
const TIER = { OUT_OF_STOCK: 0, OVERDUE: 1, EXPIRING_SOON: 2, LOW_STOCK: 3, EXPIRING_LATER: 4 };
const EXPIRY_SOON_DAYS = 14;

// Icon + màu riêng cho từng mức độ — dùng token màu chung của theme (danger/amber/royal
// ở index.css) để tô nền/viền/badge, tránh lặp lại inline style rải rác.
const TIER_META = {
  [TIER.OUT_OF_STOCK]: { icon: StopOutlined, tone: 'bg-danger/10 text-danger', row: 'bg-danger/5', bar: 'bg-danger', hex: '#dc2626' },
  [TIER.OVERDUE]: { icon: ClockCircleOutlined, tone: 'bg-danger/10 text-danger', row: 'bg-danger/5', bar: 'bg-danger', hex: '#dc2626' },
  [TIER.EXPIRING_SOON]: { icon: FieldTimeOutlined, tone: 'bg-amber/10 text-amber', row: 'bg-amber/5', bar: 'bg-amber', hex: '#f59e0b' },
  [TIER.LOW_STOCK]: { icon: WarningFilled, tone: 'bg-amber/10 text-amber', row: 'bg-amber/5', bar: 'bg-amber', hex: '#f59e0b' },
  [TIER.EXPIRING_LATER]: { icon: CalendarOutlined, tone: 'bg-royal/10 text-royal', row: 'bg-royal/5', bar: 'bg-royal', hex: '#1e5af0' },
};

// Gộp 5 mức độ thành 3 nhóm hiển thị theo khối riêng — mỗi khối là 1 panel có khung
// + thanh tiêu đề tô màu riêng (kiểu bảng điều khiển kho: khu vực khẩn cấp / cần chú ý /
// theo dõi), dùng chung cho CẢ hero tổng quan lẫn 3 khối bên dưới để khớp logic.
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

// Tổng số lượng liên quan trong 1 khối — dùng cho chỉ số phụ trên thanh tiêu đề
// (đơn vị cần bổ sung / đơn vị nằm trong lô cận hạn), giúp panel có trọng lượng
// số liệu thay vì chỉ đếm số dòng.
function groupAggregate(items) {
  return {
    stockDeficit: items.filter((a) => a.kind === 'stock').reduce((s, a) => s + a.deficit, 0),
    expiryQty: items.filter((a) => a.kind === 'expiry').reduce((s, a) => s + a.quantity, 0),
  };
}

export default function AlertsPage() {
  const navigate = useNavigate();

  const alerts = useMemo(() => {
    const stockAlerts = LOW_STOCK.map((item) => {
      const out = item.onHand === 0;
      const percent = item.minStock > 0 ? Math.min(100, Math.round((item.onHand / item.minStock) * 100)) : 100;
      return {
        id: `stock-${item.sku}`,
        kind: 'stock',
        tier: out ? TIER.OUT_OF_STOCK : TIER.LOW_STOCK,
        sortValue: item.onHand / item.minStock,
        title: item.productName,
        meta: `${item.sku} · ${item.location}`,
        badge: out ? 'Hết hàng' : 'Dưới định mức',
        percent,
        onHand: item.onHand,
        minStock: item.minStock,
        deficit: Math.max(0, item.minStock - item.onHand),
        unit: item.unit,
        query: item.sku,
      };
    });

    const expiryAlerts = NEAR_EXPIRY.map((item) => {
      const d = daysUntil(item.expDate);
      const overdue = d < 0;
      const soon = !overdue && d <= EXPIRY_SOON_DAYS;
      // Mức độ khẩn cấp theo thời gian, quy về thang 30 ngày để vẽ thanh tiến độ
      // song song với cảnh báo tồn — càng gần/quá hạn thanh càng đầy.
      const urgencyPercent = overdue ? 100 : Math.max(0, Math.min(100, Math.round((1 - d / 30) * 100)));
      return {
        id: `expiry-${item.lot}`,
        kind: 'expiry',
        tier: overdue ? TIER.OVERDUE : soon ? TIER.EXPIRING_SOON : TIER.EXPIRING_LATER,
        sortValue: d,
        title: item.productName,
        meta: `${item.lot} · ${formatNumber(item.quantity)} ${item.unit}`,
        badge: overdue ? `Quá hạn ${Math.abs(d)}n` : `Còn ${d} ngày`,
        expDate: item.expDate,
        quantity: item.quantity,
        unit: item.unit,
        urgencyPercent,
        query: item.lot,
      };
    });

    return [...stockAlerts, ...expiryAlerts].sort((a, b) => a.tier - b.tier || a.sortValue - b.sortValue);
  }, []);

  // Đúng 3 mục, khớp 1-1 với 3 khối GROUPS bên dưới — trước đây hero chia riêng
  // 4 mục (tách Hết hàng/Quá hạn/Dưới định mức/Cận hạn) không khớp với 3 khối nội
  // dung, gây lệch logic giữa phần tóm tắt và phần chi tiết.
  const summary = useMemo(
    () => GROUPS.map((group) => ({ ...group, count: alerts.filter((a) => group.tiers.includes(a.tier)).length })),
    [alerts],
  );

  const goToInventory = (query) => navigate(`/inventory?q=${encodeURIComponent(query)}`);

  return (
    <>
      <PageHeader
        title="Cảnh báo"
        subtitle="Hàng tồn dưới định mức và hàng cận hạn cần xử lý"
        breadcrumb={[{ title: 'Tồn kho & Báo cáo' }, { title: 'Cảnh báo' }]}
      />

      {/* Hero tổng quan — gộp số liệu cả 2 loại cảnh báo theo mức độ nghiêm trọng */}
      <div className="relative mb-4 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0A1E3F_0%,#12356B_60%,#1E3A8A_100%)] p-6 text-white">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-royal-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber/20 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[13px] font-medium text-[#a9c1ee]">
              <WarningFilled /> Cảnh báo cần xử lý
            </div>
            <span className="shelf-line mt-2 block" />
            <div className="mt-3 text-[34px] font-bold leading-none tracking-tight">{alerts.length} mặt hàng</div>
          </div>
          <div className="flex flex-wrap gap-3 border-l border-white/10 pl-6">
            {summary.map((s) => (
              <div key={s.key} className="flex min-w-[132px] items-center gap-2.5 rounded-xl border border-white/10 bg-white/10 px-4 py-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <div>
                  <div className="text-xl font-bold leading-none">{s.count}</div>
                  <div className="mt-1 text-xs text-[#a9c1ee]">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 khối theo mức độ, mỗi khối là 1 panel riêng biệt kiểu khu vực trên bảng điều
          khiển kho: khung viền + thanh tiêu đề tô màu + chỉ số tổng hợp. Lưới thẻ bên
          trong dùng flexbox (không phải CSS grid) với chiều rộng cố định theo %, kèm
          `justify-center`: mỗi HÀNG tự chia đều theo đúng số thẻ rơi vào hàng đó, và
          hàng cuối bị lẻ (dư 1-2 thẻ so với số cột) sẽ được CĂN GIỮA thay vì dạt trái để
          trống — luôn đều/vừa vặn bất kể số lượng cảnh báo trong khối là bao nhiêu. */}
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

                <div className="p-4">
                  {items.length === 0 ? (
                    <p className="m-0 py-6 text-center text-xs text-ink-sub">Không có cảnh báo ở mức này</p>
                  ) : (
                    <StaggerList className="m-0 flex list-none flex-wrap justify-center gap-3 p-0">
                      {items.map((a) => {
                        const meta = TIER_META[a.tier];
                        const Icon = meta.icon;
                        return (
                          <StaggerItem
                            key={a.id}
                            className={`group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-xl border border-hair p-4 transition-colors hover:border-royal/30 sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)] ${meta.row}`}
                          >
                            <span className={`absolute inset-y-0 left-0 w-1 ${meta.bar}`} />

                            <div className="min-w-0">
                              <div className="flex items-center gap-3">
                                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${meta.tone}`}>
                                  <Icon />
                                </span>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-ink">{a.title}</div>
                                  <div className="mono mt-0.5 truncate text-xs text-ink-sub">{a.meta}</div>
                                </div>
                              </div>

                              <span className={`mt-3 inline-block w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${meta.tone}`}>
                                {a.badge}
                              </span>

                              {a.kind === 'stock' ? (
                                <>
                                  <div className="mt-3 flex items-center gap-2">
                                    <Progress percent={a.percent} size="small" showInfo={false} className="!mb-0 !flex-1" strokeColor={meta.hex} />
                                    <span className="mono shrink-0 text-xs text-ink-sub">
                                      {formatNumber(a.onHand)}/{formatNumber(a.minStock)} {a.unit}
                                    </span>
                                  </div>
                                  {a.deficit > 0 && (
                                    <div className="mt-1.5 text-xs text-ink-sub">
                                      Cần bổ sung <span className="font-semibold" style={{ color: meta.hex }}>{formatNumber(a.deficit)} {a.unit}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="mt-3 flex items-center justify-between text-xs text-ink-sub">
                                    <span>HSD {formatDate(a.expDate)}</span>
                                    <span className="mono">{formatNumber(a.quantity)} {a.unit}</span>
                                  </div>
                                  <Progress percent={a.urgencyPercent} size="small" showInfo={false} className="!mb-0 !mt-1.5" strokeColor={meta.hex} />
                                </>
                              )}
                            </div>

                            <Button
                              size="small"
                              type="text"
                              className="mt-3 w-fit self-end opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() => goToInventory(a.query)}
                            >
                              Xem tồn
                            </Button>
                          </StaggerItem>
                        );
                      })}
                    </StaggerList>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

import { useId, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Select, Tag, Tooltip, Input, DatePicker } from 'antd';
import { SearchOutlined, AppstoreOutlined, InboxOutlined, SwapOutlined, WalletOutlined } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import DocCode from '@/components/ui/DocCode';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import { StaggerList, StaggerItem } from '@/components/ui/StaggerList';
import StatCard from '@/features/dashboard/components/StatCard';
import { STOCK_CARDS, STOCK_CARD_OPTIONS } from '@/mock/inventory';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/formatCurrency';

const { RangePicker } = DatePicker;
const TYPE_COLOR = { Nhập: 'blue', Xuất: 'gold', 'Kiểm kê': 'purple', 'Bất thường': 'red' };
const ALL_TYPES = Object.keys(TYPE_COLOR);

// Nền/viền/chữ khi chip lọc BẬT — map trực tiếp bằng class Tailwind (không qua
// prop `color` của Tag) để cả 4 loại chắc chắn lên đúng màu, đồng nhất như nhau.
const TYPE_CHIP_ACTIVE_CLASS = {
  blue: 'border-royal/30 bg-tint text-royal',
  gold: 'border-amber/40 bg-amber/10 text-amber',
  purple: 'border-purple-300 bg-purple-100 text-purple-700',
  red: 'border-danger/40 bg-danger/10 text-danger',
};

// Màu chấm dùng cho biểu đồ số dư + trục dòng thời gian — cùng ngôn ngữ màu với
// chip lọc loại chứng từ (Tag color ở trên) để cả trang nhất quán một bảng màu.
const TYPE_HEX = { Nhập: '#1e5af0', Xuất: '#f59e0b', 'Kiểm kê': '#7c3aed', 'Bất thường': '#dc2626' };
const OPENING_HEX = '#12356b';

// Chừa lề trong khung 0..100 để đường không dí sát mép, nhìn "đầy đặn" hơn.
const CHART_PAD_X = 4;
const CHART_PAD_Y = 16;

// Đường cong mượt qua các điểm bằng quadratic bezier nối trung điểm — kỹ thuật
// "smooth sparkline" phổ biến, không cần thư viện chart.
function smoothLinePath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x},${points[i].y} ${xc},${yc}`;
  }
  const last = points[points.length - 1];
  d += ` Q ${last.x},${last.y} ${last.x},${last.y}`;
  return d;
}

export default function StockCardPage() {
  const [searchParams] = useSearchParams();
  // Cho phép nhảy thẳng tới đây với 1 sản phẩm đã chọn sẵn (vd từ nút "Thẻ kho"
  // trên trang Tra cứu tồn): /stock-card?productId=<mã sản phẩm>.
  const paramProductId = searchParams.get('productId');
  const [productId, setProductId] = useState(
    STOCK_CARDS[paramProductId] ? paramProductId : STOCK_CARD_OPTIONS[0].value,
  );
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [hoverIndex, setHoverIndex] = useState(null);
  const card = STOCK_CARDS[productId];

  const filteredRows = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return card.rows.filter((r) => {
      const okType = selectedTypes.length === 0 || selectedTypes.includes(r.type);
      const okDate = !dateRange || (r.date >= dateRange[0].format('YYYY-MM-DD') && r.date <= dateRange[1].format('YYYY-MM-DD'));
      const okKw = !kw || [r.docCode, r.note].some((v) => v.toLowerCase().includes(kw));
      return okType && okDate && okKw;
    });
  }, [card, selectedTypes, dateRange, keyword]);

  // Dòng "Số dư đầu kỳ" (số dư gốc, không đổi theo bộ lọc) + các dòng biến động đã lọc —
  // dùng chung cho cả biểu đồ số dư lẫn dòng thời gian bên dưới.
  const rows = useMemo(
    () => [
      { key: 'opening', opening: true, balance: card.opening },
      ...filteredRows.map((r, i) => ({ key: `r${i}`, ...r })),
    ],
    [card.opening, filteredRows],
  );

  // Số dư cuối kỳ luôn phản ánh tồn kho thực tế hiện tại (dòng cuối cùng trong toàn bộ
  // lịch sử), không phụ thuộc bộ lọc — tránh gây hiểu lầm "tồn kho thay đổi theo filter".
  const closing = card.rows[card.rows.length - 1]?.balance ?? card.opening;

  // Toạ độ % (0..100) cho từng điểm trên biểu đồ số dư — chuẩn hoá theo min/max số dư
  // (có chừa lề trên/dưới) để đường luôn khớp khung, kể cả khi số dư âm.
  const { chartPoints, balanceMin, balanceMax, zeroY } = useMemo(() => {
    const balances = rows.map((r) => r.balance);
    const min = Math.min(...balances);
    const max = Math.max(...balances);
    const span = max - min || 1;
    const n = rows.length;
    const usableX = 100 - CHART_PAD_X * 2;
    const usableY = 100 - CHART_PAD_Y * 2;
    const toY = (balance) => CHART_PAD_Y + (1 - (balance - min) / span) * usableY;
    const points = rows.map((r, i) => ({
      ...r,
      x: n === 1 ? 50 : CHART_PAD_X + (i / (n - 1)) * usableX,
      y: toY(r.balance),
      color: r.opening ? OPENING_HEX : TYPE_HEX[r.type],
    }));
    return {
      chartPoints: points,
      balanceMin: min,
      balanceMax: max,
      zeroY: min < 0 && max > 0 ? toY(0) : null,
    };
  }, [rows]);

  const linePath = useMemo(() => smoothLinePath(chartPoints), [chartPoints]);
  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    return `${smoothLinePath(chartPoints)} L ${last.x},100 L ${first.x},100 Z`;
  }, [chartPoints]);
  const gradientId = useId();
  const hovered = hoverIndex !== null ? chartPoints[hoverIndex] : null;
  const lastPoint = chartPoints[chartPoints.length - 1];

  return (
    <>
      <PageHeader
        title="Thẻ kho"
        subtitle="Sổ cái biến động nhập – xuất với số dư chạy dồn"
        breadcrumb={[{ title: 'Tồn kho & Báo cáo' }, { title: 'Thẻ kho' }]}
        extra={
          <Select
            className="w-72"
            options={STOCK_CARD_OPTIONS}
            value={productId}
            onChange={setProductId}
            showSearch
            optionFilterProp="label"
          />
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Sản phẩm"
          value={
            <Tooltip title={card.productName}>
              <span className="line-clamp-2 block text-base font-bold leading-snug text-ink">
                {card.productName}
              </span>
            </Tooltip>
          }
          hint={`ĐVT: ${card.unit}`}
          icon={<AppstoreOutlined />}
          tone="blue"
          compact
        />
        <StatCard title="Số dư đầu kỳ" value={formatNumber(card.opening)} icon={<InboxOutlined />} tone="blue" compact />
        <StatCard title="Số biến động" value={formatNumber(filteredRows.length)} suffix="dòng" icon={<SwapOutlined />} tone="blue" compact />
        <StatCard
          title="Số dư cuối kỳ"
          value={formatNumber(closing)}
          icon={<WalletOutlined />}
          tone={closing < 0 ? 'red' : 'green'}
          cardTone={closing < 0 ? 'red' : undefined}
          compact
        />
      </div>

      <FilterBar>
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm mã chứng từ, diễn giải..."
          className="w-full sm:min-w-[200px] sm:max-w-[300px] sm:flex-1"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <RangePicker
          format="DD/MM/YYYY"
          className="w-full sm:w-auto"
          onChange={(dates) => setDateRange(dates)}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {ALL_TYPES.map((t) => {
            const active = selectedTypes.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() =>
                  setSelectedTypes((prev) => (active ? prev.filter((x) => x !== t) : [...prev, t]))
                }
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active ? TYPE_CHIP_ACTIVE_CLASS[TYPE_COLOR[t]] : 'border-slate-300 bg-white text-ink-sub'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </FilterBar>

      <FadeSection dataKey={rows.map((r) => r.key).join(',')}>
        {/* Biểu đồ số dư chạy dồn theo thời gian */}
        <div className="mb-4 rounded-2xl border border-hair bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="m-0 text-sm font-semibold text-ink">Số dư tồn kho theo thời gian</h3>
            <span className="rounded-full bg-tint px-3 py-1 text-xs font-semibold text-royal">
              Hiện tại: {formatNumber(lastPoint?.balance ?? 0)}
            </span>
          </div>

          <div className="flex h-60" onMouseLeave={() => setHoverIndex(null)}>
            {/* Trục giá trị: số dư cao nhất / 0 (nếu có) / thấp nhất trong kỳ */}
            <div className="relative w-16 shrink-0 pr-2">
              <span className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-ink-sub" style={{ top: `${CHART_PAD_Y}%` }}>
                {formatNumber(balanceMax)}
              </span>
              {zeroY !== null && (
                <span className="absolute right-2 -translate-y-1/2 text-[11px] text-ink-sub/70" style={{ top: `${zeroY}%` }}>
                  0
                </span>
              )}
              <span className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-ink-sub" style={{ top: `${100 - CHART_PAD_Y}%` }}>
                {formatNumber(balanceMin)}
              </span>
            </div>

            <div className="relative flex-1">
              <div className="absolute inset-x-0 border-t border-dashed border-hair" style={{ top: `${CHART_PAD_Y}%` }} />
              <div className="absolute inset-x-0 border-t border-dashed border-hair" style={{ top: `${100 - CHART_PAD_Y}%` }} />
              {zeroY !== null && (
                <div className="absolute inset-x-0 border-t border-dashed border-slate-300" style={{ top: `${zeroY}%` }} />
              )}

              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e5af0" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#1e5af0" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#1e5af0"
                  strokeWidth="2.2"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 3px 4px rgba(30, 90, 240, 0.25))' }}
                />
              </svg>

              {chartPoints.map((p, i) => (
                <span
                  key={p.key}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-white shadow-sm transition-all"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    backgroundColor: p.color,
                    width: hoverIndex === i ? 13 : 8,
                    height: hoverIndex === i ? 13 : 8,
                  }}
                  onMouseEnter={() => setHoverIndex(i)}
                />
              ))}

              {/* Chấm hiệu ứng lan toả đánh dấu số dư hiện tại (điểm cuối cùng) */}
              {lastPoint && (
                <motion.span
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ left: `${lastPoint.x}%`, top: `${lastPoint.y}%`, backgroundColor: lastPoint.color }}
                  initial={{ opacity: 0.55, scale: 1 }}
                  animate={{ opacity: 0, scale: 2.4 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
              )}

              {hovered && (
                <motion.div
                  className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-hair bg-white px-3 py-2 text-xs shadow-lg"
                  initial={false}
                  animate={{ left: `${hovered.x}%`, top: `${Math.max(hovered.y, 12)}%` }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                >
                  <p className="m-0 mb-1 font-semibold text-ink">
                    {hovered.opening ? 'Số dư đầu kỳ' : `${formatDate(hovered.date)} · ${hovered.type}`}
                  </p>
                  {!hovered.opening && <p className="m-0 mb-1 text-ink-sub">{hovered.docCode} — {hovered.note}</p>}
                  <p className="m-0 font-semibold text-navy-700">Số dư: {formatNumber(hovered.balance)}</p>
                  <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white" />
                </motion.div>
              )}
            </div>
          </div>

          <div className="mt-2 flex justify-between pl-16 text-[11px] text-ink-sub">
            <span>{formatDate(filteredRows[0]?.date ?? '')}</span>
            <span>{formatDate(chartPoints[chartPoints.length - 1]?.date ?? '')}</span>
          </div>
        </div>

        {/* Dòng thời gian biến động */}
        <div className="rounded-2xl border border-hair bg-surface p-5">
          <h3 className="m-0 mb-4 text-sm font-semibold text-ink">Lịch sử biến động ({filteredRows.length})</h3>
          <div className="relative">
            <div className="absolute bottom-2 left-[15px] top-2 w-px bg-hair" />
            <StaggerList as="ul" className="m-0 flex list-none flex-col gap-0 p-0">
              {rows.map((r) => (
                <StaggerItem key={r.key} as="li" className="relative flex gap-4 py-3">
                  <span className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center">
                    <span
                      className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: r.opening ? OPENING_HEX : TYPE_HEX[r.type] }}
                    />
                  </span>
                  {r.opening ? (
                    <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-ink">Số dư đầu kỳ</span>
                        <div className="mt-0.5 text-sm text-ink-sub">Tồn kho mang sang</div>
                      </div>
                      <span className="mono shrink-0 font-bold text-navy-700">{formatNumber(r.balance)}</span>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="mono text-xs text-ink-sub">{formatDate(r.date)}</span>
                          <Tag bordered={false} color={TYPE_COLOR[r.type]} className="!m-0">{r.type}</Tag>
                          <DocCode>{r.docCode}</DocCode>
                        </div>
                        <div className="mt-1 text-sm text-ink-sub">{r.note}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        {r.inQty > 0 && <div className="mono font-semibold text-ok">+{formatNumber(r.inQty)}</div>}
                        {r.outQty > 0 && <div className="mono font-semibold text-danger">-{formatNumber(r.outQty)}</div>}
                        <div className={`mono font-bold ${r.balance < 0 ? 'text-danger' : 'text-navy-700'}`}>
                          {formatNumber(r.balance)}
                        </div>
                      </div>
                    </div>
                  )}
                </StaggerItem>
              ))}
            </StaggerList>
            {filteredRows.length === 0 && <TableEmptyState message="Không tìm thấy biến động phù hợp" />}
          </div>
        </div>
      </FadeSection>
    </>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input, Select, Segmented, Tooltip, Button, App, Progress, Tag } from 'antd';
import { SearchOutlined, WarningFilled, DatabaseOutlined, WalletOutlined, StopOutlined, FileExcelOutlined, HistoryOutlined } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import DocCode from '@/components/ui/DocCode';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import { StaggerList, StaggerItem } from '@/components/ui/StaggerList';
import StatCard from '@/features/dashboard/components/StatCard';
import { INVENTORY, STOCK_CARDS } from '@/mock/inventory';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';

const CATEGORY_OPTS = [...new Set(INVENTORY.map((i) => i.categoryName))].map((c) => ({ value: c, label: c }));
const LOCATION_OPTS = [...new Set(INVENTORY.map((i) => i.location))].map((l) => ({ value: l, label: l }));
const UNIT_OPTS = [...new Set(INVENTORY.map((i) => i.unit))].map((u) => ({ value: u, label: u }));

const STOCK_FILTER_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Dưới định mức', value: 'low' },
  { label: 'Hết hàng', value: 'out' },
];

// Tông màu theo tình trạng tồn — dùng chung cho thanh trong danh sách và gauge chi tiết.
const stockTone = (item) => (item.onHand === 0 ? 'out' : item.onHand < item.minStock ? 'low' : 'ok');
const TONE_COLOR = { out: '#dc2626', low: '#f59e0b', ok: '#1e5af0' };

// Toạ độ đường xu hướng số dư (0..100) cho SVG mini-sparkline trong panel chi tiết.
function trendPolyline(rows) {
  const balances = rows.map((r) => r.balance);
  const min = Math.min(...balances);
  const max = Math.max(...balances);
  const span = max - min || 1;
  const n = rows.length;
  return rows
    .map((r, i) => {
      const x = n === 1 ? 50 : (i / (n - 1)) * 100;
      const y = (1 - (r.balance - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(' ');
}

export default function InventoryPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  // Cho phép nhảy thẳng tới đây với 1 sản phẩm đã lọc sẵn (vd từ ô tìm kiếm nhanh
  // trên Dashboard): /inventory?q=<sku hoặc tên sản phẩm>.
  const [keyword, setKeyword] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(null);
  const [location, setLocation] = useState(null);
  const [unit, setUnit] = useState(null);
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return INVENTORY.filter((i) => {
      const okKw = !kw || [i.productName, i.sku, i.lot].some((v) => v.toLowerCase().includes(kw));
      const okCat = !category || i.categoryName === category;
      const okLoc = !location || i.location === location;
      const okUnit = !unit || i.unit === unit;
      const okStock =
        stockFilter === 'all'
          ? true
          : stockFilter === 'low'
            ? i.onHand > 0 && i.onHand < i.minStock
            : i.onHand === 0;
      return okKw && okCat && okLoc && okUnit && okStock;
    });
  }, [keyword, category, location, unit, stockFilter]);

  const totalValue = data.reduce((s, i) => s + i.value, 0);
  const totalOnHand = data.reduce((s, i) => s + i.onHand, 0);
  const belowMinCount = data.filter((i) => i.onHand > 0 && i.onHand < i.minStock).length;
  const outOfStockCount = data.filter((i) => i.onHand === 0).length;

  // Sản phẩm không còn nằm trong tập đã lọc (đổi bộ lọc) -> tự rơi về dòng đầu tiên,
  // tránh giữ panel chi tiết trỏ tới 1 sản phẩm đã biến mất khỏi danh sách.
  const selected = data.find((i) => i.id === selectedId) ?? data[0] ?? null;
  const selectedCard = selected ? STOCK_CARDS[selected.productId] : null;
  const selectedTone = selected ? stockTone(selected) : 'ok';
  const selectedPercent = selected && selected.minStock > 0 ? Math.min(100, Math.round((selected.onHand / selected.minStock) * 100)) : 100;

  const exportExcel = () => message.info('Tính năng xuất Excel chỉ khả dụng trong bản đầy đủ.');

  return (
    <>
      <PageHeader
        title="Tra cứu tồn"
        subtitle="Tồn kho hiện tại theo sản phẩm – lô – vị trí"
        breadcrumb={[{ title: 'Tồn kho & Báo cáo' }, { title: 'Tra cứu tồn' }]}
        extra={
          <Button icon={<FileExcelOutlined />} onClick={exportExcel}>
            Xuất Excel
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Số dòng tồn" value={formatNumber(data.length)} suffix="dòng" icon={<DatabaseOutlined />} tone="blue" compact />
        <StatCard title="Tổng giá trị tồn" value={formatCurrency(totalValue)} icon={<WalletOutlined />} tone="green" compact />
        <StatCard title="Dưới định mức" value={formatNumber(belowMinCount)} suffix="dòng" icon={<WarningFilled />} tone="amber" cardTone="amber" compact />
        <StatCard title="Hết hàng" value={formatNumber(outOfStockCount)} suffix="dòng" icon={<StopOutlined />} tone="red" cardTone="red" compact />
      </div>

      <FilterBar>
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm sản phẩm, SKU, lô..."
          className="w-full sm:min-w-[200px] sm:max-w-xs sm:flex-1"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select allowClear placeholder="Danh mục" className="w-full sm:w-36" options={CATEGORY_OPTS} value={category} onChange={setCategory} />
        <Select allowClear placeholder="Vị trí" className="w-full sm:w-32" options={LOCATION_OPTS} value={location} onChange={setLocation} />
        <Select allowClear placeholder="ĐVT" className="w-full sm:w-24" options={UNIT_OPTS} value={unit} onChange={setUnit} />
        <Segmented className="shrink-0" options={STOCK_FILTER_OPTIONS} value={stockFilter} onChange={setStockFilter} />
      </FilterBar>

      <FadeSection dataKey={data.map((i) => i.id).join(',')}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          {/* Danh sách sản phẩm — chọn 1 dòng để xem chi tiết ở panel bên phải */}
          <div className="flex flex-col rounded-2xl border border-hair bg-surface">
            <div className="flex items-center justify-between border-b border-hair px-4 py-3">
              <span className="text-sm font-semibold text-ink">Danh sách ({data.length})</span>
              <span className="text-xs text-ink-sub">Tổng {formatNumber(totalOnHand)}</span>
            </div>
            <div className="app-scroll max-h-[600px] overflow-y-auto p-2">
              {data.length === 0 ? (
                <TableEmptyState message="Không tìm thấy dòng tồn phù hợp" />
              ) : (
                <StaggerList className="m-0 flex list-none flex-col gap-1 p-0">
                  {data.map((item) => {
                    const tone = stockTone(item);
                    const percent = item.minStock > 0 ? Math.min(100, Math.round((item.onHand / item.minStock) * 100)) : 100;
                    const active = selected?.id === item.id;
                    return (
                      <StaggerItem
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                          active ? 'border-royal/40 bg-tint/60' : 'border-transparent hover:border-hair hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-ink">{item.productName}</div>
                            <div className="mono truncate text-xs text-ink-sub">{item.sku}</div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {tone !== 'ok' && (
                              <Tooltip title={tone === 'out' ? 'Hết hàng' : 'Dưới định mức tối thiểu'}>
                                <WarningFilled style={{ color: TONE_COLOR[tone] }} />
                              </Tooltip>
                            )}
                            <span className="mono text-sm font-bold" style={{ color: tone === 'out' ? TONE_COLOR.out : undefined }}>
                              {formatNumber(item.onHand)}
                            </span>
                          </div>
                        </div>
                        <Progress percent={percent} size="small" showInfo={false} className="!mb-0 !mt-1.5" strokeColor={TONE_COLOR[tone]} />
                      </StaggerItem>
                    );
                  })}
                </StaggerList>
              )}
            </div>
          </div>

          {/* Panel chi tiết sản phẩm đang chọn */}
          <div className="rounded-2xl border border-hair bg-surface p-6">
            {!selected ? (
              <TableEmptyState message="Không có dữ liệu để hiển thị" />
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="m-0 truncate text-xl font-bold text-ink">{selected.productName}</h2>
                    <div className="mono mt-1 text-sm text-ink-sub">{selected.sku}</div>
                    <Tag bordered={false} color="blue" className="mt-2">
                      {selected.categoryName}
                    </Tag>
                  </div>
                  {selectedCard && (
                    <Button icon={<HistoryOutlined />} onClick={() => navigate(`/stock-card?productId=${selected.productId}`)}>
                      Xem Thẻ kho
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr]">
                  <div className="flex justify-center">
                    <Progress
                      type="dashboard"
                      percent={selectedPercent}
                      size={168}
                      strokeWidth={9}
                      strokeColor={TONE_COLOR[selectedTone]}
                      trailColor="#e2e8f0"
                      format={() => (
                        <div className="flex flex-col items-center">
                          <span className="mono text-2xl font-bold text-ink">{formatNumber(selected.onHand)}</span>
                          <span className="mono text-xs text-ink-sub">/ {formatNumber(selected.minStock)} {selected.unit}</span>
                        </div>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-5 content-start">
                    <div>
                      <div className="mb-1 text-xs text-ink-sub">Lô</div>
                      <DocCode>{selected.lot}</DocCode>
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-ink-sub">Vị trí</div>
                      <DocCode>{selected.location}</DocCode>
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-ink-sub">Đơn vị tính</div>
                      <span className="text-sm font-medium text-ink">{selected.unit}</span>
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-ink-sub">Giá trị tồn</div>
                      <span className="font-semibold text-ink">{formatCurrency(selected.value)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-hair pt-5">
                  <div className="mb-2 text-xs font-medium text-ink-sub">Xu hướng số dư (Thẻ kho)</div>
                  {selectedCard ? (
                    <>
                      <svg className="h-14 w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <polyline
                          points={trendPolyline(selectedCard.rows)}
                          fill="none"
                          stroke="#1e5af0"
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          transform="scale(1, 0.85) translate(0, 3)"
                        />
                      </svg>
                      <div className="mt-1 flex justify-between text-[11px] text-ink-sub">
                        <span>{formatDate(selectedCard.rows[0].date)}</span>
                        <span>{formatDate(selectedCard.rows[selectedCard.rows.length - 1].date)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="m-0 text-sm text-ink-sub">Chưa có dữ liệu biến động cho sản phẩm này.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </FadeSection>
    </>
  );
}

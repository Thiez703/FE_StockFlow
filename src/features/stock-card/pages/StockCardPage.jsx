import { useMemo, useState } from 'react';
import { Select, Tag, Card, Input, DatePicker } from 'antd';
import { SearchOutlined, InboxOutlined, SwapOutlined, WalletOutlined } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import StatCard from '@/features/dashboard/components/StatCard';
import { STOCK_CARDS, STOCK_CARD_OPTIONS } from '@/mock/inventory';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/formatCurrency';

const { RangePicker } = DatePicker;
const TYPE_COLOR = { Nhập: 'blue', Xuất: 'gold', 'Kiểm kê': 'purple', 'Bất thường': 'red' };
const ALL_TYPES = Object.keys(TYPE_COLOR);

export default function StockCardPage() {
  const [productId, setProductId] = useState(STOCK_CARD_OPTIONS[0].value);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [keyword, setKeyword] = useState('');
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

  // Dòng "Số dư đầu kỳ" (số dư gốc, không đổi theo bộ lọc) + các dòng biến động đã lọc.
  const rows = [
    { key: 'opening', opening: true, balance: card.opening },
    ...filteredRows.map((r, i) => ({ key: `r${i}`, ...r })),
  ];

  // Số dư cuối kỳ luôn phản ánh tồn kho thực tế hiện tại (dòng cuối cùng trong toàn bộ
  // lịch sử), không phụ thuộc bộ lọc — tránh gây hiểu lầm "tồn kho thay đổi theo filter".
  const closing = card.rows[card.rows.length - 1]?.balance ?? card.opening;

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      width: 120,
      render: (d, r) => (r.opening ? <span className="font-semibold text-ink-sub">—</span> : <span className="mono text-ink-sub">{formatDate(d)}</span>),
    },
    {
      title: 'Chứng từ',
      dataIndex: 'docCode',
      width: 160,
      render: (c, r) => (r.opening ? <span className="font-semibold text-ink">Số dư đầu kỳ</span> : <DocCode>{c}</DocCode>),
    },
    {
      title: 'Diễn giải',
      dataIndex: 'note',
      render: (note, r) =>
        r.opening ? (
          <span className="text-ink-sub">Tồn kho mang sang</span>
        ) : (
          <span className="flex items-center gap-2">
            <Tag bordered={false} color={TYPE_COLOR[r.type]}>{r.type}</Tag>
            <span className="text-ink-sub">{note}</span>
          </span>
        ),
    },
    {
      title: 'Nhập',
      dataIndex: 'inQty',
      align: 'right',
      width: 110,
      render: (v, r) => (!r.opening && v ? <span className="mono font-semibold text-[#15803d]">+{formatNumber(v)}</span> : <span className="text-ink-sub">—</span>),
    },
    {
      title: 'Xuất',
      dataIndex: 'outQty',
      align: 'right',
      width: 110,
      render: (v, r) => (!r.opening && v ? <span className="mono font-semibold text-[#b91c1c]">-{formatNumber(v)}</span> : <span className="text-ink-sub">—</span>),
    },
    {
      title: 'Số dư sau',
      dataIndex: 'balance',
      align: 'right',
      width: 140,
      render: (v) => <span className={`mono font-bold ${v < 0 ? 'text-[#b91c1c]' : 'text-navy-700'}`}>{formatNumber(v)}</span>,
    },
  ];

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
        <Card className="h-full border-hair" styles={{ body: { padding: 20 } }}>
          <p className="m-0 text-sm font-medium text-ink-sub">Sản phẩm</p>
          <p className="mt-2 mb-0 truncate text-base font-bold text-ink">{card.productName}</p>
          <Tag bordered={false} className="mt-2">{card.unit}</Tag>
        </Card>
        <StatCard title="Số dư đầu kỳ" value={formatNumber(card.opening)} icon={<InboxOutlined />} tone="blue" />
        <StatCard title="Số biến động" value={formatNumber(filteredRows.length)} suffix="dòng" icon={<SwapOutlined />} tone="blue" />
        <StatCard title="Số dư cuối kỳ" value={formatNumber(closing)} icon={<WalletOutlined />} tone={closing < 0 ? 'red' : 'green'} />
      </div>

      <FilterBar>
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm mã chứng từ, diễn giải..."
          className="w-full sm:w-64"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <RangePicker
          format="DD/MM/YYYY"
          className="w-full sm:w-auto"
          onChange={(dates) => setDateRange(dates)}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {ALL_TYPES.map((t) => (
            <Tag.CheckableTag
              key={t}
              checked={selectedTypes.includes(t)}
              className={`!flex !h-8 !items-center !rounded-md !px-3 !text-sm ${
                selectedTypes.includes(t) ? '' : '!border !border-slate-300 !bg-white'
              }`}
              onChange={(checked) =>
                setSelectedTypes((prev) => (checked ? [...prev, t] : prev.filter((x) => x !== t)))
              }
            >
              {t}
            </Tag.CheckableTag>
          ))}
        </div>
      </FilterBar>

      <FadeSection dataKey={rows.map((r) => r.key).join(',')}>
        <DataTable
          columns={columns}
          dataSource={rows}
          pagination={false}
          rowClassName={(r) => (r.opening ? '!bg-slate-50 font-medium' : r.balance < 0 ? '!bg-rose-50/60' : '')}
          locale={{ emptyText: <TableEmptyState message="Không tìm thấy biến động phù hợp" /> }}
        />
      </FadeSection>
    </>
  );
}

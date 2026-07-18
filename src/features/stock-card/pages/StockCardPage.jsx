import { useState } from 'react';
import { Select, Tag, Card } from 'antd';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import { STOCK_CARDS, STOCK_CARD_OPTIONS } from '@/mock/inventory';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/formatCurrency';

const TYPE_COLOR = { Nhập: 'blue', Xuất: 'gold', 'Kiểm kê': 'purple', 'Bất thường': 'red' };

export default function StockCardPage() {
  const [productId, setProductId] = useState(STOCK_CARD_OPTIONS[0].value);
  const card = STOCK_CARDS[productId];

  // Dòng "Số dư đầu kỳ" + các dòng biến động (đánh key ổn định).
  const rows = [
    { key: 'opening', opening: true, balance: card.opening },
    ...card.rows.map((r, i) => ({ key: `r${i}`, ...r })),
  ];

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
      render: (v) => <span className="mono font-bold text-navy-700">{formatNumber(v)}</span>,
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
        <Card className="border-hair" styles={{ body: { padding: 16 } }}>
          <div className="text-xs text-ink-sub">Sản phẩm</div>
          <div className="mt-1 truncate text-sm font-semibold text-ink">{card.productName}</div>
        </Card>
        <Card className="border-hair" styles={{ body: { padding: 16 } }}>
          <div className="text-xs text-ink-sub">Số dư đầu kỳ</div>
          <div className="mt-1 mono text-lg font-bold text-ink">{formatNumber(card.opening)}</div>
        </Card>
        <Card className="border-hair" styles={{ body: { padding: 16 } }}>
          <div className="text-xs text-ink-sub">Số biến động</div>
          <div className="mt-1 mono text-lg font-bold text-ink">{card.rows.length}</div>
        </Card>
        <Card className="border-hair" styles={{ body: { padding: 16 } }}>
          <div className="text-xs text-ink-sub">Số dư cuối kỳ</div>
          <div className="mt-1 mono text-lg font-bold text-royal">{formatNumber(closing)}</div>
        </Card>
      </div>

      <DataTable
        columns={columns}
        dataSource={rows}
        pagination={false}
        rowClassName={(r) => (r.opening ? '!bg-slate-50 font-medium' : '')}
      />
    </>
  );
}

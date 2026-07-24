import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input, Select, Segmented, Tooltip, Table } from 'antd';
import { SearchOutlined, WarningFilled, DatabaseOutlined, WalletOutlined, StopOutlined } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import StatCard from '@/features/dashboard/components/StatCard';
import { useColumnSort } from '@/hooks/useColumnSort';
import { INVENTORY } from '@/mock/inventory';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';

const CATEGORY_OPTS = [...new Set(INVENTORY.map((i) => i.categoryName))].map((c) => ({ value: c, label: c }));
const LOCATION_OPTS = [...new Set(INVENTORY.map((i) => i.location))].map((l) => ({ value: l, label: l }));
const UNIT_OPTS = [...new Set(INVENTORY.map((i) => i.unit))].map((u) => ({ value: u, label: u }));

const STOCK_FILTER_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Dưới định mức', value: 'low' },
  { label: 'Hết hàng', value: 'out' },
];

export default function InventoryPage() {
  const [searchParams] = useSearchParams();
  // Cho phép nhảy thẳng tới đây với 1 sản phẩm đã lọc sẵn (vd từ ô tìm kiếm nhanh
  // trên Dashboard): /inventory?q=<sku hoặc tên sản phẩm>.
  const [keyword, setKeyword] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(null);
  const [location, setLocation] = useState(null);
  const [unit, setUnit] = useState(null);
  const [stockFilter, setStockFilter] = useState('all');
  const { sortableTitle, sortRows } = useColumnSort();

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = INVENTORY.filter((i) => {
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
    return sortRows(filtered);
  }, [keyword, category, location, unit, stockFilter, sortRows]);

  const totalValue = data.reduce((s, i) => s + i.value, 0);
  const totalOnHand = data.reduce((s, i) => s + i.onHand, 0);
  const belowMinCount = data.filter((i) => i.onHand > 0 && i.onHand < i.minStock).length;
  const outOfStockCount = data.filter((i) => i.onHand === 0).length;

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      render: (name, r) => (
        <div>
          <span className="font-medium text-ink">{name}</span>
          <div className="mono text-xs text-ink-sub">{r.sku}</div>
        </div>
      ),
    },
    { title: 'Danh mục', dataIndex: 'categoryName', width: 130, className: '!text-ink-sub' },
    { title: 'Lô', dataIndex: 'lot', width: 120, render: (l) => <DocCode muted>{l}</DocCode> },
    { title: 'Vị trí', dataIndex: 'location', align: 'center', width: 110, render: (l) => <DocCode muted>{l}</DocCode> },
    { title: 'ĐVT', dataIndex: 'unit', align: 'center', width: 80 },
    {
      title: sortableTitle('Tồn hiện tại', 'onHand'),
      dataIndex: 'onHand',
      align: 'right',
      width: 150,
      render: (onHand, r) => {
        const out = onHand === 0;
        const low = onHand > 0 && onHand < r.minStock;
        return (
          <span className="inline-flex items-center justify-end gap-1.5">
            {(out || low) && (
              <Tooltip title={out ? 'Hết hàng' : 'Dưới định mức tối thiểu'}>
                <WarningFilled className={out ? 'text-[#dc2626]' : 'text-amber'} />
              </Tooltip>
            )}
            <span className={`mono font-semibold ${out ? 'text-[#b91c1c]' : 'text-ink'}`}>
              {formatNumber(onHand)}
            </span>
          </span>
        );
      },
    },
    {
      title: sortableTitle('Định mức min', 'minStock'),
      dataIndex: 'minStock',
      align: 'right',
      width: 120,
      render: (v) => <span className="mono text-ink-sub">{formatNumber(v)}</span>,
    },
    {
      title: sortableTitle('Giá trị tồn', 'value'),
      dataIndex: 'value',
      align: 'right',
      width: 160,
      render: (v) => <span className="font-semibold text-ink">{formatCurrency(v)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Tra cứu tồn"
        subtitle="Tồn kho hiện tại theo sản phẩm – lô – vị trí"
        breadcrumb={[{ title: 'Tồn kho & Báo cáo' }, { title: 'Tra cứu tồn' }]}
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Số dòng tồn" value={formatNumber(data.length)} suffix="dòng" icon={<DatabaseOutlined />} tone="blue" />
        <StatCard title="Tổng giá trị tồn" value={formatCurrency(totalValue)} icon={<WalletOutlined />} tone="green" />
        <StatCard title="Dưới định mức" value={formatNumber(belowMinCount)} suffix="dòng" icon={<WarningFilled />} tone="amber" />
        <StatCard title="Hết hàng" value={formatNumber(outOfStockCount)} suffix="dòng" icon={<StopOutlined />} tone="red" />
      </div>

      <FilterBar>
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm sản phẩm, SKU, lô..."
          className="w-full sm:w-64"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select allowClear placeholder="Danh mục" className="w-full sm:w-44" options={CATEGORY_OPTS} value={category} onChange={setCategory} />
        <Select allowClear placeholder="Vị trí" className="w-full sm:w-40" options={LOCATION_OPTS} value={location} onChange={setLocation} />
        <Select allowClear placeholder="ĐVT" className="w-full sm:w-32" options={UNIT_OPTS} value={unit} onChange={setUnit} />
        <Segmented options={STOCK_FILTER_OPTIONS} value={stockFilter} onChange={setStockFilter} />
      </FilterBar>

      <FadeSection dataKey={data.map((i) => i.id).join(',')}>
        <DataTable
          columns={columns}
          dataSource={data}
          rowClassName={(r) => (r.onHand === 0 ? '!bg-rose-50/60' : r.onHand > 0 && r.onHand < r.minStock ? '!bg-amber-50/50' : '')}
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => `${t} dòng tồn` }}
          locale={{ emptyText: <TableEmptyState message="Không tìm thấy dòng tồn phù hợp" /> }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5}>
                  <span className="text-sm font-semibold text-ink-sub">Tổng ({data.length} dòng)</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <span className="mono font-semibold text-ink">{formatNumber(totalOnHand)}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} />
                <Table.Summary.Cell index={7} align="right">
                  <span className="font-semibold text-royal">{formatCurrency(totalValue)}</span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </FadeSection>
    </>
  );
}

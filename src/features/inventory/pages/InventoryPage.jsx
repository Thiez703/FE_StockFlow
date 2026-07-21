import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input, Select, Tooltip } from 'antd';
import { SearchOutlined, WarningFilled } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import { INVENTORY } from '@/mock/inventory';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';

const CATEGORY_OPTS = [...new Set(INVENTORY.map((i) => i.categoryName))].map((c) => ({ value: c, label: c }));
const LOCATION_OPTS = [...new Set(INVENTORY.map((i) => i.location))].map((l) => ({ value: l, label: l }));

export default function InventoryPage() {
  const [searchParams] = useSearchParams();
  // Cho phép nhảy thẳng tới đây với 1 sản phẩm đã lọc sẵn (vd từ ô tìm kiếm nhanh
  // trên Dashboard): /inventory?q=<sku hoặc tên sản phẩm>.
  const [keyword, setKeyword] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(null);
  const [location, setLocation] = useState(null);

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return INVENTORY.filter((i) => {
      const okKw = !kw || [i.productName, i.sku, i.lot].some((v) => v.toLowerCase().includes(kw));
      const okCat = !category || i.categoryName === category;
      const okLoc = !location || i.location === location;
      return okKw && okCat && okLoc;
    });
  }, [keyword, category, location]);

  const totalValue = data.reduce((s, i) => s + i.value, 0);

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
      title: 'Tồn hiện tại',
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
    { title: 'Định mức min', dataIndex: 'minStock', align: 'right', width: 120, render: (v) => <span className="mono text-ink-sub">{formatNumber(v)}</span> },
    {
      title: 'Giá trị tồn',
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

      <FilterBar
        extra={
          <span className="text-sm text-ink-sub">
            Tổng giá trị: <span className="font-semibold text-royal">{formatCurrency(totalValue)}</span>
          </span>
        }
      >
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
      </FilterBar>

      <DataTable columns={columns} dataSource={data} pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => `${t} dòng tồn` }} />
    </>
  );
}

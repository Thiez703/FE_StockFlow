import { useMemo, useState } from 'react';
import { Button, Input, Select, Tooltip, App } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import ProductFormModal from '@/features/products/components/ProductFormModal';
import { PRODUCTS, getProduct } from '@/mock/products';
import { CATEGORY_OPTIONS, getCategoryName } from '@/mock/categories';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';

export default function ProductsPage() {
  const { message } = App.useApp();
  const [rows, setRows] = useState(PRODUCTS);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState(null);
  const [status, setStatus] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rows.filter((p) => {
      const okKw = !kw || [p.name, p.sku, p.barcode].some((v) => v.toLowerCase().includes(kw));
      const okCat = !category || p.categoryId === category;
      const okStatus = !status || p.status === status;
      return okKw && okCat && okStatus;
    });
  }, [rows, keyword, category, status]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (record) => {
    setEditing(record);
    setModalOpen(true);
  };

  const handleSubmit = (values) => {
    if (editing) {
      setRows((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...values } : p)));
      message.success('Đã cập nhật sản phẩm');
    } else {
      const id = `SP-${String(rows.length + 1).padStart(3, '0')}`;
      setRows((prev) => [{ id, ...values }, ...prev]);
      message.success('Đã thêm sản phẩm mới');
    }
    setModalOpen(false);
  };

  const columns = [
    {
      title: 'Mã / Barcode',
      dataIndex: 'sku',
      width: 190,
      render: (sku, r) => (
        <div>
          <DocCode>{sku}</DocCode>
          <div className="mono text-xs text-ink-sub">{r.barcode}</div>
        </div>
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      render: (name) => <span className="font-medium text-ink">{name}</span>,
    },
    { title: 'Danh mục', dataIndex: 'categoryId', render: (id) => getCategoryName(id) },
    { title: 'ĐVT', dataIndex: 'baseUnit', align: 'center', width: 80 },
    {
      title: 'Định mức (min/max)',
      dataIndex: 'minStock',
      align: 'right',
      width: 160,
      render: (min, r) => (
        <span className="mono text-ink-sub">
          {formatNumber(min)} / {formatNumber(r.maxStock)}
        </span>
      ),
    },
    {
      title: 'Giá bán lẻ',
      dataIndex: 'price',
      align: 'right',
      width: 130,
      render: (v) => <span className="font-semibold text-ink">{formatCurrency(v)}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      width: 130,
      render: (s) => <StatusPill status={s} />,
    },
    {
      title: '',
      key: 'action',
      align: 'center',
      width: 56,
      render: (_, r) => (
        <Tooltip title="Sửa">
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(getProduct(r.id) ?? r)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Sản phẩm"
        subtitle="Danh mục hàng hoá bia – nước giải khát đang kinh doanh"
        breadcrumb={[{ title: 'Dữ liệu nền' }, { title: 'Sản phẩm' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Thêm sản phẩm
          </Button>
        }
      />

      <FilterBar
        extra={<span className="text-sm text-ink-sub">{data.length} sản phẩm</span>}
      >
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm theo tên, SKU, barcode..."
          className="w-full sm:w-72"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select
          allowClear
          placeholder="Danh mục"
          className="w-full sm:w-52"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          className="w-full sm:w-44"
          options={[
            { value: 'active', label: 'Hoạt động' },
            { value: 'inactive', label: 'Ngừng kinh doanh' },
          ]}
          value={status}
          onChange={setStatus}
        />
      </FilterBar>

      <DataTable columns={columns} dataSource={data} />

      <ProductFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}

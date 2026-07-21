import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Select, Checkbox, Tag, Tooltip, Popconfirm, App } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  InboxOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
} from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import ProductFormModal from '@/features/master-data/components/ProductFormModal';
import { PRODUCTS, getProduct } from '@/mock/products';
import { CATEGORY_OPTIONS, getCategoryName } from '@/mock/categories';
import { INVENTORY } from '@/mock/inventory';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';

const UNIT_OPTIONS = [
  { value: 'Lon', label: 'Lon' },
  { value: 'Chai', label: 'Chai' },
];

// Tổng tồn thực tế theo sản phẩm (gộp mọi lô/vị trí) — đối chiếu với minStock để
// lọc "đang dưới định mức tồn". Sản phẩm chưa có bản ghi tồn kho nào -> coi là 0.
const ONHAND_BY_PRODUCT = INVENTORY.reduce((acc, i) => {
  acc[i.productId] = (acc[i.productId] ?? 0) + i.onHand;
  return acc;
}, {});

export default function ProductsTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const [rows, setRows] = useState(PRODUCTS);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState(null);
  const [status, setStatus] = useState(null);
  const [unit, setUnit] = useState(null);
  const [belowMin, setBelowMin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [sortState, setSortState] = useState({ field: null, order: null });

  // Sắp xếp hoàn toàn thủ công (không dùng `sorter` của AntD, vì cột có `sorter`
  // sẽ tự thêm icon riêng, chồng lên chỉ báo tự vẽ bên dưới). Bấm tiêu đề đổi
  // chiều: asc -> desc -> tắt.
  const toggleSort = (field) => {
    setSortState((prev) => {
      if (prev.field !== field) return { field, order: 'asc' };
      if (prev.order === 'asc') return { field, order: 'desc' };
      return { field: null, order: null };
    });
  };

  const sortableTitle = (label, field) => {
    const active = sortState.field === field;
    return (
      <span
        className="inline-flex cursor-pointer select-none items-center gap-2"
        onClick={() => toggleSort(field)}
      >
        {label}
        <span className="flex flex-col leading-[10px]">
          <CaretUpOutlined
            className="text-sm"
            style={{
              color: active && sortState.order === 'asc' ? '#1E5AF0' : '#CBD5E1',
              transition: 'color 0.15s ease',
            }}
          />
          <CaretDownOutlined
            className="text-sm"
            style={{
              color: active && sortState.order === 'desc' ? '#1E5AF0' : '#CBD5E1',
              transition: 'color 0.15s ease',
            }}
          />
        </span>
      </span>
    );
  };

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = rows.filter((p) => {
      const okKw = !kw || [p.name, p.sku, p.barcode].some((v) => v.toLowerCase().includes(kw));
      const okCat = !category || p.categoryId === category;
      const okStatus = !status || p.status === status;
      const okUnit = !unit || p.baseUnit === unit;
      const okBelowMin = !belowMin || (ONHAND_BY_PRODUCT[p.id] ?? 0) < p.minStock;
      return okKw && okCat && okStatus && okUnit && okBelowMin;
    });
    if (!sortState.field) return filtered;
    const dir = sortState.order === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => (a[sortState.field] - b[sortState.field]) * dir);
  }, [rows, keyword, category, status, unit, belowMin, sortState]);

  const hasActiveFilters = Boolean(keyword || category || status || unit || belowMin);
  const clearFilters = () => {
    setKeyword('');
    setCategory(null);
    setStatus(null);
    setUnit(null);
    setBelowMin(false);
  };

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

  const handleBulkStatus = (newStatus) => {
    setRows((prev) => prev.map((p) => (selectedRowKeys.includes(p.id) ? { ...p, status: newStatus } : p)));
    message.success(
      `Đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} ${selectedRowKeys.length} sản phẩm`,
    );
    setSelectedRowKeys([]);
  };

  const handleBulkDelete = () => {
    setRows((prev) => prev.filter((p) => !selectedRowKeys.includes(p.id)));
    message.success(`Đã xoá ${selectedRowKeys.length} sản phẩm`);
    setSelectedRowKeys([]);
  };

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      render: (name, r) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{name}</span>
            <Tag bordered={false} className="!m-0">
              {r.baseUnit}
            </Tag>
          </div>
          <div className="mono text-xs text-ink-sub">
            {r.sku} · {r.barcode}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      width: 130,
      render: (s) => <StatusPill status={s} />,
    },
    { title: 'Danh mục', dataIndex: 'categoryId', render: (id) => getCategoryName(id) },
    {
      title: sortableTitle('Định mức (min/max)', 'minStock'),
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
      title: sortableTitle('Giá bán lẻ', 'price'),
      dataIndex: 'price',
      align: 'right',
      width: 130,
      render: (v) => <span className="font-semibold text-ink">{formatCurrency(v)}</span>,
    },
    {
      title: '',
      key: 'action',
      align: 'center',
      width: 56,
      render: (_, r) => (
        <Tooltip title="Sửa">
          <Button type="text" icon={<EditOutlined />} disabled={!canManageMasterData} onClick={() => openEdit(getProduct(r.id) ?? r)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Sidebar bộ lọc */}
        <aside className="w-full shrink-0 lg:w-64">
          <div className="flex flex-col gap-3 rounded-2xl border border-hair bg-white p-4">
            <div className="flex items-center justify-between">
              <h4 className="m-0 text-sm font-semibold text-ink">Bộ lọc</h4>
              <AnimatePresence>
                {hasActiveFilters && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button type="link" size="small" className="!px-0" onClick={clearFilters}>
                      Xoá lọc
                    </Button>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm theo tên, SKU, barcode..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Select
              allowClear
              placeholder="Danh mục"
              className="w-full"
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={setCategory}
            />
            <Select
              allowClear
              placeholder="Trạng thái"
              className="w-full"
              options={[
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Ngừng kinh doanh' },
              ]}
              value={status}
              onChange={setStatus}
            />
            <Select
              allowClear
              placeholder="ĐVT"
              className="w-full"
              options={UNIT_OPTIONS}
              value={unit}
              onChange={setUnit}
            />
            <Checkbox checked={belowMin} onChange={(e) => setBelowMin(e.target.checked)}>
              Đang dưới định mức tồn
            </Checkbox>
          </div>
        </aside>

        {/* Danh sách sản phẩm */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <AnimatePresence mode="wait">
              {selectedRowKeys.length > 0 ? (
                <motion.div
                  key="bulk-actions"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-1 flex-wrap items-center gap-2"
                >
                  <span className="text-sm font-medium text-ink">Đã chọn {selectedRowKeys.length} sản phẩm</span>
                  <Button size="small" onClick={() => handleBulkStatus('active')}>
                    Kích hoạt
                  </Button>
                  <Button size="small" onClick={() => handleBulkStatus('inactive')}>
                    Vô hiệu hóa
                  </Button>
                  <Popconfirm
                    title={`Xoá ${selectedRowKeys.length} sản phẩm đã chọn?`}
                    description="Hành động này không thể hoàn tác."
                    okText="Xoá"
                    okButtonProps={{ danger: true }}
                    cancelText="Huỷ"
                    onConfirm={handleBulkDelete}
                  >
                    <Button size="small" danger>
                      Xoá
                    </Button>
                  </Popconfirm>
                  <Button size="small" type="text" onClick={() => setSelectedRowKeys([])}>
                    Bỏ chọn
                  </Button>
                </motion.div>
              ) : (
                <motion.span
                  key="count"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm text-ink-sub"
                >
                  {data.length} sản phẩm
                </motion.span>
              )}
            </AnimatePresence>
            {canManageMasterData && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
                Thêm sản phẩm
              </Button>
            )}
          </div>
          <motion.div
            key={data.map((p) => p.id).join(',')}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DataTable
              columns={columns}
              dataSource={data}
              rowSelection={
                canManageMasterData
                  ? { selectedRowKeys, onChange: setSelectedRowKeys }
                  : undefined
              }
              locale={{
                emptyText: (
                  <div className="flex flex-col items-center gap-3 py-10">
                    <InboxOutlined className="text-3xl text-slate-300" />
                    <p className="m-0 text-sm text-ink-sub">Không tìm thấy sản phẩm phù hợp</p>
                  </div>
                ),
              }}
            />
          </motion.div>
        </div>
      </div>

      <ProductFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}

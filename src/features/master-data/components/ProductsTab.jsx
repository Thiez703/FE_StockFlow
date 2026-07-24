import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Select, Checkbox, Tag, Tooltip, Popconfirm, App } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import DataTable from '@/components/ui/DataTable';
import FilterSidebar from '@/components/ui/FilterSidebar';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import StatusPill from '@/components/ui/StatusPill';
import ProductFormModal from '@/features/master-data/components/ProductFormModal';
import { PRODUCTS, getProduct } from '@/mock/products';
import { CATEGORY_OPTIONS, getCategoryName } from '@/mock/categories';
import { INVENTORY } from '@/mock/inventory';
import { formatNumber } from '@/utils/formatCurrency';

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
  const { sortableTitle, sortRows } = useColumnSort();

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
    return sortRows(filtered);
  }, [rows, keyword, category, status, unit, belowMin, sortRows]);

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
      title: sortableTitle('Tồn tối thiểu', 'minStock'),
      dataIndex: 'minStock',
      align: 'right',
      width: 130,
      render: (min) => <span className="mono text-ink-sub">{formatNumber(min)}</span>,
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
        <FilterSidebar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
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
        </FilterSidebar>

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
          <FadeSection dataKey={data.map((p) => p.id).join(',')}>
            <DataTable
              columns={columns}
              dataSource={data}
              rowSelection={
                canManageMasterData
                  ? { selectedRowKeys, onChange: setSelectedRowKeys }
                  : undefined
              }
              locale={{ emptyText: <TableEmptyState message="Không tìm thấy sản phẩm phù hợp" /> }}
            />
          </FadeSection>
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

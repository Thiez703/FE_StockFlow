import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Select, Tag, Tooltip, Popconfirm, App } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, SwapOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import DataTable from '@/components/ui/DataTable';
import FilterSidebar from '@/components/ui/FilterSidebar';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import StatusPill from '@/components/ui/StatusPill';
import ProductFormModal from '@/features/master-data/components/ProductFormModal';
import ProductUnitsModal from '@/features/master-data/components/ProductUnitsModal';
import { productApi } from '@/api/products';
import { categoryApi } from '@/api/categories';
import { unitApi } from '@/api/units';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatNumber } from '@/utils/formatCurrency';

const PRODUCTS_KEY = ['products'];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng kinh doanh' },
];

// Bộ lọc "đang dưới định mức tồn" của bản mock đã bỏ: cần số tồn thực tế mà
// backend chưa có API tồn kho. Cột barcode cũng bỏ vì ProductResponse không có.
export default function ProductsTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState(null);
  const [status, setStatus] = useState(null);
  const [unit, setUnit] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  // Sản phẩm đang mở bảng đơn vị quy đổi (null = modal đóng).
  const [unitsTarget, setUnitsTarget] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const { sortableTitle, sortRows } = useColumnSort();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: productApi.getAll,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'flat'],
    queryFn: categoryApi.getAll,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: unitApi.getAll,
  });

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const unitOptions = units.map((u) => ({ value: u.id, label: u.name }));
  const categoryName = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );
  const unitName = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u.name])), [units]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
  const onError = (error) => message.error(getErrorMessage(error));

  const { mutate: saveProduct, isPending: isSaving } = useMutation({
    mutationFn: ({ id, values }) =>
      id ? productApi.update(id, values) : productApi.create(values),
    onSuccess: (_data, { id }) => {
      invalidate();
      message.success(id ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm mới');
      setModalOpen(false);
    },
    onError,
  });

  // Backend không có API sửa hàng loạt -> gọi song song từng bản ghi.
  // Dùng activate/deactivate thay vì update() để khỏi gửi lại nguyên body sản phẩm.
  const { mutate: bulkSetStatus } = useMutation({
    mutationFn: ({ ids, next }) =>
      Promise.all(
        ids.map((id) => (next === 'ACTIVE' ? productApi.activate(id) : productApi.deactivate(id))),
      ),
    onSuccess: (_data, { ids, next }) => {
      invalidate();
      message.success(
        `Đã ${next === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa'} ${ids.length} sản phẩm`,
      );
      setSelectedRowKeys([]);
    },
    onError,
  });

  const { mutate: bulkDelete } = useMutation({
    mutationFn: (ids) => Promise.all(ids.map((id) => productApi.remove(id))),
    onSuccess: (_data, ids) => {
      invalidate();
      message.success(`Đã xoá ${ids.length} sản phẩm`);
      setSelectedRowKeys([]);
    },
    onError,
  });

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = rows.filter((p) => {
      const okKw = !kw || [p.name, p.code].some((v) => String(v ?? '').toLowerCase().includes(kw));
      const okCat = !category || p.categoryId === category;
      const okStatus = !status || p.status === status;
      const okUnit = !unit || p.baseUnitId === unit;
      return okKw && okCat && okStatus && okUnit;
    });
    return sortRows(filtered);
  }, [rows, keyword, category, status, unit, sortRows]);

  const hasActiveFilters = Boolean(keyword || category || status || unit);
  const clearFilters = () => {
    setKeyword('');
    setCategory(null);
    setStatus(null);
    setUnit(null);
  };

  const handleSubmit = (values) => {
    saveProduct({
      id: editing?.id,
      values: {
        code: values.code,
        name: values.name,
        categoryId: values.categoryId ?? null,
        baseUnitId: values.baseUnitId,
        minStock: values.minStock ?? 0,
        status: values.status,
      },
    });
  };

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      render: (name, r) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{name}</span>
            {unitName[r.baseUnitId] && (
              <Tag bordered={false} className="!m-0">
                {unitName[r.baseUnitId]}
              </Tag>
            )}
          </div>
          <div className="mono text-xs text-ink-sub">{r.code}</div>
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
    {
      title: 'Danh mục',
      dataIndex: 'categoryId',
      render: (id) => categoryName[id] ?? '—',
    },
    {
      title: sortableTitle('Tồn tối thiểu', 'minStock'),
      dataIndex: 'minStock',
      align: 'right',
      width: 130,
      render: (min) => <span className="mono text-ink-sub">{formatNumber(min ?? 0)}</span>,
    },
    {
      title: '',
      key: 'action',
      align: 'center',
      width: 96,
      render: (_, r) => (
        <div className="flex items-center justify-center">
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              disabled={!canManageMasterData}
              onClick={() => {
                setEditing(r);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          {/* Xem được ở mọi vai trò, sửa thì mới cần quyền master data. */}
          <Tooltip title="Đơn vị quy đổi">
            <Button type="text" icon={<SwapOutlined />} onClick={() => setUnitsTarget(r)} />
          </Tooltip>
        </div>
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
            placeholder="Tìm theo tên, mã sản phẩm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Danh mục"
            className="w-full"
            options={categoryOptions}
            value={category}
            onChange={setCategory}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            className="w-full"
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="ĐVT"
            className="w-full"
            options={unitOptions}
            value={unit}
            onChange={setUnit}
          />
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
                  <Button size="small" onClick={() => bulkSetStatus({ ids: selectedRowKeys, next: 'ACTIVE' })}>
                    Kích hoạt
                  </Button>
                  <Button size="small" onClick={() => bulkSetStatus({ ids: selectedRowKeys, next: 'INACTIVE' })}>
                    Vô hiệu hóa
                  </Button>
                  <Popconfirm
                    title={`Xoá ${selectedRowKeys.length} sản phẩm đã chọn?`}
                    description="Hành động này không thể hoàn tác."
                    okText="Xoá"
                    okButtonProps={{ danger: true }}
                    cancelText="Huỷ"
                    onConfirm={() => bulkDelete(selectedRowKeys)}
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
              <Tooltip title={units.length ? '' : 'Cần có ít nhất một đơn vị tính trước'}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  disabled={!units.length}
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(true);
                  }}
                >
                  Thêm sản phẩm
                </Button>
              </Tooltip>
            )}
          </div>
          <FadeSection dataKey={data.map((p) => p.id).join(',')}>
            <DataTable
              columns={columns}
              dataSource={data}
              loading={isLoading}
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
        categoryOptions={categoryOptions}
        unitOptions={unitOptions}
        confirmLoading={isSaving}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ProductUnitsModal
        open={!!unitsTarget}
        product={unitsTarget}
        canEdit={canManageMasterData}
        onClose={() => setUnitsTarget(null)}
      />
    </>
  );
}

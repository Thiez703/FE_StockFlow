import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Select, Tag, Tooltip, Popconfirm, App, Checkbox, Segmented } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, SwapOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import DataTable from '@/components/ui/DataTable';
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
  const [unitsTarget, setUnitsTarget] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewMode, setViewMode] = useState('card');
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
          <Tooltip title="Đơn vị quy đổi">
            <Button type="text" icon={<SwapOutlined />} onClick={() => setUnitsTarget(r)} />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Top Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm theo tên, mã sản phẩm..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full sm:w-64"
            />
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Danh mục"
              className="w-full sm:w-48"
              options={categoryOptions}
              value={category}
              onChange={setCategory}
            />
            <Select
              allowClear
              placeholder="Trạng thái"
              className="w-full sm:w-48"
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
            />
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="ĐVT"
              className="w-full sm:w-48"
              options={unitOptions}
              value={unit}
              onChange={setUnit}
            />
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Segmented
                options={[
                  { value: 'card', icon: <AppstoreOutlined /> },
                  { value: 'table', icon: <UnorderedListOutlined /> },
                ]}
                value={viewMode}
                onChange={setViewMode}
              />
              <AnimatePresence mode="wait">
                {selectedRowKeys.length > 0 ? (
                  <motion.div
                    key="bulk-actions"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                      Đã chọn {selectedRowKeys.length}
                    </span>
                    <Button size="small" onClick={() => bulkSetStatus({ ids: selectedRowKeys, next: 'ACTIVE' })}>
                      Kích hoạt
                    </Button>
                    <Button size="small" onClick={() => bulkSetStatus({ ids: selectedRowKeys, next: 'INACTIVE' })}>
                      Vô hiệu hóa
                    </Button>
                    <Popconfirm
                      title={`Xoá ${selectedRowKeys.length} sản phẩm?`}
                      onConfirm={() => bulkDelete(selectedRowKeys)}
                    >
                      <Button size="small" danger>Xoá</Button>
                    </Popconfirm>
                    <Button size="small" type="text" onClick={() => setSelectedRowKeys([])}>Bỏ chọn</Button>
                  </motion.div>
                ) : (
                  <motion.span
                    key="count"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm text-slate-500 font-medium"
                  >
                    {data.length} sản phẩm
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            
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
          
          <FadeSection dataKey={`${viewMode}-${data.map((p) => p.id).join(',')}`}>
            {viewMode === 'table' ? (
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
            ) : data.length === 0 ? (
              <TableEmptyState message="Không tìm thấy sản phẩm phù hợp" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                {data.map((p) => {
                  const isSelected = selectedRowKeys.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`group relative rounded-2xl border bg-white overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                        isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {canManageMasterData && (
                        <div className="absolute top-3 left-3 z-10">
                          <Checkbox
                            checked={isSelected}
                            className="scale-110"
                            onChange={(e) => {
                              if (e.target.checked) setSelectedRowKeys((prev) => [...prev, p.id]);
                              else setSelectedRowKeys((prev) => prev.filter((k) => k !== p.id));
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 bg-white/90 p-1 rounded-xl backdrop-blur-md shadow-sm border border-slate-100">
                        <Tooltip title="Sửa" placement="left">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined className="text-blue-600" />}
                            disabled={!canManageMasterData}
                            onClick={() => {
                              setEditing(p);
                              setModalOpen(true);
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="Đơn vị quy đổi" placement="left">
                          <Button
                            type="text"
                            size="small"
                            icon={<SwapOutlined className="text-blue-600" />}
                            onClick={() => setUnitsTarget(p)}
                          />
                        </Tooltip>
                      </div>

                      {/* Skeleton Image with gradient & shimmer */}
                      <div className="aspect-video w-full bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center border-b border-indigo-100/50 p-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%] animate-[pulse_2s_infinite]"></div>
                        <div className="w-16 h-16 bg-white/90 rounded-2xl shadow-sm mb-3 flex items-center justify-center backdrop-blur-sm border border-white relative z-1">
                          <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="w-1/2 h-1.5 bg-indigo-200/50 rounded-full relative z-1"></div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-slate-800 text-sm truncate m-0 flex-1">{p.name}</h3>
                          <StatusPill status={p.status} />
                        </div>
                        <div className="font-mono text-xs font-semibold text-blue-600/70 mb-4">{p.code}</div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-400 font-medium">Danh mục</span>
                            <span className="font-semibold text-slate-700 truncate">{categoryName[p.categoryId] ?? '—'}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-400 font-medium">Đơn vị cơ bản</span>
                            <span className="font-semibold text-slate-700 truncate">{unitName[p.baseUnitId] ?? '—'}</span>
                          </div>
                          <div className="flex flex-col gap-1 col-span-2 mt-1 pt-3 border-t border-slate-100">
                            <span className="text-slate-400 font-medium">Tồn tối thiểu</span>
                            <span className="font-bold text-slate-800">{formatNumber(p.minStock ?? 0)} <span className="text-slate-500 font-normal">{unitName[p.baseUnitId]}</span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

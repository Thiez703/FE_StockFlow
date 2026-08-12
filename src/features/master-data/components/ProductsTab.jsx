import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Select, Tag, Tooltip, Popconfirm, App } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useColumnSort } from '@/hooks/useColumnSort';
import DataTable from '@/components/ui/DataTable';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import StatusPill from '@/components/ui/StatusPill';
import ProductFormModal from '@/features/master-data/components/ProductFormModal';
import { productApi } from '@/api/products';
import { categoryApi } from '@/api/categories';
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
  const isMobile = useIsMobile();

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState(null);
  const [status, setStatus] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const { sortableTitle, sortRows } = useColumnSort(null, null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: productApi.getAll,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'flat'],
    queryFn: categoryApi.getAll,
  });

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const categoryName = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

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
      return okKw && okCat && okStatus;
    });
    return sortRows(filtered);
  }, [rows, keyword, category, status, sortRows]);

  const handleSubmit = (values) => {
    saveProduct({
      id: editing?.id,
      values: {
        code: values.code,
        name: values.name,
        categoryId: values.categoryId ?? null,
        unit: values.unit,
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
            {r.unit && (
              <Tag bordered={false} className="!m-0">
                {r.unit}
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
      width: 56,
      render: (_, r) => (
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
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <AnimatePresence mode="wait">
                {selectedRowKeys.length > 0 ? (
                  <motion.div
                    key="bulk-actions"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-wrap items-center gap-2"
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

            {canManageMasterData && !isMobile && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                Thêm sản phẩm
              </Button>
            )}
          </div>

          {canManageMasterData && isMobile && (
            <Button
              type="primary"
              shape="circle"
              icon={<PlusOutlined />}
              size="large"
              className="fixed bottom-20 right-4 z-50 shadow-lg w-12 h-12 flex items-center justify-center bg-blue-600"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            />
          )}

          <FadeSection dataKey={`table-${data.map((p) => p.id).join(',')}`}>
            <DataTable
              columns={columns}
              dataSource={data}
              loading={isLoading}
              scroll={{ x: 650 }}
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
        confirmLoading={isSaving}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}

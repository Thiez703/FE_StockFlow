import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Button, Input, Select, Checkbox, Tooltip, Form, Modal, DatePicker, App } from 'antd';
import { EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import DataTable from '@/components/ui/DataTable';
import FilterSidebar from '@/components/ui/FilterSidebar';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import { lotApi } from '@/api/lots';
import { productApi } from '@/api/products';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatDate, daysUntil } from '@/utils/date';

const LOTS_KEY = ['lots'];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Còn hạn' },
  { value: 'EXPIRED', label: 'Quá hạn' },
  { value: 'INACTIVE', label: 'Ngừng' },
];

// Phân loại tình trạng hạn dùng theo số ngày còn lại.
function expiryInfo(expDate) {
  const d = daysUntil(expDate);
  if (d < 0) return { tone: 'text-[#b91c1c]', dot: 'bg-[#dc2626]', label: `Quá hạn ${Math.abs(d)} ngày` };
  if (d <= 30) return { tone: 'text-[#b45309]', dot: 'bg-amber', label: `Còn ${d} ngày` };
  return { tone: 'text-ink', dot: 'bg-[#16a34a]', label: `Còn ${d} ngày` };
}

// Các cột "Tồn lô" và "Vị trí" của bản mock đã bỏ vì LotResponse không có.
export default function LotsTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [nearOnly, setNearOnly] = useState(false);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form] = Form.useForm();
  const { sortableTitle, sortRows } = useColumnSort();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: LOTS_KEY,
    queryFn: lotApi.getAll,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productApi.getAll,
  });

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` }));

  const closeModal = () => {
    setEditing(null);
    setAdding(false);
  };

  const { mutate: saveLot, isPending: isSaving } = useMutation({
    // Update chỉ nhận mfgDate + expDate, không đổi được mã lô và sản phẩm.
    mutationFn: ({ id, values }) => (id ? lotApi.update(id, values) : lotApi.create(values)),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: LOTS_KEY });
      message.success(id ? 'Đã cập nhật lô hàng' : 'Đã thêm lô hàng');
      closeModal();
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = rows.filter((l) => {
      const okKw = !kw || [l.lotCode, l.productName].some((v) => String(v ?? '').toLowerCase().includes(kw));
      const okStatus = !status || l.status === status;
      const okNear = !nearOnly || daysUntil(l.expDate) <= 30;
      return okKw && okStatus && okNear;
    });
    return sortRows(filtered);
  }, [rows, keyword, status, nearOnly, sortRows]);

  const hasActiveFilters = Boolean(keyword || status || nearOnly);
  const clearFilters = () => {
    setKeyword('');
    setStatus(null);
    setNearOnly(false);
  };

  useEffect(() => {
    if (editing) {
      form.setFieldsValue({
        mfgDate: editing.mfgDate ? dayjs(editing.mfgDate) : null,
        expDate: editing.expDate ? dayjs(editing.expDate) : null,
      });
    } else if (adding) {
      form.resetFields();
    }
  }, [editing, adding, form]);

  const handleOk = async () => {
    const v = await form.validateFields();
    const dates = {
      mfgDate: v.mfgDate?.format('YYYY-MM-DD') ?? null,
      expDate: v.expDate.format('YYYY-MM-DD'),
    };
    saveLot({
      id: editing?.id,
      values: editing ? dates : { productId: v.productId, lotCode: v.lotCode, ...dates },
    });
  };

  const columns = [
    { title: 'Mã lô', dataIndex: 'lotCode', width: 150, render: (c) => <DocCode>{c}</DocCode> },
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      render: (name) => <span className="font-medium text-ink">{name}</span>,
    },
    {
      title: 'NSX',
      dataIndex: 'mfgDate',
      align: 'center',
      width: 120,
      render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span>,
    },
    {
      title: sortableTitle('HSD', 'expDate'),
      dataIndex: 'expDate',
      align: 'center',
      width: 170,
      render: (d) => {
        const info = expiryInfo(d);
        return (
          <Tooltip title={info.label}>
            <span className={`inline-flex items-center gap-1.5 mono font-medium ${info.tone}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />
              {formatDate(d)}
            </span>
          </Tooltip>
        );
      },
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
        <Tooltip title="Sửa ngày sản xuất / hạn dùng">
          <Button
            type="text"
            icon={<EditOutlined />}
            disabled={!canManageMasterData}
            onClick={() => setEditing(r)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Sidebar bộ lọc */}
        <FilterSidebar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Tìm theo mã lô, sản phẩm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            className="w-full"
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />
          <Checkbox checked={nearOnly} onChange={(e) => setNearOnly(e.target.checked)}>
            Chỉ cận hạn (≤ 30 ngày)
          </Checkbox>
        </FilterSidebar>

        {/* Danh sách lô hàng */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-sm text-ink-sub">{data.length} lô</span>
            {canManageMasterData && (
              <Tooltip title={products.length ? '' : 'Cần có ít nhất một sản phẩm trước'}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  disabled={!products.length}
                  onClick={() => setAdding(true)}
                >
                  Thêm lô
                </Button>
              </Tooltip>
            )}
          </div>

          <FadeSection dataKey={data.map((l) => l.id).join(',')}>
            <DataTable
              columns={columns}
              dataSource={data}
              loading={isLoading}
              rowClassName={(r) => (daysUntil(r.expDate) < 0 ? '!bg-[#fef2f2]' : '')}
              locale={{ emptyText: <TableEmptyState message="Không tìm thấy lô hàng phù hợp" /> }}
            />
          </FadeSection>
        </div>
      </div>

      <Modal
        open={!!editing || adding}
        title={editing ? `Sửa lô ${editing.lotCode}` : 'Thêm lô hàng'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        cancelText="Huỷ"
        confirmLoading={isSaving}
        onCancel={closeModal}
        onOk={handleOk}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
          {editing ? (
            // Sửa: API chỉ nhận ngày, mã lô và sản phẩm cố định.
            <p className="mb-4 text-sm text-ink-sub">
              Sản phẩm: <span className="font-medium text-ink">{editing.productName}</span>
            </p>
          ) : (
            <>
              <Form.Item name="lotCode" label="Mã lô" rules={[{ required: true, message: 'Nhập mã lô' }]}>
                <Input placeholder="L2406-SG" />
              </Form.Item>
              <Form.Item name="productId" label="Sản phẩm" rules={[{ required: true, message: 'Chọn sản phẩm' }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={productOptions}
                  placeholder="Chọn sản phẩm"
                />
              </Form.Item>
            </>
          )}
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="mfgDate" label="Ngày sản xuất">
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="expDate" label="Hạn sử dụng" rules={[{ required: true, message: 'Chọn HSD' }]}>
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}

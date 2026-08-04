import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Button, Input, Select, Checkbox, Tooltip, Form, Modal, DatePicker, App, Segmented } from 'antd';
import { EditOutlined, PlusOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import DataTable from '@/components/ui/DataTable';
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

function expiryInfo(expDate) {
  const d = daysUntil(expDate);
  if (d < 0) return { tone: 'text-red-600', dot: 'bg-red-500', label: `Quá hạn ${Math.abs(d)} ngày` };
  if (d <= 30) return { tone: 'text-amber-600', dot: 'bg-amber-500', label: `Còn ${d} ngày` };
  return { tone: 'text-slate-600', dot: 'bg-green-500', label: `Còn ${d} ngày` };
}

export default function LotsTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [nearOnly, setNearOnly] = useState(false);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [viewMode, setViewMode] = useState('card');
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
      <div className="flex flex-col gap-4">
        {/* Top Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center gap-4">
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm theo mã lô, sản phẩm..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full sm:w-64"
            />
            <Select
              allowClear
              placeholder="Trạng thái"
              className="w-full sm:w-48"
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
            />
            <Checkbox checked={nearOnly} onChange={(e) => setNearOnly(e.target.checked)}>
              Chỉ cận hạn (≤ 30 ngày)
            </Checkbox>
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Segmented
                options={[
                  { value: 'card', icon: <AppstoreOutlined /> },
                  { value: 'table', icon: <UnorderedListOutlined /> },
                ]}
                value={viewMode}
                onChange={setViewMode}
              />
              <span className="text-sm text-slate-500 font-medium">{data.length} lô</span>
            </div>
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

          <FadeSection dataKey={`${viewMode}-${data.map((l) => l.id).join(',')}`}>
            {viewMode === 'table' ? (
              <DataTable
                columns={columns}
                dataSource={data}
                loading={isLoading}
                rowClassName={(r) => (daysUntil(r.expDate) < 0 ? '!bg-[#fef2f2]' : '')}
                locale={{ emptyText: <TableEmptyState message="Không tìm thấy lô hàng phù hợp" /> }}
              />
            ) : data.length === 0 ? (
              <TableEmptyState message="Không tìm thấy lô hàng phù hợp" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {data.map((l) => {
                  const info = expiryInfo(l.expDate);
                  const isExpired = daysUntil(l.expDate) < 0;
                  return (
                    <div
                      key={l.id}
                      className={`group relative rounded-2xl border bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                        isExpired ? 'border-red-300 bg-red-50/50 shadow-sm' : 'border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 p-1 rounded-xl backdrop-blur-md shadow-sm border border-slate-100">
                        <Tooltip title="Sửa ngày sản xuất / hạn dùng" placement="left">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined className="text-blue-600" />}
                            disabled={!canManageMasterData}
                            onClick={() => setEditing(l)}
                          />
                        </Tooltip>
                      </div>

                      {/* Header Box Icon & Code */}
                      <div className={`p-4 border-b flex items-center gap-4 ${isExpired ? 'border-red-200/60' : 'border-slate-100'}`}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-gradient-to-br ${isExpired ? 'from-red-100 to-red-200 text-red-600 border border-red-300' : 'from-blue-50 to-indigo-100 text-indigo-600 border border-indigo-200'}`}>
                          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-bold text-lg text-slate-800">{l.lotCode}</div>
                          <div className="text-xs font-medium text-slate-500 mt-1 truncate">{l.productName}</div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Trạng thái</span>
                          <StatusPill status={l.status} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-400 font-medium">Ngày sản xuất</span>
                            <span className="font-mono font-semibold text-slate-700">{formatDate(l.mfgDate)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-400 font-medium">Hạn sử dụng</span>
                            <span className="font-mono font-semibold text-slate-700">{formatDate(l.expDate)}</span>
                          </div>
                        </div>
                        
                        <div className={`mt-4 pt-4 border-t flex items-center justify-between ${isExpired ? 'border-red-200' : 'border-slate-100'}`}>
                          <Tooltip title={info.label}>
                            <div className={`inline-flex items-center gap-2 text-xs font-bold px-2.5 py-1 rounded-full bg-white shadow-sm border ${info.tone} ${isExpired ? 'border-red-200' : 'border-slate-200'}`}>
                              <span className={`h-2 w-2 rounded-full ${info.dot}`} />
                              {info.label}
                            </div>
                          </Tooltip>
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

      <Modal centered
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
            <p className="mb-4 text-sm text-slate-500">
              Sản phẩm: <span className="font-bold text-slate-800">{editing.productName}</span>
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

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Tabs, Input, Form, Modal, Select, Tooltip, App, Segmented } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  StopOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import DataTable from '@/components/ui/DataTable';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import { customerApi, supplierApi } from '@/api/partners';
import { getErrorMessage } from '@/utils/getErrorMessage';

const SUPPLIERS_KEY = ['suppliers'];
const CUSTOMERS_KEY = ['customers'];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng hợp tác' },
];

const PHONE_PATTERN = /^[0-9]{8,15}$/;
const orNull = (v) => {
  const s = typeof v === 'string' ? v.trim() : v;
  return s === '' || s === undefined ? null : s;
};

export default function PartnersTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState('suppliers');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [form] = Form.useForm();

  const isSupplier = tab === 'suppliers';

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: SUPPLIERS_KEY,
    queryFn: supplierApi.getAll,
  });

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: CUSTOMERS_KEY,
    queryFn: customerApi.getAll,
  });

  const { mutate: savePartner, isPending: isSaving } = useMutation({
    mutationFn: ({ id, values, supplier }) => {
      const api = supplier ? supplierApi : customerApi;
      return id ? api.update(id, values) : api.create(values);
    },
    onSuccess: (_data, { id, supplier }) => {
      queryClient.invalidateQueries({ queryKey: supplier ? SUPPLIERS_KEY : CUSTOMERS_KEY });
      message.success(id ? 'Đã cập nhật đối tác' : 'Đã thêm đối tác');
      setOpen(false);
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, active, supplier }) => {
      const api = supplier ? supplierApi : customerApi;
      return active ? api.deactivate(id) : api.activate(id);
    },
    onSuccess: (_data, { active, supplier }) => {
      queryClient.invalidateQueries({ queryKey: supplier ? SUPPLIERS_KEY : CUSTOMERS_KEY });
      message.success(active ? 'Đã ngừng hợp tác' : 'Đã kích hoạt lại đối tác');
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const rows = isSupplier ? suppliers : customers;
  const kw = keyword.trim().toLowerCase();
  const data = rows.filter((r) => {
    const okKw = !kw || [r.name, r.code, r.phone].some((v) => String(v ?? '').toLowerCase().includes(kw));
    const okStatus = !status || r.status === status;
    return okKw && okStatus;
  });

  const changeTab = (k) => {
    setTab(k);
    setKeyword('');
    setStatus(null);
  };

  useEffect(() => {
    if (open) form.setFieldsValue(editing ?? {});
  }, [open, editing, form]);

  const handleOk = async () => {
    const v = await form.validateFields();
    const values = isSupplier
      ? {
          code: v.code.trim(),
          name: v.name.trim(),
          taxCode: orNull(v.taxCode),
          contactPerson: orNull(v.contactPerson),
          phone: orNull(v.phone),
          email: orNull(v.email),
          address: orNull(v.address),
          note: orNull(v.note),
        }
      : { name: v.name.trim(), phone: orNull(v.phone), address: orNull(v.address) };

    savePartner({ id: editing?.id, values, supplier: isSupplier });
  };

  const actionCol = {
    title: '',
    key: 'action',
    align: 'center',
    width: 96,
    render: (_, r) => {
      const active = r.status === 'ACTIVE';
      return (
        <div className="flex items-center justify-center">
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              disabled={!canManageMasterData}
              onClick={() => {
                setEditing(r);
                setOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title={active ? 'Ngừng hợp tác' : 'Kích hoạt lại'}>
            <Button
              type="text"
              danger={active}
              icon={active ? <StopOutlined /> : <CheckCircleOutlined />}
              disabled={!canManageMasterData}
              onClick={() => toggleStatus({ id: r.id, active, supplier: isSupplier })}
            />
          </Tooltip>
        </div>
      );
    },
  };

  const statusCol = {
    title: 'Trạng thái',
    dataIndex: 'status',
    align: 'center',
    width: 130,
    render: (s) => <StatusPill status={s} />,
  };

  const supplierColumns = [
    { title: 'Mã', dataIndex: 'code', width: 110, render: (c) => <DocCode muted>{c}</DocCode> },
    { title: 'Nhà cung cấp', dataIndex: 'name', render: (n) => <span className="font-medium text-ink">{n}</span> },
    { title: 'Người liên hệ', dataIndex: 'contactPerson', width: 150, className: '!text-ink-sub' },
    { title: 'Điện thoại', dataIndex: 'phone', width: 140 },
    { title: 'Mã số thuế', dataIndex: 'taxCode', width: 130, render: (t) => <span className="mono text-ink-sub">{t}</span> },
    { title: 'Địa chỉ', dataIndex: 'address', className: '!text-ink-sub', ellipsis: true },
    statusCol,
    actionCol,
  ];

  const customerColumns = [
    { title: 'Khách hàng', dataIndex: 'name', render: (n) => <span className="font-medium text-ink">{n}</span> },
    { title: 'Điện thoại', dataIndex: 'phone', width: 140 },
    { title: 'Địa chỉ', dataIndex: 'address', className: '!text-ink-sub', ellipsis: true },
    statusCol,
    actionCol,
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
              placeholder="Tìm theo tên, mã, điện thoại..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full sm:w-80"
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <Tabs
              activeKey={tab}
              onChange={changeTab}
              items={[
                { key: 'suppliers', label: `Nhà cung cấp (${suppliers.length})` },
                { key: 'customers', label: `Khách hàng (${customers.length})` },
              ]}
              className="!mb-0 [&_.ant-tabs-nav]:!m-0"
            />
            <div className="flex items-center gap-4">
              <Segmented
                options={[
                  { value: 'card', icon: <AppstoreOutlined /> },
                  { value: 'table', icon: <UnorderedListOutlined /> },
                ]}
                value={viewMode}
                onChange={setViewMode}
              />
              {canManageMasterData && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditing(null);
                    setOpen(true);
                  }}
                >
                  {isSupplier ? 'Thêm nhà cung cấp' : 'Thêm khách hàng'}
                </Button>
              )}
            </div>
          </div>

          <FadeSection dataKey={`${tab}-${viewMode}-${data.map((r) => r.id).join(',')}`}>
            {viewMode === 'table' ? (
              <DataTable
                columns={isSupplier ? supplierColumns : customerColumns}
                dataSource={data}
                loading={isSupplier ? loadingSuppliers : loadingCustomers}
                locale={{ emptyText: <TableEmptyState message="Không tìm thấy đối tác phù hợp" /> }}
              />
            ) : data.length === 0 ? (
              <TableEmptyState message="Không tìm thấy đối tác phù hợp" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {data.map((r) => {
                  const active = r.status === 'ACTIVE';
                  return (
                    <div
                      key={r.id}
                      className={`group relative rounded-2xl border bg-white overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                        active ? 'border-slate-200 hover:border-blue-400' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 p-1 rounded-xl backdrop-blur-md shadow-sm border border-slate-100">
                        <Tooltip title="Sửa" placement="left">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined className="text-blue-600" />}
                            disabled={!canManageMasterData}
                            onClick={() => {
                              setEditing(r);
                              setOpen(true);
                            }}
                          />
                        </Tooltip>
                        <Tooltip title={active ? 'Ngừng hợp tác' : 'Kích hoạt lại'} placement="left">
                          <Button
                            type="text"
                            size="small"
                            danger={active}
                            icon={active ? <StopOutlined /> : <CheckCircleOutlined className="text-green-500" />}
                            disabled={!canManageMasterData}
                            onClick={() => toggleStatus({ id: r.id, active, supplier: isSupplier })}
                          />
                        </Tooltip>
                      </div>

                      <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-gradient-to-br ${isSupplier ? 'from-indigo-100 to-blue-200 text-indigo-700' : 'from-orange-100 to-amber-200 text-orange-700'}`}>
                          {isSupplier ? (
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          ) : (
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {isSupplier && <DocCode muted>{r.code}</DocCode>}
                          <div className={`font-bold text-slate-800 truncate mt-1 ${isSupplier ? 'text-base' : 'text-lg'}`}>{r.name}</div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Trạng thái</span>
                          <StatusPill status={r.status} />
                        </div>
                        <div className="flex flex-col gap-3 text-xs">
                          {r.contactPerson && (
                            <div className="flex items-center gap-3 text-slate-600">
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </div>
                              <span className="truncate font-medium">{r.contactPerson}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-slate-600">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </div>
                            <span className="truncate font-medium">{r.phone || '—'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <span className="truncate font-medium leading-relaxed">{r.address || '—'}</span>
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

      <Modal centered
        open={open}
        title={`${editing ? 'Sửa' : 'Thêm'} ${isSupplier ? 'nhà cung cấp' : 'khách hàng'}`}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        cancelText="Huỷ"
        confirmLoading={isSaving}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        width={560}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
          {isSupplier && (
            <Form.Item
              name="code"
              label="Mã nhà cung cấp"
              rules={[
                { required: true, message: 'Nhập mã' },
                { max: 20, message: 'Tối đa 20 ký tự' },
              ]}
            >
              <Input placeholder="NCC-001" />
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label={isSupplier ? 'Tên nhà cung cấp' : 'Tên khách hàng'}
            rules={[
              { required: true, message: 'Nhập tên' },
              { max: 100, message: 'Tối đa 100 ký tự' },
            ]}
          >
            <Input placeholder="Nhập tên đối tác" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              name="phone"
              label="Điện thoại"
              rules={[
                { required: true, message: 'Nhập số điện thoại' },
                { pattern: PHONE_PATTERN, message: 'Chỉ gồm 8–15 chữ số, không khoảng trắng' },
              ]}
            >
              <Input placeholder="0901234567" />
            </Form.Item>
            {isSupplier && (
              <Form.Item name="taxCode" label="Mã số thuế" rules={[{ max: 20, message: 'Tối đa 20 ký tự' }]}>
                <Input placeholder="0300583659" />
              </Form.Item>
            )}
          </div>

          {isSupplier && (
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item name="contactPerson" label="Người liên hệ">
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                <Input placeholder="sales@company.vn" />
              </Form.Item>
            </div>
          )}

          <Form.Item name="address" label="Địa chỉ" rules={[{ max: 255, message: 'Tối đa 255 ký tự' }]}>
            <Input placeholder="Số nhà, đường, quận, thành phố" />
          </Form.Item>

          {isSupplier && (
            <Form.Item name="note" label="Ghi chú" rules={[{ max: 255, message: 'Tối đa 255 ký tự' }]}>
              <Input placeholder="Ghi chú thêm về nhà cung cấp" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}

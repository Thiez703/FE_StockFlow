import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Tabs, Input, Form, Modal, Select, Tooltip, App } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import DataTable from '@/components/ui/DataTable';
import FilterSidebar from '@/components/ui/FilterSidebar';
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

// Backend ràng buộc @Pattern("^[0-9]{8,15}$") — chỉ chữ số, không khoảng trắng.
const PHONE_PATTERN = /^[0-9]{8,15}$/;

// Ô để trống trả về chuỗi rỗng, mà @Pattern/@Size của backend từ chối chuỗi rỗng
// (chỉ bỏ qua null). Chuyển "" -> null trước khi gửi.
const orNull = (v) => {
  const s = typeof v === 'string' ? v.trim() : v;
  return s === '' || s === undefined ? null : s;
};

// SupplierRequest/CustomerRequest không nhận field `status` nên form không có ô
// chọn trạng thái — bật/tắt đi qua nút riêng ở cột thao tác (PATCH activate/deactivate).
// Khách hàng: backend không có `code` và không có loại Sỉ/Lẻ -> đã bỏ 2 cột đó.
export default function PartnersTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState('suppliers');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
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

  const hasActiveFilters = Boolean(keyword || status);
  const clearFilters = () => {
    setKeyword('');
    setStatus(null);
  };

  const changeTab = (k) => {
    setTab(k);
    clearFilters();
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
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Sidebar bộ lọc */}
        <FilterSidebar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Tìm theo tên, mã, điện thoại..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select allowClear placeholder="Trạng thái" className="w-full" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        </FilterSidebar>

        {/* Danh sách đối tác */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs
              activeKey={tab}
              onChange={changeTab}
              items={[
                { key: 'suppliers', label: `Nhà cung cấp (${suppliers.length})` },
                { key: 'customers', label: `Khách hàng (${customers.length})` },
              ]}
              className="!mb-0"
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

          <div className="mb-4">
            <span className="text-sm text-ink-sub">{data.length} đối tác</span>
          </div>

          <FadeSection dataKey={`${tab}-${data.map((r) => r.id).join(',')}`}>
            <DataTable
              columns={isSupplier ? supplierColumns : customerColumns}
              dataSource={data}
              loading={isSupplier ? loadingSuppliers : loadingCustomers}
              locale={{ emptyText: <TableEmptyState message="Không tìm thấy đối tác phù hợp" /> }}
            />
          </FadeSection>
        </div>
      </div>

      <Modal
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

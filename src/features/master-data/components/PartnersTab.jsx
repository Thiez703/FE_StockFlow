import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Tabs, Input, Form, Modal, Select, Tag, Tooltip, App } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import DataTable from '@/components/ui/DataTable';
import FilterSidebar from '@/components/ui/FilterSidebar';
import TableEmptyState from '@/components/ui/TableEmptyState';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import { SUPPLIERS, CUSTOMERS } from '@/mock/partners';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Ngừng hợp tác' },
];
const TYPE_OPTIONS = [
  { value: 'Sỉ', label: 'Sỉ' },
  { value: 'Lẻ', label: 'Lẻ' },
];

export default function PartnersTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const [tab, setTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState(SUPPLIERS);
  const [customers, setCustomers] = useState(CUSTOMERS);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [type, setType] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const isSupplier = tab === 'suppliers';
  const rows = isSupplier ? suppliers : customers;
  const kw = keyword.trim().toLowerCase();
  const data = rows.filter((r) => {
    const okKw = !kw || [r.name, r.code, r.phone].some((v) => String(v).toLowerCase().includes(kw));
    const okStatus = !status || r.status === status;
    const okType = isSupplier || !type || r.type === type;
    return okKw && okStatus && okType;
  });

  const hasActiveFilters = Boolean(keyword || status || (!isSupplier && type));
  const clearFilters = () => {
    setKeyword('');
    setStatus(null);
    setType(null);
  };

  const changeTab = (k) => {
    setTab(k);
    clearFilters();
  };

  useEffect(() => {
    if (open) form.setFieldsValue(editing ?? { status: 'active', type: 'Sỉ' });
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const setRows = isSupplier ? setSuppliers : setCustomers;
    if (editing) {
      setRows((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...values } : r)));
      message.success('Đã cập nhật đối tác');
    } else {
      const prefix = isSupplier ? 'NCC' : 'KH';
      const id = `${prefix}-${String(rows.length + 1).padStart(3, '0')}`;
      setRows((prev) => [{ id, code: id, ...values }, ...prev]);
      message.success('Đã thêm đối tác');
    }
    setOpen(false);
  };

  const actionCol = {
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
            setOpen(true);
          }}
        />
      </Tooltip>
    ),
  };

  const supplierColumns = [
    { title: 'Mã', dataIndex: 'code', width: 110, render: (c) => <DocCode muted>{c}</DocCode> },
    { title: 'Nhà cung cấp', dataIndex: 'name', render: (n) => <span className="font-medium text-ink">{n}</span> },
    { title: 'Điện thoại', dataIndex: 'phone', width: 140 },
    { title: 'Mã số thuế', dataIndex: 'taxCode', width: 130, render: (t) => <span className="mono text-ink-sub">{t}</span> },
    { title: 'Địa chỉ', dataIndex: 'address', className: '!text-ink-sub', ellipsis: true },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', width: 130, render: (s) => <StatusPill status={s} /> },
    actionCol,
  ];

  const customerColumns = [
    { title: 'Mã', dataIndex: 'code', width: 110, render: (c) => <DocCode muted>{c}</DocCode> },
    { title: 'Khách hàng', dataIndex: 'name', render: (n) => <span className="font-medium text-ink">{n}</span> },
    {
      title: 'Loại',
      dataIndex: 'type',
      align: 'center',
      width: 90,
      render: (t) => (
        <Tag bordered={false} color={t === 'Sỉ' ? 'blue' : 'default'}>
          {t}
        </Tag>
      ),
    },
    { title: 'Điện thoại', dataIndex: 'phone', width: 140 },
    { title: 'Địa chỉ', dataIndex: 'address', className: '!text-ink-sub', ellipsis: true },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', width: 130, render: (s) => <StatusPill status={s} /> },
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
          {!isSupplier && (
            <Select allowClear placeholder="Loại khách" className="w-full" options={TYPE_OPTIONS} value={type} onChange={setType} />
          )}
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

          <motion.div
            key={`${tab}-${data.map((r) => r.id).join(',')}`}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DataTable
              columns={isSupplier ? supplierColumns : customerColumns}
              dataSource={data}
              locale={{ emptyText: <TableEmptyState message="Không tìm thấy đối tác phù hợp" /> }}
            />
          </motion.div>
        </div>
      </div>

      <Modal
        open={open}
        title={`${editing ? 'Sửa' : 'Thêm'} ${isSupplier ? 'nhà cung cấp' : 'khách hàng'}`}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        cancelText="Huỷ"
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        width={560}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
          <Form.Item name="name" label={isSupplier ? 'Tên nhà cung cấp' : 'Tên khách hàng'} rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input placeholder="Nhập tên đối tác" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="phone" label="Điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
              <Input placeholder="0901 234 567" />
            </Form.Item>
            {isSupplier ? (
              <Form.Item name="taxCode" label="Mã số thuế">
                <Input placeholder="0300583659" />
              </Form.Item>
            ) : (
              <Form.Item name="type" label="Loại khách">
                <Select options={TYPE_OPTIONS} />
              </Form.Item>
            )}
          </div>
          {isSupplier && (
            <Form.Item name="email" label="Email">
              <Input placeholder="sales@company.vn" />
            </Form.Item>
          )}
          <Form.Item name="address" label="Địa chỉ">
            <Input placeholder="Số nhà, đường, quận, thành phố" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

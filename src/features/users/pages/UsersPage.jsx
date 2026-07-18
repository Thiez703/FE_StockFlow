import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Select, Tag, Avatar, Dropdown, Form, Modal, App } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import { USERS, USER_ROLES } from '@/mock/users';

const ROLE_COLOR = { 'Quản trị': 'red', 'Thủ kho': 'blue', 'Kế toán': 'green', 'Bán hàng': 'gold' };
const initials = (name) => name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase();

export default function UsersPage() {
  const { message, modal } = App.useApp();
  const [rows, setRows] = useState(USERS);
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rows.filter((u) => {
      const okKw = !kw || [u.fullName, u.username, u.email].some((v) => v.toLowerCase().includes(kw));
      const okRole = !role || u.role === role;
      const okStatus = !status || u.status === status;
      return okKw && okRole && okStatus;
    });
  }, [rows, keyword, role, status]);

  useEffect(() => {
    if (open) form.setFieldsValue(editing ?? { role: 'Thủ kho', status: 'active' });
  }, [open, editing, form]);

  const handleOk = async () => {
    const v = await form.validateFields();
    if (editing) {
      setRows((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...v } : u)));
      message.success('Đã cập nhật người dùng');
    } else {
      setRows((prev) => [
        { id: `U-${String(rows.length + 1).padStart(3, '0')}`, lastLogin: '—', ...v },
        ...prev,
      ]);
      message.success('Đã thêm người dùng');
    }
    setOpen(false);
  };

  const toggleLock = (u) => {
    const next = u.status === 'locked' ? 'active' : 'locked';
    setRows((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: next } : x)));
    message.success(next === 'locked' ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản');
  };

  const resetPassword = (u) =>
    modal.confirm({
      title: 'Đặt lại mật khẩu',
      content: `Đặt lại mật khẩu cho "${u.fullName}" về mặc định (123456)?`,
      okText: 'Đặt lại',
      cancelText: 'Huỷ',
      onOk: () => message.success('Đã đặt lại mật khẩu về mặc định'),
    });

  const rowMenu = (u) => ({
    items: [
      { key: 'edit', icon: <EditOutlined />, label: 'Sửa thông tin' },
      {
        key: 'lock',
        icon: u.status === 'locked' ? <UnlockOutlined /> : <LockOutlined />,
        label: u.status === 'locked' ? 'Mở khoá' : 'Khoá tài khoản',
      },
      { key: 'reset', icon: <KeyOutlined />, label: 'Đặt lại mật khẩu' },
    ],
    onClick: ({ key }) => {
      if (key === 'edit') {
        setEditing(u);
        setOpen(true);
      } else if (key === 'lock') toggleLock(u);
      else if (key === 'reset') resetPassword(u);
    },
  });

  const columns = [
    {
      title: 'Người dùng',
      dataIndex: 'fullName',
      render: (name, r) => (
        <div className="flex items-center gap-3">
          <Avatar style={{ background: 'linear-gradient(135deg,#1E5AF0,#0A1E3F)' }}>{initials(name)}</Avatar>
          <div>
            <div className="font-medium text-ink">{name}</div>
            <DocCode muted>@{r.username}</DocCode>
          </div>
        </div>
      ),
    },
    { title: 'Vai trò', dataIndex: 'role', width: 130, render: (r) => <Tag bordered={false} color={ROLE_COLOR[r]}>{r}</Tag> },
    { title: 'Email', dataIndex: 'email', className: '!text-ink-sub' },
    { title: 'Điện thoại', dataIndex: 'phone', width: 140, className: '!text-ink-sub' },
    { title: 'Đăng nhập cuối', dataIndex: 'lastLogin', width: 150, render: (v) => <span className="mono text-ink-sub">{v}</span> },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', width: 120, render: (s) => <StatusPill status={s} /> },
    {
      title: '',
      key: 'action',
      align: 'center',
      width: 56,
      render: (_, r) => (
        <Dropdown menu={rowMenu(r)} trigger={['click']} placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Người dùng"
        subtitle="Quản lý tài khoản và phân quyền hệ thống"
        breadcrumb={[{ title: 'Hệ thống' }, { title: 'Người dùng' }]}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Thêm người dùng
          </Button>
        }
      />

      <FilterBar extra={<span className="text-sm text-ink-sub">{data.length} tài khoản</span>}>
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm tên, username, email..."
          className="w-full sm:w-64"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select allowClear placeholder="Vai trò" className="w-full sm:w-40" options={USER_ROLES.map((r) => ({ value: r, label: r }))} value={role} onChange={setRole} />
        <Select
          allowClear
          placeholder="Trạng thái"
          className="w-full sm:w-40"
          options={[{ value: 'active', label: 'Hoạt động' }, { value: 'locked', label: 'Đã khoá' }]}
          value={status}
          onChange={setStatus}
        />
      </FilterBar>

      <DataTable columns={columns} dataSource={data} />

      <Modal
        open={open}
        title={editing ? 'Sửa người dùng' : 'Thêm người dùng'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        cancelText="Huỷ"
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        width={560}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Nhập họ tên' }]} className="col-span-2">
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>
            <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Nhập username' }]}>
              <Input placeholder="a.nguyen" />
            </Form.Item>
            <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
              <Select options={USER_ROLES.map((r) => ({ value: r, label: r }))} />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
              <Input placeholder="a@stockflow.vn" />
            </Form.Item>
            <Form.Item name="phone" label="Điện thoại">
              <Input placeholder="0901 234 567" />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" className="col-span-2">
              <Select options={[{ value: 'active', label: 'Hoạt động' }, { value: 'locked', label: 'Đã khoá' }]} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}

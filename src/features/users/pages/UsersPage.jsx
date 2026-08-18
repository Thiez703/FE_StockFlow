import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Select, Tag, Avatar, Dropdown, Form, Modal, App } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import AccessDenied from '@/components/feedback/AccessDenied';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import TableEmptyState from '@/components/ui/TableEmptyState';
import StatusPill from '@/components/ui/StatusPill';
import FadeSection from '@/components/ui/FadeSection';
import { userApi } from '@/api/users';
import { ROLE_COLOR, ROLE_LABEL, ROLE_OPTIONS } from '@/constants/roles';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatDateTime } from '@/utils/date';

const USERS_KEY = ['users'];
const PAGE_SIZE = 8;


// Backend lọc/phân trang phía server nên mọi bộ lọc đều nằm trong queryKey.
export default function UsersPage() {
  const { message, modal } = App.useApp();
  const { canManageUsers } = usePermissions();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState(null);
  const [isActive, setIsActive] = useState(null);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [form] = Form.useForm();
  const [roleForm] = Form.useForm();

  const debouncedKeyword = useDebouncedValue(keyword);

  // Đổi bộ lọc thì phải về trang 1, không thì có thể rơi vào trang trống.
  const setFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const filters = {
    keyword: debouncedKeyword.trim() || undefined,
    role: role ?? undefined,
    isActive: isActive ?? undefined,
    page: page - 1, // Spring đánh số trang từ 0, AntD từ 1.
    size: PAGE_SIZE,
    sort: 'createdAt,desc',
  };

  const { data, isFetching } = useQuery({
    queryKey: [...USERS_KEY, filters],
    queryFn: () => userApi.search(filters),
    // Giữ dữ liệu trang cũ trong lúc tải trang mới để bảng không nháy trắng.
    placeholderData: keepPreviousData,
    // Không phải ADMIN thì trang trả AccessDenied, khỏi bắn request chắc chắn 403.
    enabled: canManageUsers,
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: USERS_KEY });
  const onError = (error) => message.error(getErrorMessage(error));

  const { mutate: saveUser, isPending: isSaving } = useMutation({
    // Tạo mới nhận { fullName, email, role, phone }; sửa chỉ nhận { fullName, phone }
    // — email không đổi được, vai trò đi qua assignRole.
    mutationFn: ({ id, values }) => (id ? userApi.update(id, values) : userApi.create(values)),
    onSuccess: (_data, { id }) => {
      invalidate();
      message.success(
        id ? 'Đã cập nhật người dùng' : 'Đã tạo tài khoản, mật khẩu đã gửi qua email',
      );
      setOpen(false);
    },
    onError,
  });

  const { mutate: changeRole, isPending: isChangingRole } = useMutation({
    mutationFn: ({ id, role: next }) => userApi.assignRole(id, next),
    onSuccess: () => {
      invalidate();
      message.success('Đã đổi vai trò');
      setRoleTarget(null);
    },
    onError,
  });

  const { mutate: toggleLock } = useMutation({
    mutationFn: ({ id, active }) => (active ? userApi.lock(id) : userApi.unlock(id)),
    onSuccess: (_data, { active }) => {
      invalidate();
      message.success(active ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản');
    },
    onError,
  });

  const { mutate: resetPassword } = useMutation({
    mutationFn: (id) => userApi.resetPassword(id),
    onSuccess: () => {
      invalidate();
      message.success('Đã gửi mật khẩu mới qua email');
    },
    onError,
  });

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      editing
        ? { fullName: editing.fullName, phone: editing.phone }
        : { fullName: '', email: '', role: 'STAFF', phone: '' },
    );
  }, [open, editing, form]);

  useEffect(() => {
    if (roleTarget) roleForm.setFieldsValue({ role: roleTarget.role });
  }, [roleTarget, roleForm]);

  const handleOk = async () => {
    const v = await form.validateFields();
    const values = editing
      ? { fullName: v.fullName.trim(), phone: v.phone?.trim() || null }
      : {
          fullName: v.fullName.trim(),
          email: v.email.trim(),
          role: v.role,
          phone: v.phone?.trim() || null,
        };
    saveUser({ id: editing?.id, values });
  };

  const confirmReset = (u) =>
    modal.confirm({
      title: 'Đặt lại mật khẩu',
      content: `Sinh mật khẩu mới cho "${u.fullName}" và gửi tới ${u.email}? Người dùng sẽ phải đổi mật khẩu ở lần đăng nhập kế tiếp.`,
      okText: 'Đặt lại',
      cancelText: 'Huỷ',
      onOk: () => resetPassword(u.id),
    });

  const rowMenu = (u) => ({
    items: [
      { key: 'edit', icon: <EditOutlined />, label: 'Sửa thông tin' },
      { key: 'role', icon: <SafetyCertificateOutlined />, label: 'Đổi vai trò' },
      {
        key: 'lock',
        icon: u.active ? <LockOutlined /> : <UnlockOutlined />,
        label: u.active ? 'Khoá tài khoản' : 'Mở khoá',
        danger: u.active,
      },
      { key: 'reset', icon: <KeyOutlined />, label: 'Đặt lại mật khẩu' },
    ],
    onClick: ({ key }) => {
      if (key === 'edit') {
        setEditing(u);
        setOpen(true);
      } else if (key === 'role') setRoleTarget(u);
      else if (key === 'lock') toggleLock({ id: u.id, active: u.active });
      else if (key === 'reset') confirmReset(u);
    },
  });

  const columns = [
    {
      title: 'Người dùng',
      dataIndex: 'fullName',
      render: (name, r) => (
        <div className="flex items-center gap-3">
          <Avatar 
            style={{ backgroundColor: '#E4E6EB', color: '#B0B3B8' }} 
            icon={<UserOutlined />} 
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink">{name}</span>
              {r.mustChangePassword && (
                <Tag bordered={false} color="orange" className="!m-0">
                  Chờ đổi mật khẩu
                </Tag>
              )}
            </div>
            <div className="truncate text-xs text-ink-sub">{r.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      width: 140,
      render: (r) => (
        <Tag bordered={false} color={ROLE_COLOR[r]}>
          {ROLE_LABEL[r] ?? r}
        </Tag>
      ),
    },
    {
      title: 'Điện thoại',
      dataIndex: 'phone',
      width: 140,
      className: '!text-ink-sub',
      render: (p) => p || '—',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 160,
      render: (v) => <span className="mono text-ink-sub">{formatDateTime(v)}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      align: 'center',
      width: 120,
      // Backend trả boolean `active`, không phải mã trạng thái như các module khác.
      render: (active) => <StatusPill status={active ? 'ACTIVE' : 'locked'} />,
    },
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

  // FIX 5d — chỉ ADMIN mới xem được trang người dùng.
  if (!canManageUsers) return <AccessDenied />;

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

      <FilterBar extra={<span className="text-sm text-ink-sub">{total} tài khoản</span>}>
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm tên, email..."
          className="w-full sm:w-64"
          value={keyword}
          onChange={(e) => setFilter(setKeyword, e.target.value)}
        />
        <Select
          allowClear
          placeholder="Vai trò"
          className="w-full sm:w-40"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(v) => setFilter(setRole, v)}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          className="w-full sm:w-40"
          options={[
            { value: true, label: 'Hoạt động' },
            { value: false, label: 'Đã khoá' },
          ]}
          value={isActive}
          onChange={(v) => setFilter(setIsActive, v)}
        />
      </FilterBar>

      <FadeSection dataKey={rows.map((u) => u.id).join(',')}>
        <DataTable
          columns={columns}
          dataSource={rows}
          loading={isFetching}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            onChange: setPage,
          }}
          locale={{ emptyText: <TableEmptyState message="Không tìm thấy tài khoản phù hợp" /> }}
        />
      </FadeSection>

      <Modal centered
        open={open}
        title={editing ? 'Sửa người dùng' : 'Thêm người dùng'}
        okText={editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}
        cancelText="Huỷ"
        confirmLoading={isSaving}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        width={560}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[{ required: true, message: 'Nhập họ tên' }]}
              className="col-span-2"
            >
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>

            {/* Email và vai trò chỉ đặt được lúc tạo: UpdateUserRequest không nhận
                email, còn vai trò đổi bằng thao tác "Đổi vai trò" riêng. */}
            {!editing && (
              <>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' },
                  ]}
                >
                  <Input placeholder="a@stockflow.vn" />
                </Form.Item>
                <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
                  <Select options={ROLE_OPTIONS} />
                </Form.Item>
              </>
            )}

            <Form.Item name="phone" label="Điện thoại" className={editing ? 'col-span-2' : ''}>
              <Input placeholder="0901234567" />
            </Form.Item>
          </div>

          {!editing && (
            <p className="m-0 rounded-lg bg-slate-50 px-3 py-2 text-xs text-ink-sub">
              Mật khẩu được hệ thống sinh tự động và gửi tới email trên. Người dùng phải đổi mật
              khẩu ở lần đăng nhập đầu tiên.
            </p>
          )}
        </Form>
      </Modal>

      <Modal centered
        open={!!roleTarget}
        title={`Đổi vai trò — ${roleTarget?.fullName ?? ''}`}
        okText="Lưu"
        cancelText="Huỷ"
        confirmLoading={isChangingRole}
        onCancel={() => setRoleTarget(null)}
        onOk={async () => {
          const v = await roleForm.validateFields();
          changeRole({ id: roleTarget.id, role: v.role });
        }}
        destroyOnHidden
      >
        <Form form={roleForm} layout="vertical" requiredMark={false} className="mt-2">
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

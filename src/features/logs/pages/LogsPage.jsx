import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Select, Tag } from 'antd';
import DateRangeSelectGroup from '@/components/ui/DateRangeSelectGroup';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import AccessDenied from '@/components/feedback/AccessDenied';
import { usePermissions } from '@/hooks/usePermissions';
import { auditLogApi } from '@/api/auditLogs';
import { userApi } from '@/api/users';
import {
  AUDIT_ACTION_COLOR,
  AUDIT_ACTION_LABEL,
  AUDIT_ACTION_OPTIONS,
  ENTITY_TYPE_LABEL,
} from '@/constants/auditActions';
import { formatDateTime } from '@/utils/date';

const LOGS_KEY = ['audit-logs'];
const PAGE_SIZE = 10;

// Backend chỉ lọc theo userId / action / khoảng thời gian — không có tìm theo từ
// khoá, nên ô search tự do của bản mock được thay bằng ô chọn người dùng.
// Bảng cũng không còn cột IP: AuditLogResponse không ghi địa chỉ IP.
export default function LogsPage() {
  const { canViewLogs } = usePermissions();

  const [userId, setUserId] = useState(null);
  const [action, setAction] = useState(null);
  const [range, setRange] = useState([dayjs().subtract(1, 'month'), dayjs()]);
  const [page, setPage] = useState(1);

  // Đổi bộ lọc thì phải về trang 1, không thì có thể rơi vào trang trống.
  const setFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const [from, to] = range ?? [];
  const filters = {
    userId: userId ?? undefined,
    action: action ?? undefined,
    // LocalDateTime của backend không nhận hậu tố múi giờ.
    from: from ? from.startOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined,
    to: to ? to.endOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined,
    page: page - 1, // Spring đánh số trang từ 0, AntD từ 1.
    size: PAGE_SIZE,
    sort: 'createdAt,desc',
  };

  const { data, isFetching } = useQuery({
    queryKey: [...LOGS_KEY, filters],
    queryFn: () => auditLogApi.search(filters),
    placeholderData: keepPreviousData,
    enabled: canViewLogs,
  });

  // Trang nhật ký và API người dùng đều giới hạn ADMIN nên lấy được danh sách
  // đầy đủ để đổ vào ô lọc.
  const { data: userPage } = useQuery({
    queryKey: ['users', 'all-for-filter'],
    queryFn: () => userApi.search({ page: 0, size: 200, sort: 'fullName,asc' }),
    enabled: canViewLogs,
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const userOptions = (userPage?.content ?? []).map((u) => ({
    value: u.id,
    label: `${u.fullName} (${u.email})`,
  }));

  // FIX 5e — chỉ ADMIN mới xem được nhật ký.
  if (!canViewLogs) return <AccessDenied />;

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      width: 170,
      render: (t) => <span className="mono text-ink-sub">{formatDateTime(t)}</span>,
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'actorFullName',
      width: 220,
      render: (name, r) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{name ?? '—'}</div>
          <div className="truncate text-xs text-ink-sub">{r.actorEmail}</div>
        </div>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      width: 180,
      render: (a) => (
        <Tag bordered={false} color={AUDIT_ACTION_COLOR[a]}>
          {AUDIT_ACTION_LABEL[a] ?? a}
        </Tag>
      ),
    },
    {
      title: 'Đối tượng',
      dataIndex: 'entityType',
      width: 160,
      render: (type) => (
        <span className="text-ink">
          {ENTITY_TYPE_LABEL[type] ?? type}
        </span>
      ),
    },
    {
      title: 'Chi tiết',
      dataIndex: 'detail',
      render: (d, r) => {
        if (r.action?.startsWith('API_')) {
          const actionName = r.action === 'API_POST' ? 'Tạo mới' : (r.action === 'API_DELETE' ? 'Xóa' : 'Cập nhật');
          const entityName = ENTITY_TYPE_LABEL[r.entityType] || r.entityType;
          return <span className="text-ink-sub">{`${actionName} ${entityName.toLowerCase()}`}</span>;
        }
        return <span className="text-ink-sub">{d || '—'}</span>;
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Nhật ký hoạt động"
        subtitle="Lịch sử thao tác của người dùng trên hệ thống"
        breadcrumb={[{ title: 'Hệ thống' }, { title: 'Nhật ký hoạt động' }]}
      />

      <FilterBar extra={<span className="text-sm text-ink-sub">{total} bản ghi</span>}>
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Người thực hiện"
          className="w-full sm:w-64"
          options={userOptions}
          value={userId}
          onChange={(v) => setFilter(setUserId, v)}
        />
        <Select
          allowClear
          placeholder="Hành động"
          className="w-full sm:w-52"
          options={AUDIT_ACTION_OPTIONS}
          value={action}
          onChange={(v) => setFilter(setAction, v)}
        />
        <DateRangeSelectGroup
          className="w-full sm:w-auto"
          value={range}
          onChange={(v) => setFilter(setRange, v)}
        />
      </FilterBar>

      <FadeSection dataKey={rows.map((l) => l.id).join(',')}>
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
          locale={{ emptyText: <TableEmptyState message="Chưa có nhật ký nào khớp bộ lọc" /> }}
        />
      </FadeSection>
    </>
  );
}

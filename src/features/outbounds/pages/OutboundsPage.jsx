import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Input, Select, DatePicker, Tag, Tooltip, Modal, App, Dropdown } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  DownOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import VoucherPreviewModal from '@/components/ui/VoucherPreviewModal';
import { toOutboundRecord } from '@/features/outbounds/utils/mapOutbound';
import {
  ISSUE_TYPES,
  ISSUE_TYPE_OPTIONS,
  OUTBOUND_STATUSES,
  issueTypeLabel,
} from '@/features/outbounds/constants/issueTypes';
import { outboundApi } from '@/api/outbounds';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { statusOptions } from '@/constants/status';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';
import { toVoucher } from '@/utils/voucher';

import DateRangeSelectGroup from '@/components/ui/DateRangeSelectGroup';
import dayjs from 'dayjs';

const OUTBOUNDS_KEY = ['outbounds', DEFAULT_WAREHOUSE_ID];

const CREATE_MENU_ITEMS = [
  { key: 'RETAIL', label: 'Tạo phiếu xuất bán (khách hàng)' },
  { key: 'RETURN_SUPPLIER', label: 'Tạo phiếu trả NCC' },
  { key: 'DISPOSAL', label: 'Tạo phiếu xuất hủy / hư hỏng' },
];

export default function OutboundsPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canCreateOutbound, canVoidOutbound } = usePermissions();

  const [keyword, setKeyword] = useState('');
  const [issueType, setIssueType] = useState(null);
  const [status, setStatus] = useState(null);
  const [range, setRange] = useState([dayjs().subtract(1, 'month'), dayjs()]);
  const [page, setPage] = useState(1);
  const [voidingId, setVoidingId] = useState(null);
  const [voidPrefix, setVoidPrefix] = useState('Sai thông tin');
  const [voidDetail, setVoidDetail] = useState('');
  // Giữ id thay vì cả bản ghi để tờ phiếu đang mở tự cập nhật trạng thái sau khi
  // huỷ (danh sách được tải lại).
  const [detailId, setDetailId] = useState(null);
  const { sortableTitle, sortRows } = useColumnSort();

  // Backend bắt buộc lọc theo kho và chưa hỗ trợ tìm kiếm / phân trang (nhưng trả về Page), 
  // nên ta lấy pageSize lớn và filter tại FE.
  const { data: pageData, isLoading, isError, error } = useQuery({
    queryKey: OUTBOUNDS_KEY,
    queryFn: () => outboundApi.getAll(DEFAULT_WAREHOUSE_ID, { page: 0, size: 500 }),
  });

  const rows = useMemo(() => {
    let raw = [];
    if (Array.isArray(pageData)) raw = pageData;
    else if (pageData?.content && Array.isArray(pageData.content)) raw = pageData.content;
    else if (pageData?.data && Array.isArray(pageData.data)) raw = pageData.data;
    return raw.map(toOutboundRecord);
  }, [pageData]);

  const PAGE_SIZE = 8;

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const from = range?.[0]?.startOf('day').valueOf();
    const to = range?.[1]?.endOf('day').valueOf();

    const filtered = rows.filter((r) => {
      const okKw =
        !kw || [r.code, r.partnerName].some((v) => String(v ?? '').toLowerCase().includes(kw));
      const okType = !issueType || r.issueType === issueType;
      const okStatus = !status || r.status === status;
      const at = r.date ? new Date(r.date).getTime() : null;
      const okDate = from == null || (at != null && at >= from && at <= to);
      return okKw && okType && okStatus && okDate;
    });
    // Reset trang khi filter thay đổi làm giảm số lượng kết quả
    setPage(1);
    return sortRows(filtered);
  }, [rows, keyword, issueType, status, range, sortRows]);

  const detailRecord = useMemo(() => rows.find((r) => r.id === detailId) ?? null, [rows, detailId]);
  const detailVoucher = useMemo(() => toVoucher('outbound', detailRecord), [detailRecord]);

  const { mutate: voidOutbound, isPending: isVoiding } = useMutation({
    mutationFn: ({ id, reason: r }) => outboundApi.void(id, r),
    onSuccess: () => {
      // Endpoint huỷ không trả lại phiếu nên phải tải lại danh sách.
      queryClient.invalidateQueries({ queryKey: OUTBOUNDS_KEY });
      message.success('Đã huỷ phiếu xuất, tồn kho được hoàn lại');
      setVoidingId(null);
      setVoidDetail('');
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const confirmVoid = () => {
    const value = voidDetail.trim();
    if (!value) {
      message.error('Cần nhập giải thích chi tiết.');
      return;
    }
    const finalReason = `[${voidPrefix}] ${value}`;
    voidOutbound({ id: voidingId, reason: finalReason });
  };

  const handleCreateClick = ({ key }) => {
    navigate(`/outbounds/create/${key.toLowerCase()}`);
  };

  const statusCell = (s, record) =>
    record.voidReason ? (
      <Tooltip title={`Lý do huỷ: ${record.voidReason}`}>
        <span>
          <StatusPill status={s} />
        </span>
      </Tooltip>
    ) : (
      <StatusPill status={s} />
    );

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'code', render: (c) => <DocCode>{c}</DocCode> },
    {
      title: 'Loại xuất',
      dataIndex: 'issueType',
      align: 'center',
      responsive: ['md'],
      render: (t) => (
        <Tag bordered={false} color={ISSUE_TYPES[t]?.color ?? 'default'}>
          {issueTypeLabel(t)}
        </Tag>
      ),
    },
    {
      title: 'Đối tác / Nơi nhận',
      dataIndex: 'partnerName',
      ellipsis: true,
      render: (n) => <span className="font-medium text-ink">{n}</span>,
    },
    {
      title: sortableTitle('Ngày xuất', 'date'),
      dataIndex: 'date',
      align: 'center',
      responsive: ['md'],
      render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span>,
    },
    { title: 'Số dòng', dataIndex: 'items', align: 'center', responsive: ['lg'], render: (items) => items.length },
    {
      title: sortableTitle('Tổng tiền', 'total'),
      dataIndex: 'total',
      align: 'right',
      responsive: ['md'],
      render: (v) => <span className="font-semibold text-ink">{formatCurrency(v)}</span>,
    },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', responsive: ['sm'], render: statusCell },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center',
      width: 100,
      render: (_, r) => (
        <div className="flex items-center justify-center gap-1.5">
          <Tooltip title="Xem phiếu">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailId(r.id)} />
          </Tooltip>
          {canVoidOutbound && r.status !== 'VOIDED' && (
            <Tooltip title="Huỷ phiếu">
              <Button size="small" type="text" danger icon={<StopOutlined />} onClick={() => setVoidingId(r.id)} />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            Phiếu xuất
            {!canCreateOutbound && <Tag color="default">Chỉ xem</Tag>}
          </span>
        }
        subtitle="Danh sách phiếu xuất kho: xuất bán, trả NCC, xuất hủy"
        breadcrumb={[{ title: 'Nghiệp vụ kho' }, { title: 'Phiếu xuất' }]}
        extra={
          canCreateOutbound && (
            <Dropdown menu={{ items: CREATE_MENU_ITEMS, onClick: handleCreateClick }}>
              <Button type="primary" icon={<PlusOutlined />}>
                Lập phiếu xuất <DownOutlined />
              </Button>
            </Dropdown>
          )
        }
      />

      {isError && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message="Không tải được danh sách phiếu xuất"
          description={getErrorMessage(error)}
        />
      )}

      <FilterBar
        extra={
            <span className="text-sm text-ink-sub">{data.length} phiếu</span>
        }
      >
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm mã phiếu, đối tác..."
          className="w-full sm:w-64"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select
          allowClear
          placeholder="Loại xuất"
          className="w-full sm:w-40"
          options={ISSUE_TYPE_OPTIONS}
          value={issueType}
          onChange={setIssueType}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          className="w-full sm:w-40"
          options={statusOptions(OUTBOUND_STATUSES)}
          value={status}
          onChange={setStatus}
        />
        <DateRangeSelectGroup
          className="w-full sm:w-auto"
          value={range}
          onChange={(dates) => setRange(dates?.[0] || dates?.[1] ? dates : null)}
        />
      </FilterBar>

      <FadeSection dataKey={`table:${data.map((r) => r.id).join(',')}`}>
        <DataTable
          columns={columns}
          dataSource={data}
          loading={isLoading || isVoiding}
          rowClassName={(r) => (r.status === 'VOIDED' ? 'opacity-50' : '')}
          locale={{ emptyText: <TableEmptyState message="Không tìm thấy phiếu xuất phù hợp" /> }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: data.length,
            onChange: (p) => setPage(p),
          }}
        />
      </FadeSection>

      <Modal
        centered
        open={!!voidingId}
        title="Huỷ phiếu xuất"
        okText="Xác nhận huỷ"
        okButtonProps={{ danger: true }}
        cancelText="Đóng"
        confirmLoading={isVoiding}
        onCancel={() => {
          setVoidingId(null);
          setVoidDetail('');
          setVoidPrefix('Sai thông tin');
        }}
        onOk={confirmVoid}
        destroyOnHidden
      >
        <p className="mt-1 mb-3 text-sm text-ink-sub">
          Phiếu đã ghi sổ không sửa được. Huỷ phiếu sẽ hoàn tồn kho về vị trí cũ và ghi một dòng đảo
          vào thẻ kho. Người huỷ phải khác người lập phiếu.
        </p>
        <div className="flex flex-col gap-2">
          <Select
            value={voidPrefix}
            onChange={setVoidPrefix}
            options={[
              { value: 'Sai thông tin', label: 'Sai thông tin' },
              { value: 'Sai số lượng', label: 'Sai số lượng' },
              { value: 'Khách huỷ đơn', label: 'Khách huỷ đơn' },
              { value: 'Lý do khác', label: 'Lý do khác' },
            ]}
          />
          <Input.TextArea
            rows={3}
            placeholder="Giải thích chi tiết (VD: Gõ sai số lượng xuất...)"
            value={voidDetail}
            onChange={(e) => setVoidDetail(e.target.value)}
          />
        </div>
      </Modal>

      <VoucherPreviewModal
        open={!!detailRecord}
        voucher={detailVoucher}
        onClose={() => setDetailId(null)}
        actions={
          <>
            {detailRecord?.voidReason && (
              <span className="mr-auto text-sm text-[#b91c1c]">
                Lý do huỷ: {detailRecord.voidReason}
              </span>
            )}
            {canVoidOutbound && detailRecord?.status !== 'VOIDED' && (
              <Button danger icon={<StopOutlined />} onClick={() => setVoidingId(detailRecord.id)}>
                Huỷ phiếu
              </Button>
            )}
          </>
        }
      />
    </>
  );
}

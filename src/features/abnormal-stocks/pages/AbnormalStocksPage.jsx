import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Input, Select, Tag, Tooltip, App, Popconfirm, Modal } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import ApprovalActions from '@/components/ui/ApprovalActions';
import VoucherPreviewModal from '@/components/ui/VoucherPreviewModal';
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import { toAbnormalRecord } from '@/features/abnormal-stocks/utils/mapAbnormalStock';
import { REASON_TYPES, REASON_OPTIONS } from '@/features/abnormal-stocks/constants/reasonTypes';
import { abnormalStockApi } from '@/api/abnormalStocks';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { statusOptions, APPROVAL_STATUSES } from '@/constants/status';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatNumber } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';
import { toVoucher } from '@/utils/voucher';

const ABNORMAL_KEY = ['abnormal-stocks', DEFAULT_WAREHOUSE_ID];

export default function AbnormalStocksPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canCreateAbnormal, canApproveDocs, user } = usePermissions();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [reasonType, setReasonType] = useState(null);
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const { sortableTitle, sortRows } = useColumnSort();

  // Backend bắt buộc lọc theo kho và chưa hỗ trợ tìm kiếm / phân trang (nhưng trả về Page),
  // nên lọc theo từ khoá, trạng thái và loại bất thường được làm tại FE.
  const { data: pageData, isLoading, isError, error } = useQuery({
    queryKey: ABNORMAL_KEY,
    queryFn: () => abnormalStockApi.getAll(DEFAULT_WAREHOUSE_ID, { page: 0, size: 500 }),
  });

  const rows = useMemo(() => {
    let raw = [];
    if (Array.isArray(pageData)) raw = pageData;
    else if (pageData?.content && Array.isArray(pageData.content)) raw = pageData.content;
    else if (pageData?.data && Array.isArray(pageData.data)) raw = pageData.data;
    return raw.map(toAbnormalRecord);
  }, [pageData]);

  const PAGE_SIZE = 8;

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      const okKw =
        !kw ||
        String(r.code ?? '').toLowerCase().includes(kw) ||
        r.items.some((it) => String(it.productName ?? '').toLowerCase().includes(kw));
      const okStatus = !status || r.status === status;
      const okReason = !reasonType || r.items.some((it) => it.reasonType === reasonType);
      return okKw && okStatus && okReason;
    });
    setPage(1);
    return sortRows(filtered);
  }, [rows, keyword, status, reasonType, sortRows]);

  const onDecided = (label) => {
    queryClient.invalidateQueries({ queryKey: ABNORMAL_KEY });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'storage-map'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-snapshot'] });
    message.success(label);
  };

  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: abnormalStockApi.approve,
    onSuccess: () => onDecided('Đã duyệt biên bản hàng bất thường'),
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const { mutate: reject, isPending: isRejecting } = useMutation({
    mutationFn: ({ id, reason }) => abnormalStockApi.reject(id, reason),
    onSuccess: () => onDecided('Đã từ chối biên bản hàng bất thường'),
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const submitReject = () => {
    const reason = rejectReason.trim();
    if (!reason) {
      message.error('Cần nhập lý do từ chối.');
      return;
    }
    reject({ id: rejecting.id, reason });
    setRejecting(null);
    setRejectReason('');
  };

  // Giữ id thay vì cả bản ghi để tờ biên bản đang mở tự cập nhật trạng thái
  // sau khi duyệt / từ chối (danh sách được tải lại).
  const detailRecord = useMemo(() => rows.find((r) => r.id === detailId) ?? null, [rows, detailId]);
  const detailVoucher = useMemo(() => toVoucher('abnormal', detailRecord), [detailRecord]);

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'code', render: (c) => <DocCode>{c}</DocCode> },
    {
      title: sortableTitle('Ngày lập', 'date'),
      dataIndex: 'date',
      align: 'center',
      responsive: ['md'],
      render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span>,
    },
    {
      title: 'Loại bất thường',
      key: 'reasons',
      render: (_, r) => (
        <div className="flex flex-wrap gap-1">
          {[...new Set(r.items.map((it) => it.reasonType))].map((code) => (
            <span
              key={code}
              className={`rounded-md border px-2 py-0.5 text-xs font-medium ${REASON_TYPES[code]?.bg ?? ''} ${
                REASON_TYPES[code]?.tone ?? ''
              }`}
            >
              {REASON_TYPES[code]?.label ?? code}
            </span>
          ))}
        </div>
      ),
    },
    { title: 'Số dòng', dataIndex: 'items', align: 'center', responsive: ['lg'], render: (items) => items.length },
    {
      title: sortableTitle('Tổng SL', 'totalQty'),
      dataIndex: 'totalQty',
      align: 'right',
      responsive: ['sm'],
      render: (v) => <span className="mono font-semibold text-[#b91c1c]">{formatNumber(v)}</span>,
    },
    {
      title: 'Người lập',
      dataIndex: 'createdBy',
      ellipsis: true,
      render: (v) => <span className="font-medium text-ink-sub">{v}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      responsive: ['sm'],
      render: (s, r) =>
        r.rejectReason ? (
          <Tooltip title={`Lý do từ chối: ${r.rejectReason}`}>
            <span>
              <StatusPill status={s} />
            </span>
          </Tooltip>
        ) : (
          <StatusPill status={s} />
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center',
      width: 110,
      render: (_, r) => (
        <div className="flex items-center justify-center gap-1.5">
          <Tooltip title="Xem biên bản">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailId(r.id)} />
          </Tooltip>
          {canApproveDocs && r.createdBy !== user?.fullName && (
            <ApprovalActions
              record={r}
              onApprove={(id) => approve(id)}
              onReject={(id, reason) => {
                if (!reason?.trim()) {
                  message.error('Cần nhập lý do từ chối.');
                  return;
                }
                reject({ id, reason: reason.trim() });
              }}
            />
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
            Hàng bất thường
            {!canCreateAbnormal && <Tag color="default">Chỉ xem</Tag>}
          </span>
        }
        subtitle="Ghi nhận hàng hư hỏng, mất, hết hạn tại từng vị trí và trình duyệt"
        breadcrumb={[{ title: 'Kiểm soát' }, { title: 'Hàng bất thường' }]}
        extra={
          canCreateAbnormal && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/abnormal-stocks/create')}>
              Lập biên bản
            </Button>
          )
        }
      />

      {isError && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message="Không tải được danh sách biên bản hàng bất thường"
          description={getErrorMessage(error)}
        />
      )}

      <FilterBar
        extra={
            <span className="text-sm text-ink-sub">{data.length} biên bản</span>
        }
      >
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm mã phiếu, sản phẩm..."
          className="w-full sm:w-64"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select
          allowClear
          placeholder="Loại bất thường"
          className="w-full sm:w-44"
          options={REASON_OPTIONS}
          value={reasonType}
          onChange={setReasonType}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          className="w-full sm:w-44"
          options={statusOptions(APPROVAL_STATUSES)}
          value={status}
          onChange={setStatus}
        />
      </FilterBar>

      <FadeSection dataKey={`table:${data.map((r) => r.id).join(',')}`}>
        <DataTable
          columns={columns}
          dataSource={data}
          loading={isLoading || isApproving || isRejecting}
          locale={{ emptyText: <TableEmptyState message="Không tìm thấy biên bản phù hợp" /> }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: data.length,
            onChange: (p) => setPage(p),
          }}
        />
      </FadeSection>

      <VoucherPreviewModal
        open={!!detailRecord}
        voucher={detailVoucher}
        onClose={() => setDetailId(null)}
        actions={
          <>
            {detailRecord?.rejectReason && (
              <span className="mr-auto text-sm text-[#b91c1c]">
                Lý do từ chối: {detailRecord.rejectReason}
              </span>
            )}
            {canApproveDocs && detailRecord?.status === 'PENDING' && detailRecord?.createdBy !== user?.fullName && (
              <>
                <Popconfirm
                  title="Duyệt biên bản?"
                  description="Duyệt xong tồn kho sẽ được trừ theo số lượng bất thường."
                  onConfirm={() => approve(detailRecord.id)}
                  okText="Duyệt"
                  cancelText="Hủy"
                >
                  <Button
                    type="primary"
                    className="bg-emerald-600 hover:bg-emerald-500 border-none"
                    icon={<CheckOutlined />}
                  >
                    Duyệt
                  </Button>
                </Popconfirm>
                <Button
                  type="primary"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => setRejecting(detailRecord)}
                >
                  Từ chối
                </Button>
              </>
            )}
          </>
        }
      />

      <Modal
        centered
        open={!!rejecting}
        title={`Từ chối biên bản ${rejecting?.code ?? ''}`}
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true }}
        cancelText="Đóng"
        confirmLoading={isRejecting}
        onCancel={() => {
          setRejecting(null);
          setRejectReason('');
        }}
        onOk={submitReject}
        destroyOnHidden
      >
        <p className="mt-1 mb-3 text-sm text-ink-sub">Nhập lý do từ chối biên bản này.</p>
        <Input.TextArea
          rows={3}
          placeholder="VD: Chưa có ảnh hiện trạng kèm theo, đề nghị bổ sung..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </>
  );
}

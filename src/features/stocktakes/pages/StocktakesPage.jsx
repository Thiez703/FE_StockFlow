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
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import ApprovalActions from '@/components/ui/ApprovalActions';
import VoucherPreviewModal from '@/components/ui/VoucherPreviewModal';
import { DiffValue } from '@/features/stocktakes/components/StocktakeItemsDetail';
import { toStocktakeRecord } from '@/features/stocktakes/utils/mapStocktake';
import { stocktakeApi } from '@/api/stocktakes';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { statusOptions, APPROVAL_STATUSES } from '@/constants/status';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatDate } from '@/utils/date';
import { toVoucher } from '@/utils/voucher';

const STOCKTAKES_KEY = ['stocktakes', DEFAULT_WAREHOUSE_ID];

export default function StocktakesPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canCreateStocktake, canApproveDocs, user } = usePermissions();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [detailId, setDetailId] = useState(null);
  // Phiếu đang chờ nhập lý do từ chối (mở từ tờ biên bản, không phải từ bảng).
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const { sortableTitle, sortRows } = useColumnSort();

  // Backend bắt buộc lọc theo kho và chưa hỗ trợ tìm kiếm / phân trang (nhưng trả về Page),
  // nên lọc theo từ khoá và trạng thái được làm tại FE với kích thước trang lớn.
  const { data: pageData, isLoading, isError, error } = useQuery({
    queryKey: STOCKTAKES_KEY,
    queryFn: () => stocktakeApi.getAll(DEFAULT_WAREHOUSE_ID, { page: 0, size: 500 }),
  });

  const rows = useMemo(() => {
    let raw = [];
    if (Array.isArray(pageData)) raw = pageData;
    else if (pageData?.content && Array.isArray(pageData.content)) raw = pageData.content;
    else if (pageData?.data && Array.isArray(pageData.data)) raw = pageData.data;
    return raw.map(toStocktakeRecord);
  }, [pageData]);

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      const okKw = !kw || String(r.code ?? '').toLowerCase().includes(kw);
      const okStatus = !status || r.status === status;
      return okKw && okStatus;
    });
    return sortRows(filtered);
  }, [rows, keyword, status, sortRows]);

  const onDecided = (label) => {
    queryClient.invalidateQueries({ queryKey: STOCKTAKES_KEY });
    message.success(label);
  };

  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: stocktakeApi.approve,
    onSuccess: () => onDecided('Đã duyệt phiếu kiểm kê'),
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const { mutate: reject, isPending: isRejecting } = useMutation({
    mutationFn: ({ id, reason }) => stocktakeApi.reject(id, reason),
    onSuccess: () => onDecided('Đã từ chối phiếu kiểm kê'),
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
  const detailVoucher = useMemo(() => toVoucher('stocktake', detailRecord), [detailRecord]);

  const statusCell = (s, record) =>
    record.rejectReason ? (
      <Tooltip title={`Lý do từ chối: ${record.rejectReason}`}>
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
      title: sortableTitle('Ngày', 'date'),
      dataIndex: 'date',
      align: 'center',
      responsive: ['md'],
      render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span>,
    },
    { title: 'Số dòng', dataIndex: 'items', align: 'center', responsive: ['lg'], render: (items) => items.length },
    {
      title: 'Người kiểm kê',
      dataIndex: 'createdBy',
      ellipsis: true,
      render: (n) => <span className="font-medium text-ink">{n}</span>,
    },
    {
      title: sortableTitle('Chênh lệch', 'diff'),
      dataIndex: 'diff',
      align: 'right',
      responsive: ['sm'],
      render: (diff) => <DiffValue value={diff} />,
    },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', responsive: ['sm'], render: statusCell },
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
            Kiểm kê
            {!canCreateStocktake && <Tag color="default">Chỉ xem</Tag>}
          </span>
        }
        subtitle="Đối chiếu tồn hệ thống với số đếm thực tế"
        breadcrumb={[{ title: 'Kiểm soát' }, { title: 'Kiểm kê' }]}
        extra={
          canCreateStocktake && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/stocktakes/create')}>
              Lập phiếu kiểm kê
            </Button>
          )
        }
      />

      {isError && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message="Không tải được danh sách phiếu kiểm kê"
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
          placeholder="Tìm mã phiếu..."
          className="w-full sm:w-64"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
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
          rowClassName={(r) => (r.diff !== 0 ? '!bg-[#fffbeb]' : '')}
          locale={{ emptyText: <TableEmptyState message="Không tìm thấy phiếu kiểm kê phù hợp" /> }}
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
                  title="Duyệt phiếu?"
                  description="Xác nhận duyệt phiếu kiểm kê này?"
                  onConfirm={() => approve(detailRecord.id)}
                  okText="Duyệt"
                  cancelText="Hủy"
                >
                  <Button
                    type="primary"
                    className="bg-emerald-600 hover:bg-emerald-500 border-none"
                    icon={<CheckOutlined />}
                  >
                    Duyệt & Chỉnh tồn
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
            {canCreateStocktake && detailRecord?.status === 'REJECTED' && (
              <Button
                icon={<PlusOutlined />}
                onClick={() => navigate('/stocktakes/create', { state: { inheritFrom: detailRecord } })}
              >
                Lập lại
              </Button>
            )}
          </>
        }
      />

      <Modal
        centered
        open={!!rejecting}
        title={`Từ chối phiếu ${rejecting?.code ?? ''}`}
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
        <p className="mt-1 mb-3 text-sm text-ink-sub">Nhập lý do từ chối phiếu kiểm kê này.</p>
        <Input.TextArea
          rows={3}
          placeholder="VD: Số liệu chưa khớp, đề nghị kiểm lại..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </>
  );
}

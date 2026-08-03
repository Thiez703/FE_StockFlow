import { useMemo, useState } from 'react';
import { Button, Input, Select, Segmented, Tag, App, Popconfirm } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
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
import VoucherGrid from '@/components/ui/VoucherGrid';
import VoucherPreviewModal from '@/components/ui/VoucherPreviewModal';
import { DiffValue } from '@/features/stocktakes/components/StocktakeItemsDetail';
import { STOCKTAKES } from '@/mock/stocktakes';
import { statusOptions, APPROVAL_STATUSES } from '@/constants/status';
import { formatDate } from '@/utils/date';
import { toVoucher } from '@/utils/voucher';

// Tổng chênh lệch (counted - system) của 1 phiếu.
const totalDiff = (items) => items.reduce((s, it) => s + (it.countedQty - it.systemQty), 0);

const VIEW_OPTIONS = [
  { value: 'table', icon: <UnorderedListOutlined />, label: 'Bảng' },
  { value: 'paper', icon: <FileTextOutlined />, label: 'Biên bản' },
];

export default function StocktakesPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { canCreateStocktake, canApproveDocs } = usePermissions();
  const [rows, setRows] = useState(STOCKTAKES);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [view, setView] = useState('table');
  const { sortableTitle, sortRows } = useColumnSort();

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      const okKw = !kw || r.code.toLowerCase().includes(kw);
      const okStatus = !status || r.status === status;
      return okKw && okStatus;
    });
    const withDiff = filtered.map((r) => ({ ...r, diff: totalDiff(r.items) }));
    return sortRows(withDiff);
  }, [rows, keyword, status, sortRows]);

  // Chuẩn hoá về khuôn "biên bản giấy" cho lưới thẻ và cho tờ biên bản chi tiết.
  const vouchers = useMemo(() => data.map((r) => toVoucher('stocktake', r)), [data]);
  const detailVoucher = useMemo(() => toVoucher('stocktake', detailRecord), [detailRecord]);

  const setStatusOf = (id, next, msg) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    message.success(msg);
    setDetailRecord((cur) => (cur?.id === id ? { ...cur, status: next } : cur));
  };

  // Mở tờ biên bản từ lưới thẻ (nhận voucher đã chuẩn hoá) -> tìm lại bản ghi gốc.
  const openVoucher = (v) => setDetailRecord(rows.find((r) => r.id === v.id) ?? null);

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'code', width: 150, render: (c) => <DocCode>{c}</DocCode> },
    {
      title: sortableTitle('Ngày', 'date'),
      dataIndex: 'date',
      align: 'center',
      width: 130,
      render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span>,
    },
    { title: 'Số dòng', dataIndex: 'items', align: 'center', width: 90, render: (items) => items.length },
    { title: 'Người kiểm', dataIndex: 'createdBy', width: 140, render: (v) => <span className="text-ink-sub">{v}</span> },
    {
      title: sortableTitle('Chênh lệch', 'diff'),
      dataIndex: 'diff',
      align: 'right',
      width: 130,
      render: (diff) => <DiffValue value={diff} />,
    },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', width: 130, render: (s) => <StatusPill status={s} /> },
    {
      title: '',
      key: 'detail',
      align: 'center',
      width: 100,
      render: (_, r) =>
        r.items?.length > 0 && (
          <Button size="small" onClick={() => setDetailRecord(r)}>
            Xem biên bản
          </Button>
        ),
    },
    // FIX 5b: Ẩn cột Duyệt nếu không có quyền
    ...(canApproveDocs ? [{
      title: 'Duyệt',
      key: 'action',
      align: 'center',
      width: 110,
      render: (_, r) => (
        <ApprovalActions
          record={r}
          onApprove={(id) => setStatusOf(id, 'APPROVED', 'Đã duyệt phiếu kiểm kê')}
          onReject={(id) => setStatusOf(id, 'REJECTED', 'Đã từ chối phiếu kiểm kê')}
        />
      ),
    }] : []),
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

      <FilterBar
        extra={
          <>
            <span className="text-sm text-ink-sub">{data.length} phiếu</span>
            <Segmented value={view} onChange={setView} options={VIEW_OPTIONS} />
          </>
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

      <FadeSection dataKey={`${view}:${data.map((r) => r.id).join(',')}`}>
        {view === 'paper' ? (
          <VoucherGrid
            vouchers={vouchers}
            onOpen={openVoucher}
            emptyMessage="Không tìm thấy phiếu kiểm kê phù hợp"
          />
        ) : (
          <DataTable
            columns={columns}
            dataSource={data}
            rowClassName={(r) => (r.diff !== 0 ? '!bg-[#fffbeb]' : '')}
            locale={{ emptyText: <TableEmptyState message="Không tìm thấy phiếu kiểm kê phù hợp" /> }}
          />
        )}
      </FadeSection>

      <VoucherPreviewModal
        open={!!detailRecord}
        voucher={detailVoucher}
        onClose={() => setDetailRecord(null)}
        actions={
          canApproveDocs &&
          detailRecord?.status === 'PENDING' && (
            <>
              <Popconfirm
                title="Duyệt phiếu?"
                description="Xác nhận duyệt phiếu kiểm kê này?"
                onConfirm={() => setStatusOf(detailRecord.id, 'APPROVED', 'Đã duyệt phiếu kiểm kê')}
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
              <Popconfirm
                title="Từ chối phiếu?"
                description="Bạn có chắc chắn muốn từ chối phiếu kiểm kê này?"
                onConfirm={() => setStatusOf(detailRecord.id, 'REJECTED', 'Đã từ chối phiếu kiểm kê')}
                okText="Từ chối"
                okButtonProps={{ danger: true }}
                cancelText="Hủy"
              >
                <Button
                  type="primary"
                  danger
                  icon={<CloseOutlined />}
                >
                  Từ chối
                </Button>
              </Popconfirm>
            </>
          )
        }
      />
    </>
  );
}

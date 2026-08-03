import { useMemo, useState } from 'react';
import { Button, Input, Select, DatePicker, Segmented, Tag, Tooltip, Modal, App } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
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
import VoucherGrid from '@/components/ui/VoucherGrid';
import VoucherPreviewModal from '@/components/ui/VoucherPreviewModal';
import { OUTBOUNDS, OUTBOUND_TYPES } from '@/mock/outbounds';
import { statusOptions, DOC_STATUSES } from '@/constants/status';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';
import { toVoucher } from '@/utils/voucher';

const { RangePicker } = DatePicker;
const TYPE_COLOR = { Sỉ: 'blue', 'Trả NCC': 'gold', Hủy: 'red', 'Nội bộ': 'default' };

const VIEW_OPTIONS = [
  { value: 'table', icon: <UnorderedListOutlined />, label: 'Bảng' },
  { value: 'paper', icon: <FileTextOutlined />, label: 'Phiếu' },
];

export default function OutboundsPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { canCreateOutbound } = usePermissions();
  const [rows, setRows] = useState(OUTBOUNDS);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState(null);
  const [status, setStatus] = useState(null);
  const [range, setRange] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [reason, setReason] = useState('');
  const [detailRecord, setDetailRecord] = useState(null);
  const [view, setView] = useState('table');
  const { sortableTitle, sortRows } = useColumnSort();

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      const okKw = !kw || [r.code, r.partnerName].some((v) => String(v).toLowerCase().includes(kw));
      const okType = !type || r.type === type;
      const okStatus = !status || r.status === status;
      const okDate = !range || (r.date >= range[0] && r.date <= range[1]);
      return okKw && okType && okStatus && okDate;
    });
    return sortRows(filtered);
  }, [rows, keyword, type, status, range, sortRows]);

  // Chuẩn hoá về khuôn "phiếu giấy" cho lưới thẻ và cho tờ phiếu xem chi tiết.
  const vouchers = useMemo(() => data.map((r) => toVoucher('outbound', r)), [data]);
  const detailVoucher = useMemo(() => toVoucher('outbound', detailRecord), [detailRecord]);

  const confirmCancel = () => {
    setRows((prev) => prev.map((r) => (r.id === cancelId ? { ...r, status: 'VOIDED', note: reason } : r)));
    message.success('Đã huỷ phiếu xuất');
    setCancelId(null);
    setReason('');
    setDetailRecord(null);
  };

  // Mở tờ phiếu từ lưới thẻ (nhận voucher đã chuẩn hoá) -> tìm lại bản ghi gốc.
  const openVoucher = (v) => setDetailRecord(rows.find((r) => r.id === v.id) ?? null);

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'code', width: 150, render: (c) => <DocCode>{c}</DocCode> },
    {
      title: 'Loại xuất',
      dataIndex: 'type',
      align: 'center',
      width: 110,
      render: (t) => (
        <Tag bordered={false} color={TYPE_COLOR[t]}>
          {t}
        </Tag>
      ),
    },
    { title: 'Đối tác / Nơi nhận', dataIndex: 'partnerName', render: (n) => <span className="font-medium text-ink">{n}</span> },
    {
      title: sortableTitle('Ngày xuất', 'date'),
      dataIndex: 'date',
      align: 'center',
      width: 130,
      render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span>,
    },
    {
      title: sortableTitle('Tổng tiền', 'total'),
      dataIndex: 'total',
      align: 'right',
      width: 160,
      render: (v) => <span className="font-semibold text-ink">{formatCurrency(v)}</span>,
    },
    { title: 'Người tạo', dataIndex: 'createdBy', width: 140, render: (v) => <span className="text-ink-sub">{v}</span> },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', width: 130, render: (s) => <StatusPill status={s} /> },
    {
      title: '',
      key: 'detail',
      align: 'center',
      width: 100,
      render: (_, r) =>
        r.items?.length > 0 && (
          <Button size="small" onClick={() => setDetailRecord(r)}>
            Xem phiếu
          </Button>
        ),
    },
    {
      title: '',
      key: 'action',
      align: 'center',
      width: 56,
      render: (_, r) =>
        r.status !== 'VOIDED' && (
          <Tooltip title="Huỷ phiếu">
            <Button type="text" danger icon={<StopOutlined />} onClick={() => setCancelId(r.id)} />
          </Tooltip>
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
        subtitle="Danh sách phiếu xuất kho: sỉ, trả NCC, huỷ, nội bộ"
        breadcrumb={[{ title: 'Nghiệp vụ kho' }, { title: 'Phiếu xuất' }]}
        extra={
          canCreateOutbound && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/outbounds/create')}>
              Lập phiếu xuất
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
          placeholder="Tìm mã phiếu, đối tác..."
          className="w-full sm:w-64"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select
          allowClear
          placeholder="Loại xuất"
          className="w-full sm:w-40"
          options={OUTBOUND_TYPES.map((t) => ({ value: t, label: t }))}
          value={type}
          onChange={setType}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          className="w-full sm:w-40"
          options={statusOptions(DOC_STATUSES)}
          value={status}
          onChange={setStatus}
        />
        <RangePicker format="DD/MM/YYYY" className="w-full sm:w-auto" onChange={(_, ds) => setRange(ds && ds[0] ? ds : null)} />
      </FilterBar>

      <FadeSection dataKey={`${view}:${data.map((r) => r.id).join(',')}`}>
        {view === 'paper' ? (
          <VoucherGrid
            vouchers={vouchers}
            onOpen={openVoucher}
            emptyMessage="Không tìm thấy phiếu xuất phù hợp"
          />
        ) : (
          <DataTable
            columns={columns}
            dataSource={data}
            rowClassName={(r) => (r.status === 'VOIDED' ? 'opacity-50' : '')}
            locale={{ emptyText: <TableEmptyState message="Không tìm thấy phiếu xuất phù hợp" /> }}
          />
        )}
      </FadeSection>

      <Modal
        open={!!cancelId}
        title="Huỷ phiếu xuất"
        okText="Xác nhận huỷ"
        okButtonProps={{ danger: true }}
        cancelText="Đóng"
        onCancel={() => setCancelId(null)}
        onOk={confirmCancel}
        destroyOnHidden
      >
        <p className="mt-1 mb-3 text-sm text-ink-sub">
          Nhập lý do huỷ phiếu. Thao tác này sẽ chuyển phiếu sang trạng thái “Đã huỷ”.
        </p>
        <Input.TextArea rows={3} placeholder="VD: Khách huỷ đơn / sai thông tin..." value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>

      <VoucherPreviewModal
        open={!!detailRecord}
        voucher={detailVoucher}
        onClose={() => setDetailRecord(null)}
        actions={
          detailRecord?.status !== 'VOIDED' && (
            <Button danger icon={<StopOutlined />} onClick={() => setCancelId(detailRecord.id)}>
              Huỷ phiếu
            </Button>
          )
        }
      />
    </>
  );
}

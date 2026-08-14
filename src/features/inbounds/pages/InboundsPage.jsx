 
import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Input, Select, DatePicker, Modal, Tag, Tooltip, App } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
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
import { toInboundRecord } from '@/features/inbounds/utils/mapInbound';
import { inboundApi } from '@/api/inbounds';
import { DOC_STATUSES, statusOptions } from '@/constants/status';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';
import { toVoucher } from '@/utils/voucher';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import dayjs from 'dayjs';

import DateRangeSelectGroup from '@/components/ui/DateRangeSelectGroup';

const INBOUNDS_KEY = ['inbounds', DEFAULT_WAREHOUSE_ID];
const PAGE_SIZE = 8;

export default function InboundsPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canCreateInbound, canVoidInbound } = usePermissions();
  const { sortableTitle, sortRows } = useColumnSort();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [range, setRange] = useState([dayjs().subtract(1, 'month'), dayjs()]);
  const [page, setPage] = useState(0);
  const [voidingId, setVoidingId] = useState(null);
  const [voidPrefix, setVoidPrefix] = useState('Sai thông tin');
  const [voidDetail, setVoidDetail] = useState('');
  const [detailId, setDetailId] = useState(null);

  const queryParams = useMemo(() => {
    const params = { warehouseId: DEFAULT_WAREHOUSE_ID, page, size: PAGE_SIZE, sort: 'createdAt,desc' };
    if (status) params.status = status;
    if (range) {
      if (range[0]) params.from = range[0].format('YYYY-MM-DD');
      if (range[1]) params.to = range[1].format('YYYY-MM-DD');
    }
    return params;
  }, [page, status, range]);

  const { data: pageData, isLoading, error, isError } = useQuery({
    queryKey: [...INBOUNDS_KEY, queryParams],
    queryFn: () => inboundApi.getAll(queryParams),
    placeholderData: keepPreviousData,
  });

  const rawRows = useMemo(() => {
    let raw = [];
    if (pageData?.content) raw = pageData.content;
    else if (pageData?.data && Array.isArray(pageData.data)) raw = pageData.data;
    return raw.map(toInboundRecord);
  }, [pageData]);

  const totalElements = pageData?.totalElements || pageData?.data?.length || 0;

  const data = useMemo(() => {
    let filtered = rawRows;
    if (keyword) {
      const q = keyword.toLowerCase();
      filtered = filtered.filter(
        (r) => r.code?.toLowerCase().includes(q) || r.supplierName?.toLowerCase().includes(q)
      );
    }
    return sortRows(filtered);
  }, [rawRows, keyword, sortRows]);

  const detailRecord = useMemo(() => data.find((r) => r.id === detailId) ?? null, [data, detailId]);
  const detailVoucher = useMemo(() => toVoucher('inbound', detailRecord), [detailRecord]);

  const { mutate: voidInbound, isPending: isVoiding } = useMutation({
    mutationFn: ({ id, reason: r }) => inboundApi.void(id, r),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INBOUNDS_KEY });
      message.success('Đã huỷ phiếu nhập');
      setVoidingId(null);
      setVoidDetail('');
      setVoidPrefix('Sai thông tin');
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
    voidInbound({ id: voidingId, reason: finalReason });
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
      title: sortableTitle('Ngày lập', 'date'),
      dataIndex: 'date',
      align: 'center',
      render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span>,
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplierName',
      ellipsis: true,
      render: (n) => <span className="font-medium text-ink">{n}</span>,
    },
    {
      title: sortableTitle('Tổng tiền', 'total'),
      dataIndex: 'total',
      align: 'right',
      render: (v) => <span className="mono font-semibold text-blue-700">{formatCurrency(v)}</span>,
    },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', render: statusCell },
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
          {r.status !== 'VOIDED' && canVoidInbound && (
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
            Phiếu nhập
            {!canCreateInbound && <Tag color="default">Chỉ xem</Tag>}
          </span>
        }
        subtitle="Danh sách phiếu nhập hàng từ nhà cung cấp"
        breadcrumb={[{ title: 'Nghiệp vụ kho' }, { title: 'Phiếu nhập' }]}
        extra={
          canCreateInbound && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/inbounds/create')}>
              Lập phiếu nhập
            </Button>
          )
        }
      />

      {isError && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message="Không tải được danh sách phiếu nhập"
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
          placeholder="Tìm mã phiếu, nhà cung cấp..."
          className="w-full sm:w-64"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          className="w-full sm:w-44"
          options={statusOptions(DOC_STATUSES)}
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
          locale={{ emptyText: <TableEmptyState message="Không tìm thấy phiếu nhập phù hợp" /> }}
          pagination={{
            current: page + 1,
            pageSize: PAGE_SIZE,
            total: totalElements,
            onChange: (p) => setPage(p - 1),
          }}
        />
      </FadeSection>

      <Modal centered
        open={!!voidingId}
        title="Huỷ phiếu nhập"
        okText="Xác nhận huỷ"
        okButtonProps={{ danger: true }}
        cancelText="Đóng"
        onCancel={() => {
          setVoidingId(null);
          setVoidDetail('');
          setVoidPrefix('Sai thông tin');
        }}
        onOk={confirmVoid}
        destroyOnHidden
      >
        <p className="mt-1 mb-3 text-sm text-ink-sub">
          Nhập lý do huỷ phiếu. Thao tác này sẽ chuyển phiếu sang trạng thái “Đã huỷ”.
        </p>
        <div className="flex flex-col gap-2">
          <Select
            value={voidPrefix}
            onChange={setVoidPrefix}
            options={[
              { value: 'Sai thông tin', label: 'Sai thông tin' },
              { value: 'Sai số lượng', label: 'Sai số lượng' },
              { value: 'Huỷ giao dịch', label: 'Huỷ giao dịch' },
              { value: 'Lý do khác', label: 'Lý do khác' },
            ]}
          />
          <Input.TextArea
            rows={3}
            placeholder="Giải thích chi tiết (VD: Nhập sai số lượng...)"
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
            {canVoidInbound && detailRecord?.status !== 'VOIDED' && (
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

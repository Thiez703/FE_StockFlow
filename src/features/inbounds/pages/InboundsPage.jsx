import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Input, Select, DatePicker, Modal, Tag, Tooltip, App } from 'antd';
import { PlusOutlined, SearchOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import TableEmptyState from '@/components/ui/TableEmptyState';
import DocItemsDetail from '@/components/ui/DocItemsDetail';
import { INBOUNDS } from '@/mock/inbounds';
import { statusOptions, DOC_STATUSES } from '@/constants/status';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';

const { RangePicker } = DatePicker;

export default function InboundsPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { canCreateInbound } = usePermissions();
  const [rows, setRows] = useState(INBOUNDS);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [range, setRange] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [reason, setReason] = useState('');
  const { sortableTitle, sortRows } = useColumnSort();

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      const okKw = !kw || [r.code, r.supplierName].some((v) => v.toLowerCase().includes(kw));
      const okStatus = !status || r.status === status;
      const okDate = !range || (r.date >= range[0] && r.date <= range[1]);
      return okKw && okStatus && okDate;
    });
    return sortRows(filtered);
  }, [rows, keyword, status, range, sortRows]);

  const confirmCancel = () => {
    setRows((prev) => prev.map((r) => (r.id === cancelId ? { ...r, status: 'VOIDED', note: reason } : r)));
    message.success('Đã huỷ phiếu nhập');
    setCancelId(null);
    setReason('');
  };

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'code', width: 150, render: (c) => <DocCode>{c}</DocCode> },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplierName',
      render: (n) => <span className="font-medium text-ink">{n}</span>,
    },
    {
      title: sortableTitle('Ngày nhập', 'date'),
      dataIndex: 'date',
      align: 'center',
      width: 130,
      render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span>,
    },
    { title: 'Mặt hàng', dataIndex: 'items', align: 'center', width: 100, render: (items) => `${items.length} SP` },
    {
      title: sortableTitle('Tổng tiền', 'total'),
      dataIndex: 'total',
      align: 'right',
      width: 160,
      render: (v) => <span className="font-semibold text-ink">{formatCurrency(v)}</span>,
    },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', width: 130, render: (s) => <StatusPill status={s} /> },
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

      <FilterBar extra={<span className="text-sm text-ink-sub">{data.length} phiếu</span>}>
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm mã phiếu, nhà cung cấp..."
          className="w-full sm:w-72"
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
        <RangePicker
          format="DD/MM/YYYY"
          className="w-full sm:w-auto"
          onChange={(_, ds) => setRange(ds && ds[0] ? ds : null)}
        />
      </FilterBar>

      <motion.div
        key={data.map((r) => r.id).join(',')}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <DataTable
          columns={columns}
          dataSource={data}
          rowClassName={(r) => (r.status === 'VOIDED' ? 'opacity-50' : '')}
          expandable={{
            expandedRowRender: (r) => <DocItemsDetail items={r.items} />,
            rowExpandable: (r) => r.items?.length > 0,
          }}
          locale={{ emptyText: <TableEmptyState message="Không tìm thấy phiếu nhập phù hợp" /> }}
        />
      </motion.div>

      <Modal
        open={!!cancelId}
        title="Huỷ phiếu nhập"
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
        <Input.TextArea
          rows={3}
          placeholder="VD: Nhập sai nhà cung cấp / sai số lượng..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>
    </>
  );
}

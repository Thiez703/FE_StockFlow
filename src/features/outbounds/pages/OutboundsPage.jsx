import { useMemo, useState } from 'react';
import { Button, Input, Select, DatePicker, Tag, Tooltip, Modal, App } from 'antd';
import { PlusOutlined, SearchOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import { OUTBOUNDS, OUTBOUND_TYPES } from '@/mock/outbounds';
import { statusOptions, DOC_STATUSES } from '@/constants/status';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';

const { RangePicker } = DatePicker;
const TYPE_COLOR = { Sỉ: 'blue', 'Trả NCC': 'gold', Hủy: 'red', 'Nội bộ': 'default' };

function ItemsDetail({ items }) {
  return (
    <div className="rounded-lg bg-slate-50/70 p-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-ink-sub">
            <th className="px-3 py-2 font-semibold">Sản phẩm</th>
            <th className="px-3 py-2 font-semibold">Lô</th>
            <th className="px-3 py-2 font-semibold">ĐVT</th>
            <th className="px-3 py-2 text-right font-semibold">SL</th>
            <th className="px-3 py-2 text-right font-semibold">Đơn giá</th>
            <th className="px-3 py-2 text-right font-semibold">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="border-t border-slate-200/70">
              <td className="px-3 py-2 text-ink">{it.productName}</td>
              <td className="px-3 py-2"><DocCode muted>{it.lot}</DocCode></td>
              <td className="px-3 py-2 text-ink-sub">{it.unit}</td>
              <td className="px-3 py-2 text-right mono">{formatNumber(it.quantity)}</td>
              <td className="px-3 py-2 text-right mono">{formatCurrency(it.unitPrice)}</td>
              <td className="px-3 py-2 text-right font-semibold text-ink">
                {formatCurrency(it.quantity * it.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function OutboundsPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [rows, setRows] = useState(OUTBOUNDS);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState(null);
  const [status, setStatus] = useState(null);
  const [range, setRange] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [reason, setReason] = useState('');

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rows.filter((r) => {
      const okKw = !kw || [r.code, r.partnerName].some((v) => String(v).toLowerCase().includes(kw));
      const okType = !type || r.type === type;
      const okStatus = !status || r.status === status;
      const okDate = !range || (r.date >= range[0] && r.date <= range[1]);
      return okKw && okType && okStatus && okDate;
    });
  }, [rows, keyword, type, status, range]);

  const confirmCancel = () => {
    setRows((prev) => prev.map((r) => (r.id === cancelId ? { ...r, status: 'VOIDED', note: reason } : r)));
    message.success('Đã huỷ phiếu xuất');
    setCancelId(null);
    setReason('');
  };

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
    { title: 'Kho xuất', dataIndex: 'warehouse', className: '!text-ink-sub', width: 170 },
    { title: 'Ngày xuất', dataIndex: 'date', align: 'center', width: 120, render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span> },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      align: 'right',
      width: 150,
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
        title="Phiếu xuất"
        subtitle="Danh sách phiếu xuất kho: sỉ, trả NCC, huỷ, nội bộ"
        breadcrumb={[{ title: 'Nghiệp vụ kho' }, { title: 'Phiếu xuất' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/outbounds/create')}>
            Lập phiếu xuất
          </Button>
        }
      />

      <FilterBar extra={<span className="text-sm text-ink-sub">{data.length} phiếu</span>}>
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

      <DataTable
        columns={columns}
        dataSource={data}
        expandable={{
          expandedRowRender: (r) => <ItemsDetail items={r.items} />,
          rowExpandable: (r) => r.items?.length > 0,
        }}
      />

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
    </>
  );
}

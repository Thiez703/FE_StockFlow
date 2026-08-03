import { useMemo, useState } from 'react';
import { Button, Input, Select, Segmented, Tag, Form, Modal, InputNumber, App, Popconfirm } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import ApprovalActions from '@/components/ui/ApprovalActions';
import VoucherGrid from '@/components/ui/VoucherGrid';
import VoucherPreviewModal from '@/components/ui/VoucherPreviewModal';
import { ABNORMAL_STOCKS, ABNORMAL_TYPES } from '@/mock/abnormal';
import { PRODUCT_OPTIONS } from '@/mock/products';
import { statusOptions, APPROVAL_STATUSES } from '@/constants/status';
import { formatDate, TODAY } from '@/utils/date';
import { formatNumber } from '@/utils/formatCurrency';
import { toVoucher } from '@/utils/voucher';

const TYPE_COLOR = { Hỏng: 'orange', Vỡ: 'volcano', Mất: 'red', 'Hết hạn': 'purple' };

const VIEW_OPTIONS = [
  { value: 'table', icon: <UnorderedListOutlined />, label: 'Bảng' },
  { value: 'paper', icon: <FileTextOutlined />, label: 'Biên bản' },
];

export default function AbnormalStocksPage() {
  const { message } = App.useApp();
  const { canCreateAbnormal, canApproveDocs } = usePermissions();
  const [rows, setRows] = useState(ABNORMAL_STOCKS);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState(null);
  const [status, setStatus] = useState(null);
  const [view, setView] = useState('table');
  const [detailRecord, setDetailRecord] = useState(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rows.filter((r) => {
      const okKw = !kw || [r.code, r.productName].some((v) => v.toLowerCase().includes(kw));
      const okType = !type || r.type === type;
      const okStatus = !status || r.status === status;
      return okKw && okType && okStatus;
    });
  }, [rows, keyword, type, status]);

  // Chuẩn hoá về khuôn "biên bản giấy" cho lưới thẻ và cho tờ biên bản chi tiết.
  const vouchers = useMemo(() => data.map((r) => toVoucher('abnormal', r)), [data]);
  const detailVoucher = useMemo(() => toVoucher('abnormal', detailRecord), [detailRecord]);
  const openVoucher = (v) => setDetailRecord(rows.find((r) => r.id === v.id) ?? null);

  const setStatusOf = (id, next, msg) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    message.success(msg);
    setDetailRecord((cur) => (cur?.id === id ? { ...cur, status: next } : cur));
  };

  // Lập xong thì mở luôn tờ biên bản vừa tạo để xem lại / in.
  const handleOk = async () => {
    const v = await form.validateFields();
    // Đánh số tiếp theo số lớn nhất đang có — đếm theo số dòng sẽ trùng mã khi
    // danh sách đã bị lọc hoặc đã xoá bớt.
    const nextNo = Math.max(0, ...rows.map((r) => Number(r.code.slice(-4)) || 0)) + 1;
    const record = {
      id: `AB-${String(nextNo).padStart(3, '0')}`,
      code: `BT-2026-${String(nextNo).padStart(4, '0')}`,
      type: v.type,
      productName: PRODUCT_OPTIONS.find((p) => p.value === v.productId)?.label ?? '',
      lot: v.lot,
      unit: v.unit,
      quantity: v.quantity,
      reason: v.reason,
      date: formatDate(TODAY).split('/').reverse().join('-'),
      status: 'PENDING',
      createdBy: 'Thiên Nguyễn',
    };

    setRows((prev) => [record, ...prev]);
    message.success('Đã lập biên bản hàng bất thường');
    setOpen(false);
    form.resetFields();
    setDetailRecord(record);
  };

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'code', width: 140, render: (c) => <DocCode>{c}</DocCode> },
    {
      title: 'Loại',
      dataIndex: 'type',
      align: 'center',
      width: 100,
      render: (t) => <Tag bordered={false} color={TYPE_COLOR[t]}>{t}</Tag>,
    },
    { title: 'Sản phẩm', dataIndex: 'productName', render: (n) => <span className="font-medium text-ink">{n}</span> },
    { title: 'Lô', dataIndex: 'lot', width: 120, render: (l) => <DocCode muted>{l}</DocCode> },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      align: 'right',
      width: 110,
      render: (q, r) => <span className="mono text-ink">{formatNumber(q)} {r.unit}</span>,
    },
    { title: 'Lý do', dataIndex: 'reason', className: '!text-ink-sub', ellipsis: true },
    { title: 'Ngày', dataIndex: 'date', align: 'center', width: 115, render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span> },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', width: 130, render: (s) => <StatusPill status={s} /> },
    {
      title: '',
      key: 'detail',
      align: 'center',
      width: 120,
      render: (_, r) => (
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
          onApprove={(id) => setStatusOf(id, 'APPROVED', 'Đã duyệt phiếu')}
          onReject={(id) => setStatusOf(id, 'REJECTED', 'Đã từ chối phiếu')}
        />
      ),
    }] : []),
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
        subtitle="Ghi nhận hàng hỏng / vỡ / mất / hết hạn"
        breadcrumb={[{ title: 'Kiểm soát' }, { title: 'Hàng bất thường' }]}
        extra={
          canCreateAbnormal && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
              Lập biên bản
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
          placeholder="Tìm mã phiếu, sản phẩm..."
          className="w-full sm:w-64"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select
          allowClear
          placeholder="Loại"
          className="w-full sm:w-40"
          options={ABNORMAL_TYPES.map((t) => ({ value: t, label: t }))}
          value={type}
          onChange={setType}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          className="w-full sm:w-40"
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
            emptyMessage="Không tìm thấy phiếu hàng bất thường phù hợp"
          />
        ) : (
          <DataTable
            columns={columns}
            dataSource={data}
            locale={{ emptyText: <TableEmptyState message="Không tìm thấy phiếu hàng bất thường phù hợp" /> }}
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
                description="Xác nhận duyệt phiếu này?"
                onConfirm={() => setStatusOf(detailRecord.id, 'APPROVED', 'Đã duyệt phiếu')}
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
                description="Bạn có chắc chắn muốn từ chối phiếu này?"
                onConfirm={() => setStatusOf(detailRecord.id, 'REJECTED', 'Đã từ chối phiếu')}
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

      <Modal
        open={open}
        title="Lập biên bản hàng bất thường"
        okText="Xác nhận lập biên bản"
        cancelText="Huỷ"
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        width={560}
        destroyOnHidden
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="mt-2"
          initialValues={{ type: 'Hỏng', unit: 'Lon', quantity: 1 }}
        >
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="type" label="Loại bất thường" rules={[{ required: true }]}>
              <Select options={ABNORMAL_TYPES.map((t) => ({ value: t, label: t }))} />
            </Form.Item>
            <Form.Item name="lot" label="Mã lô" rules={[{ required: true, message: 'Nhập mã lô' }]}>
              <Input placeholder="L2405-SG" />
            </Form.Item>
          </div>
          <Form.Item name="productId" label="Sản phẩm" rules={[{ required: true, message: 'Chọn sản phẩm' }]}>
            <Select showSearch optionFilterProp="label" options={PRODUCT_OPTIONS} placeholder="Chọn sản phẩm" />
          </Form.Item>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="quantity" label="Số lượng" rules={[{ required: true, message: 'Nhập số lượng' }]}>
              <InputNumber min={1} className="w-full" />
            </Form.Item>
            <Form.Item name="unit" label="Đơn vị">
              <Select options={[{ value: 'Lon', label: 'Lon' }, { value: 'Chai', label: 'Chai' }]} />
            </Form.Item>
          </div>
          <Form.Item name="reason" label="Lý do" rules={[{ required: true, message: 'Nhập lý do' }]}>
            <Input.TextArea rows={2} placeholder="Mô tả nguyên nhân hàng bất thường" />
          </Form.Item>
          <p className="m-0 text-xs text-slate-400">
            Xác nhận xong sẽ hiện biên bản hoàn chỉnh để xem lại và in.
          </p>
        </Form>
      </Modal>
    </>
  );
}

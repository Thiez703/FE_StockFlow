import { useMemo, useState } from 'react';
import { Button, Input, Select, Tag, Form, Modal, InputNumber, App } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import FadeSection from '@/components/ui/FadeSection';
import ApprovalActions from '@/components/ui/ApprovalActions';
import { ABNORMAL_STOCKS, ABNORMAL_TYPES } from '@/mock/abnormal';
import { PRODUCT_OPTIONS } from '@/mock/products';
import { statusOptions, APPROVAL_STATUSES } from '@/constants/status';
import { formatDate, TODAY } from '@/utils/date';
import { formatNumber } from '@/utils/formatCurrency';

const TYPE_COLOR = { Hỏng: 'orange', Vỡ: 'volcano', Mất: 'red', 'Hết hạn': 'purple' };

export default function AbnormalStocksPage() {
  const { message } = App.useApp();
  const { canCreateAbnormal, canApproveDocs } = usePermissions();
  const [rows, setRows] = useState(ABNORMAL_STOCKS);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState(null);
  const [status, setStatus] = useState(null);
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

  const setStatusOf = (id, next, msg) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    message.success(msg);
  };

  const handleOk = async () => {
    const v = await form.validateFields();
    const seq = String(rows.length + 1).padStart(3, '0');
    setRows((prev) => [
      {
        id: `AB-${seq}`,
        code: `BT-2026-0${seq}`,
        type: v.type,
        productName: PRODUCT_OPTIONS.find((p) => p.value === v.productId)?.label ?? '',
        lot: v.lot,
        unit: v.unit,
        quantity: v.quantity,
        reason: v.reason,
        date: formatDate(TODAY).split('/').reverse().join('-'),
        status: 'PENDING',
        createdBy: 'Thiên Nguyễn',
      },
      ...prev,
    ]);
    message.success('Đã tạo phiếu hàng bất thường');
    setOpen(false);
    form.resetFields();
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
              Thêm phiếu
            </Button>
          )
        }
      />

      <FilterBar extra={<span className="text-sm text-ink-sub">{data.length} phiếu</span>}>
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

      <FadeSection dataKey={data.map((r) => r.id).join(',')}>
        <DataTable columns={columns} dataSource={data} />
      </FadeSection>

      <Modal
        open={open}
        title="Thêm phiếu hàng bất thường"
        okText="Tạo phiếu"
        cancelText="Huỷ"
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        width={560}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-2" initialValues={{ type: 'Hỏng', unit: 'Lon', quantity: 1 }}>
          <div className="grid grid-cols-2 gap-x-4">
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
          <div className="grid grid-cols-2 gap-x-4">
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
        </Form>
      </Modal>
    </>
  );
}

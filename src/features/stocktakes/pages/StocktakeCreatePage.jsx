import { useState } from 'react';
import { Card, Form, Select, Input, InputNumber, Button, Empty, App, Popconfirm } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageHeader from '@/components/ui/PageHeader';
import DocCode from '@/components/ui/DocCode';
import VoucherResult from '@/components/ui/VoucherResult';
import { DEFAULT_WAREHOUSE } from '@/constants/voucher';
import { PRODUCT_OPTIONS } from '@/mock/products';
import { INVENTORY } from '@/mock/inventory';
import { formatNumber } from '@/utils/formatCurrency';
import { formatDate, TODAY } from '@/utils/date';

let rowSeq = 1;
const newRow = () => ({
  key: `r${rowSeq++}`,
  productId: undefined,
  productName: '',
  lot: '',
  unit: '',
  systemQty: 0,
  countedQty: 0,
});

function generateCode() {
  return `KK-2026-00${Math.floor(10 + Math.random() * 89)}`;
}

function DiffCell({ value }) {
  const cls = value === 0 ? 'text-ink-sub' : value > 0 ? 'text-[#15803d]' : 'text-[#b91c1c]';
  return <span className={`mono font-semibold ${cls}`}>{value > 0 ? `+${value}` : value}</span>;
}

export default function StocktakeCreatePage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const fullName = useSelector((state) => state.auth.user?.fullName);

  const [code, setCode] = useState(generateCode);
  const [inspector, setInspector] = useState(fullName || 'Lê Minh Quân');
  const [reason, setReason] = useState('');
  const [rows, setRows] = useState([newRow()]);
  // Có giá trị => đã xác nhận, chuyển sang xem tờ biên bản vừa lập.
  const [created, setCreated] = useState(null);

  const patchRow = (key, patch) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (key) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));

  // Chọn sản phẩm thì lấy luôn lô, đơn vị và tồn hệ thống để đối chiếu.
  const onPickProduct = (key, productId) => {
    const opt = PRODUCT_OPTIONS.find((p) => p.value === productId);
    const inv = INVENTORY.find((i) => i.productId === productId);
    patchRow(key, {
      productId,
      productName: opt?.label ?? '',
      lot: inv?.lot ?? '',
      unit: inv?.unit ?? opt?.unit ?? '',
      systemQty: inv?.onHand ?? 0,
      countedQty: inv?.onHand ?? 0,
    });
  };

  const totalDiff = rows.reduce((s, r) => s + (r.countedQty - r.systemQty), 0);

  const submit = () => {
    const counted = rows.filter((r) => r.productId);
    if (!counted.length) {
      message.error('Cần kiểm kê ít nhất 1 mặt hàng.');
      return;
    }

    setCreated({
      kind: 'stocktake',
      code,
      // Ngày ghi sổ = ngày lập, không cho người dùng chọn.
      date: TODAY,
      status: 'PENDING',
      note: reason,
      partnerName: inspector,
      createdBy: inspector,
      warehouse: DEFAULT_WAREHOUSE,
      items: counted.map((r) => ({
        productName: r.productName,
        lot: r.lot,
        unit: r.unit,
        systemQty: r.systemQty,
        countedQty: r.countedQty,
      })),
    });
    message.success('Đã lưu biên bản kiểm kê, chờ duyệt');
    window.scrollTo({ top: 0 });
  };

  const startNew = () => {
    setCode(generateCode());
    setReason('');
    setRows([newRow()]);
    setCreated(null);
  };

  if (created) {
    return (
      <>
        <div className="no-print">
          <PageHeader
            title="Biên bản kiểm kê đã lập"
            breadcrumb={[{ title: 'Kiểm soát' }, { title: 'Kiểm kê', href: '/stocktakes' }, { title: 'Kết quả' }]}
          />
        </div>
        <VoucherResult
          voucher={created}
          title="Đã lưu biên bản kiểm kê, chờ duyệt"
          onEdit={() => setCreated(null)}
          onNew={startNew}
          listPath="/stocktakes"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Lập biên bản kiểm kê"
        subtitle="Nhập số đếm thực tế, hệ thống tự tính chênh lệch"
        breadcrumb={[{ title: 'Kiểm soát' }, { title: 'Kiểm kê', href: '/stocktakes' }, { title: 'Lập phiếu' }]}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/stocktakes')}>
            Quay lại
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <Card
          title="Thông tin chung"
          className="border-hair"
          styles={{ header: { borderBottom: '1px solid #f1f5f9' } }}
        >
          <Form layout="vertical" component={false}>
            <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
              <Form.Item label="Số biên bản">
                <Input value={code} readOnly variant="filled" className="mono" />
              </Form.Item>
              {/* Ngày ghi sổ không cho chọn: biên bản luôn mang ngày lập. Khi nối
                  API thật thì lấy ngày từ response của server. */}
              <Form.Item label="Ngày kiểm kê">
                <Input value={formatDate(TODAY)} readOnly variant="filled" className="mono" />
              </Form.Item>
              <Form.Item label="Ban kiểm kê / người kiểm">
                <Input value={inspector} onChange={(e) => setInspector(e.target.value)} />
              </Form.Item>
              <Form.Item label="Lý do / phạm vi kiểm kê" className="!mb-0">
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="VD: Kiểm kê định kỳ quý III khu A"
                />
              </Form.Item>
            </div>
          </Form>
        </Card>

        <Card
          title="Bảng đếm thực tế"
          className="border-hair"
          styles={{ header: { borderBottom: '1px solid #f1f5f9' }, body: { padding: 0 } }}
          extra={
            <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => setRows((p) => [...p, newRow()])}>
              Thêm dòng
            </Button>
          }
        >
          <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
            <span className="col-span-5">Sản phẩm</span>
            <span className="col-span-2">Lô</span>
            <span className="col-span-2 text-right">Tồn hệ thống</span>
            <span className="col-span-2 text-right">Đếm thực tế</span>
            <span className="col-span-1 text-right">Lệch</span>
          </div>

          {rows.length === 0 ? (
            <div className="py-10">
              <Empty description="Chưa có dòng nào" />
            </div>
          ) : (
            rows.map((r) => (
              <div
                key={r.key}
                className="grid grid-cols-12 items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
              >
                <div className="col-span-12 md:col-span-5">
                  <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Sản phẩm</span>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn sản phẩm"
                    options={PRODUCT_OPTIONS}
                    value={r.productId}
                    onChange={(v) => onPickProduct(r.key, v)}
                    className="w-full"
                  />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Lô</span>
                  <DocCode muted>{r.lot || '—'}</DocCode>
                </div>
                <div className="col-span-6 md:col-span-2 md:text-right">
                  <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Tồn hệ thống</span>
                  <span className="mono text-ink-sub">{formatNumber(r.systemQty)}</span>
                </div>
                <div className="col-span-8 md:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Đếm thực tế</span>
                  <InputNumber
                    min={0}
                    value={r.countedQty}
                    onChange={(v) => patchRow(r.key, { countedQty: v ?? 0 })}
                    className="w-full"
                  />
                </div>
                <div className="col-span-4 flex items-center justify-end gap-1 md:col-span-1">
                  <DiffCell value={r.countedQty - r.systemQty} />
                  <Popconfirm
                    title="Xóa dòng này?"
                    description="Xác nhận xóa sản phẩm khỏi biên bản?"
                    onConfirm={() => removeRow(r.key)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              </div>
            ))
          )}

          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-ink-sub">Tổng chênh lệch</span>
            <DiffCell value={totalDiff} />
          </div>
        </Card>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <span className="text-center text-xs text-slate-400 sm:mr-auto sm:text-left">
            Xác nhận xong sẽ hiện biên bản hoàn chỉnh để xem lại và in.
          </span>
          <Popconfirm
            title="Lưu biên bản kiểm kê?"
            description="Bạn có chắc chắn muốn lưu biên bản này?"
            onConfirm={submit}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button type="primary" size="large" icon={<CheckOutlined />}>
              Lưu biên bản kiểm kê
            </Button>
          </Popconfirm>
        </div>
      </div>
    </>
  );
}

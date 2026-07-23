import { useState } from 'react';
import { Card, Form, Select, DatePicker, Input, InputNumber, Button, Empty, App } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import DocCode from '@/components/ui/DocCode';
import { PRODUCT_OPTIONS } from '@/mock/products';
import { INVENTORY } from '@/mock/inventory';

let rowSeq = 1;
const newRow = () => ({ key: `r${rowSeq++}`, productId: undefined, productName: '', lot: '', systemQty: 0, countedQty: 0 });

function DiffCell({ value }) {
  const cls = value === 0 ? 'text-ink-sub' : value > 0 ? 'text-[#15803d]' : 'text-[#b91c1c]';
  return <span className={`mono font-semibold ${cls}`}>{value > 0 ? `+${value}` : value}</span>;
}

export default function StocktakeCreatePage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [rows, setRows] = useState([newRow()]);

  const patchRow = (key, patch) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (key) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));

  const onPickProduct = (key, productId) => {
    const opt = PRODUCT_OPTIONS.find((p) => p.value === productId);
    const inv = INVENTORY.find((i) => i.productId === productId);
    patchRow(key, {
      productId,
      productName: opt?.label ?? '',
      lot: inv?.lot ?? '',
      systemQty: inv?.onHand ?? 0,
      countedQty: inv?.onHand ?? 0,
    });
  };

  const totalDiff = rows.reduce((s, r) => s + (r.countedQty - r.systemQty), 0);

  const submit = () => {
    message.success('Đã lưu phiếu kiểm kê, chờ duyệt');
    navigate('/stocktakes');
  };

  return (
    <>
      <PageHeader
        title="Lập phiếu kiểm kê"
        subtitle="Nhập số đếm thực tế, hệ thống tự tính chênh lệch"
        breadcrumb={[{ title: 'Kiểm soát' }, { title: 'Kiểm kê', href: '/stocktakes' }, { title: 'Lập phiếu' }]}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/stocktakes')}>
            Quay lại
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <Card title="Thông tin chung" className="border-hair" styles={{ header: { borderBottom: '1px solid #f1f5f9' } }}>
          <Form layout="vertical" component={false}>
            <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
              <Form.Item label="Ngày kiểm kê" required>
                <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
              </Form.Item>
              <Form.Item label="Người kiểm">
                <Input defaultValue="Lê Minh Quân" />
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
            <div className="py-10"><Empty description="Chưa có dòng nào" /></div>
          ) : (
            rows.map((r) => (
              <div key={r.key} className="grid grid-cols-12 items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
                <div className="col-span-12 md:col-span-5">
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
                <div className="col-span-4 md:col-span-2">
                  <DocCode muted>{r.lot || '—'}</DocCode>
                </div>
                <div className="col-span-4 text-right md:col-span-2">
                  <span className="mono text-ink-sub">{r.systemQty}</span>
                </div>
                <div className="col-span-3 md:col-span-2">
                  <InputNumber
                    min={0}
                    value={r.countedQty}
                    onChange={(v) => patchRow(r.key, { countedQty: v ?? 0 })}
                    className="w-full"
                  />
                </div>
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <DiffCell value={r.countedQty - r.systemQty} />
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeRow(r.key)} />
                </div>
              </div>
            ))
          )}

          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-ink-sub">Tổng chênh lệch</span>
            <DiffCell value={totalDiff} />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="primary" size="large" icon={<CheckOutlined />} onClick={submit}>
            Lưu phiếu kiểm kê
          </Button>
        </div>
      </div>
    </>
  );
}

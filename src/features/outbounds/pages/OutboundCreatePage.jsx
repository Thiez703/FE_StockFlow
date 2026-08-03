import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, App, Popconfirm } from 'antd';
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageHeader from '@/components/ui/PageHeader';
import VoucherResult from '@/components/ui/VoucherResult';
import OutboundGeneralInfo from '@/features/outbounds/components/OutboundGeneralInfo';
import OutboundLineItemsTable from '@/features/outbounds/components/OutboundLineItemsTable';
import { outboundSchema, emptyItem } from '@/features/outbounds/schemas/outboundSchema';
import { DEFAULT_WAREHOUSE } from '@/constants/voucher';
import { LOTS } from '@/mock/lots';
import { PRODUCT_OPTIONS } from '@/mock/products';
import { CUSTOMER_OPTIONS, SUPPLIER_OPTIONS } from '@/mock/partners';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';
import { TODAY } from '@/utils/date';

function generateCode() {
  return `PX-2026-0${Math.floor(100 + Math.random() * 900)}`;
}

// Đối tác lấy từ danh sách nào là tuỳ loại xuất đang chọn.
function partnerLabel(type, partnerId) {
  if (!partnerId) return '';
  const source = type === 'Trả NCC' ? SUPPLIER_OPTIONS : CUSTOMER_OPTIONS;
  return source.find((o) => o.value === partnerId)?.label ?? '';
}

/** Dữ liệu form -> khuôn phiếu để dựng tờ giấy ở bước xác nhận. */
function buildVoucher(values, createdBy) {
  const items = (values.items ?? []).map((it) => {
    const product = PRODUCT_OPTIONS.find((o) => o.value === it.productId);
    return {
      productName: product?.label ?? '',
      lot: it.lotId,
      unit: product?.unit ?? '',
      quantity: Number(it.quantity) || 0,
      unitPrice: Number(it.unitPrice) || 0,
    };
  });

  return {
    kind: 'outbound',
    code: values.code,
    date: TODAY, // ngày ghi sổ = ngày lập, không cho người dùng chọn
    status: 'POSTED',
    note: values.note,
    subType: values.type,
    partnerName: partnerLabel(values.type, values.partnerId),
    createdBy: createdBy || 'Người lập phiếu',
    warehouse: DEFAULT_WAREHOUSE,
    items,
    total: items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0),
  };
}

function OrderSummary({ control }) {
  const items = useWatch({ control, name: 'items' }) ?? [];
  const totalQty = items.reduce((s, it) => s + (Number(it?.quantity) || 0), 0);
  const totalAmount = items.reduce(
    (s, it) => s + (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0),
    0,
  );

  return (
    <Card className="border-hair" styles={{ body: { padding: 22 } }}>
      <h3 className="m-0 text-base font-semibold text-ink">Tổng kết phiếu</h3>
      <div className="mt-4 flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-sub">Số mặt hàng</span>
          <span className="font-medium text-ink">{items.length} sản phẩm</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-sub">Tổng số lượng</span>
          <span className="font-medium text-ink">{formatNumber(totalQty)} đơn vị</span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between rule-dashed-top pt-4">
        <span className="text-sm font-medium text-ink-sub">Tổng giá trị</span>
        <span className="text-xl font-bold text-royal">{formatCurrency(totalAmount)}</span>
      </div>
    </Card>
  );
}

export default function OutboundCreatePage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const fullName = useSelector((state) => state.auth.user?.fullName);
  const [created, setCreated] = useState(null);

  const defaults = {
    code: generateCode(),
    type: 'Sỉ',
    partnerId: undefined,
    note: '',
    items: [emptyItem],
  };

  const methods = useForm({ resolver: zodResolver(outboundSchema), defaultValues: defaults });

  const onSubmit = (values) => {
    // Kiểm tra lý do override FEFO trước khi submit
    const items = values.items ?? [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productId || !it.lotId) continue;
      const fefo = LOTS.filter((l) => l.productId === it.productId && l.status === 'active').sort(
        (a, b) => a.expDate.localeCompare(b.expDate),
      )[0];
      if (fefo && it.lotId !== fefo.code && (!it.overrideReason || !it.overrideReason.trim())) {
        message.error(`Dòng ${i + 1}: Bắt buộc nhập lý do khi chọn lô khác lô FEFO`);
        return;
      }
    }
    console.log('Outbound payload:', values);
    setCreated(buildVoucher(values, fullName));
    message.success('Đã tạo phiếu xuất kho thành công!');
    window.scrollTo({ top: 0 });
  };

  const onError = () => message.error('Vui lòng kiểm tra lại các trường bắt buộc.');

  const startNew = () => {
    methods.reset({ ...defaults, code: generateCode() });
    setCreated(null);
  };

  if (created) {
    return (
      <>
        <div className="no-print">
          <PageHeader
            title="Phiếu xuất kho đã lập"
            breadcrumb={[
              { title: 'Nghiệp vụ kho' },
              { title: 'Phiếu xuất', href: '/outbounds' },
              { title: 'Kết quả' },
            ]}
          />
        </div>
        <VoucherResult
          voucher={created}
          title="Đã ghi sổ phiếu xuất kho"
          onEdit={() => setCreated(null)}
          onNew={startNew}
          listPath="/outbounds"
        />
      </>
    );
  }

  return (
    <FormProvider {...methods}>
      <PageHeader
        title="Lập phiếu xuất kho"
        subtitle="Ghi nhận hàng hoá xuất khỏi kho (sỉ / trả NCC / huỷ / nội bộ)"
        breadcrumb={[
          { title: 'Nghiệp vụ kho' },
          { title: 'Phiếu xuất', href: '/outbounds' },
          { title: 'Lập phiếu' },
        ]}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/outbounds')}>
            Quay lại
          </Button>
        }
      />

      <form onSubmit={methods.handleSubmit(onSubmit, onError)}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="flex flex-col gap-4 xl:col-span-2">
            <OutboundGeneralInfo />
            <OutboundLineItemsTable emptyItem={emptyItem} />
          </div>

          <div className="xl:col-span-1">
            <div className="flex flex-col gap-4 xl:sticky xl:top-24">
              <OrderSummary control={methods.control} />
              <Card className="border-hair" styles={{ body: { padding: 22 } }}>
                <Popconfirm
                  title="Hoàn tất xuất kho?"
                  description="Xác nhận tạo phiếu xuất kho này?"
                  onConfirm={methods.handleSubmit(onSubmit, onError)}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckOutlined />}
                    loading={methods.formState.isSubmitting}
                    block
                  >
                    Hoàn tất xuất kho
                  </Button>
                </Popconfirm>
                <p className="mt-4 mb-0 text-center text-xs text-slate-400">
                  Ưu tiên xuất theo lô FEFO. Xác nhận xong sẽ hiện tờ phiếu để xem lại và in.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

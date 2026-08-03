import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, App, Popconfirm } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageHeader from '@/components/ui/PageHeader';
import VoucherResult from '@/components/ui/VoucherResult';
import InboundGeneralInfo from '@/features/inbounds/components/InboundGeneralInfo';
import InboundLineItemsTable from '@/features/inbounds/components/InboundLineItemsTable';
import { inboundSchema, emptyItem } from '@/features/inbounds/schemas/inboundSchema';
import { DEFAULT_WAREHOUSE } from '@/constants/voucher';
import { PRODUCT_OPTIONS } from '@/mock/products';
import { SUPPLIER_OPTIONS } from '@/mock/partners';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';
import { TODAY } from '@/utils/date';

// Sinh mã phiếu tạm cho demo.
function generateCode() {
  return `PN-2026-0${Math.floor(100 + Math.random() * 900)}`;
}

/**
 * Dữ liệu form -> khuôn phiếu để dựng tờ giấy ở bước xác nhận: đổi id sản phẩm /
 * nhà cung cấp thành tên hiển thị, tính lại thành tiền.
 */
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
    kind: 'inbound',
    code: values.code,
    date: TODAY, // ngày ghi sổ = ngày lập, không cho người dùng chọn
    status: 'POSTED',
    note: values.note,
    partnerName: SUPPLIER_OPTIONS.find((o) => o.value === values.supplierId)?.label ?? '',
    createdBy: createdBy || 'Người lập phiếu',
    warehouse: DEFAULT_WAREHOUSE,
    items,
    total: items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0),
  };
}

// Thẻ tổng kết — theo dõi `items` để tính tổng theo thời gian thực.
function OrderSummary({ control }) {
  const items = useWatch({ control, name: 'items' }) ?? [];
  const totalQty = items.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0);
  const totalAmount = items.reduce(
    (sum, it) => sum + (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0),
    0,
  );

  const rows = [
    { label: 'Số mặt hàng', value: `${items.length} sản phẩm` },
    { label: 'Tổng số lượng', value: `${formatNumber(totalQty)} đơn vị` },
  ];

  return (
    <Card className="border-hair" styles={{ body: { padding: 22 } }}>
      <h3 className="m-0 text-base font-semibold text-ink">Tổng kết phiếu</h3>
      <div className="mt-4 flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm">
            <span className="text-ink-sub">{r.label}</span>
            <span className="font-medium text-ink">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rule-dashed-top pt-4">
        <span className="text-sm font-medium text-ink-sub">Tổng giá trị</span>
        <span className="text-xl font-bold text-royal">{formatCurrency(totalAmount)}</span>
      </div>
    </Card>
  );
}

export default function InboundCreatePage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const fullName = useSelector((state) => state.auth.user?.fullName);
  // Có giá trị => đã xác nhận, chuyển sang xem tờ phiếu vừa lập.
  const [created, setCreated] = useState(null);

  const methods = useForm({
    resolver: zodResolver(inboundSchema),
    defaultValues: {
      code: generateCode(),
      supplierId: undefined,
      note: '',
      items: [emptyItem],
    },
  });

  const onSubmit = (values) => {
    console.log('Inbound payload:', values);
    setCreated(buildVoucher(values, fullName));
    message.success('Đã tạo phiếu nhập kho thành công!');
    window.scrollTo({ top: 0 });
  };

  const onError = () => {
    message.error('Vui lòng kiểm tra lại các trường bắt buộc.');
  };

  const startNew = () => {
    methods.reset({
      code: generateCode(),
      supplierId: undefined,
      note: '',
      items: [emptyItem],
    });
    setCreated(null);
  };

  if (created) {
    return (
      <>
        <div className="no-print">
          <PageHeader
            title="Phiếu nhập kho đã lập"
            breadcrumb={[
              { title: 'Nghiệp vụ kho' },
              { title: 'Phiếu nhập', href: '/inbounds' },
              { title: 'Kết quả' },
            ]}
          />
        </div>
        <VoucherResult
          voucher={created}
          title="Đã ghi sổ phiếu nhập kho"
          onEdit={() => setCreated(null)}
          onNew={startNew}
          listPath="/inbounds"
        />
      </>
    );
  }

  return (
    <FormProvider {...methods}>
      <PageHeader
        title="Lập phiếu nhập kho"
        subtitle="Ghi nhận hàng hoá nhập vào kho từ nhà cung cấp"
        breadcrumb={[
          { title: 'Nghiệp vụ kho' },
          { title: 'Phiếu nhập', href: '/inbounds' },
          { title: 'Lập phiếu' },
        ]}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inbounds')}>
            Quay lại
          </Button>
        }
      />

      <form onSubmit={methods.handleSubmit(onSubmit, onError)}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="flex flex-col gap-4 xl:col-span-2">
            <InboundGeneralInfo />
            <InboundLineItemsTable emptyItem={emptyItem} />
          </div>

          <div className="xl:col-span-1">
            <div className="flex flex-col gap-4 xl:sticky xl:top-24">
              <OrderSummary control={methods.control} />

              <Card className="border-hair" styles={{ body: { padding: 22 } }}>
                <Popconfirm
                  title="Hoàn tất nhập kho?"
                  description="Xác nhận tạo phiếu nhập kho này?"
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
                    Hoàn tất nhập kho
                  </Button>
                </Popconfirm>
                <Button
                  size="large"
                  icon={<SaveOutlined />}
                  className="!mt-3"
                  onClick={() => message.info('Đã lưu nháp phiếu nhập.')}
                  block
                >
                  Lưu nháp
                </Button>
                <p className="mt-4 mb-0 text-center text-xs text-slate-400">
                  Xác nhận xong sẽ hiện tờ phiếu hoàn chỉnh để xem lại và in.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

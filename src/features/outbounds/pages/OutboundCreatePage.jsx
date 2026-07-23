import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, App } from 'antd';
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import OutboundLineItemsTable from '@/features/outbounds/components/OutboundLineItemsTable';
import { LOTS } from '@/mock/lots';
import OutboundGeneralInfo from '@/features/outbounds/components/OutboundGeneralInfo';
import { outboundSchema, emptyItem } from '@/features/outbounds/schemas/outboundSchema';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';

function generateCode() {
  return `PX-2026-0${Math.floor(100 + Math.random() * 900)}`;
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
      <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-200 pt-4">
        <span className="text-sm font-medium text-ink-sub">Tổng giá trị</span>
        <span className="text-xl font-bold text-royal">{formatCurrency(totalAmount)}</span>
      </div>
    </Card>
  );
}

export default function OutboundCreatePage() {
  const { message } = App.useApp();
  const navigate = useNavigate();

  const methods = useForm({
    resolver: zodResolver(outboundSchema),
    defaultValues: {
      code: generateCode(),
      type: 'Sỉ',
      partnerId: undefined,
      issueDate: null,
      note: '',
      items: [emptyItem],
    },
  });

  const onSubmit = (values) => {
    // Kiểm tra lý do override FEFO trước khi submit
    const items = values.items ?? [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productId || !it.lotId) continue;
      const fefo = LOTS
        .filter((l) => l.productId === it.productId && l.status === 'active')
        .sort((a, b) => a.expDate.localeCompare(b.expDate))[0];
      if (fefo && it.lotId !== fefo.code && (!it.overrideReason || !it.overrideReason.trim())) {
        message.error(`Dòng ${i + 1}: Bắt buộc nhập lý do khi chọn lô khác lô FEFO`);
        return;
      }
    }
    console.log('Outbound payload:', values);
    message.success('Đã tạo phiếu xuất kho thành công!');
    navigate('/outbounds');
  };

  const onError = () => message.error('Vui lòng kiểm tra lại các trường bắt buộc.');

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
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<CheckOutlined />}
                  loading={methods.formState.isSubmitting}
                  block
                >
                  Hoàn tất xuất kho
                </Button>
                <p className="mt-4 mb-0 text-center text-xs text-slate-400">
                  Ưu tiên xuất theo lô FEFO để hạn chế hàng cận hạn.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

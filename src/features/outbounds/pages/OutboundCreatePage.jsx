import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, App, Popconfirm } from 'antd';
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageHeader from '@/components/ui/PageHeader';
import VoucherResult from '@/components/ui/VoucherResult';
import OutboundGeneralInfo from '@/features/outbounds/components/OutboundGeneralInfo';
import OutboundLineItemsTable from '@/features/outbounds/components/OutboundLineItemsTable';
import OrderSummary from '@/features/outbounds/components/OrderSummary';
import { retailSchema, returnSupplierSchema, disposalSchema, emptyItem } from '@/features/outbounds/schemas/outboundSchema';
import { ISSUE_TYPE_LABEL } from '@/mock/outbounds';
import { DEFAULT_WAREHOUSE } from '@/constants/voucher';
import { LOTS } from '@/mock/lots';
import { PRODUCT_OPTIONS } from '@/mock/products';
import { CUSTOMER_OPTIONS, SUPPLIER_OPTIONS } from '@/mock/partners';
import { formatCurrency } from '@/utils/formatCurrency';
import { TODAY } from '@/utils/date';

const SCHEMA_MAP = {
  RETAIL: retailSchema,
  RETURN_SUPPLIER: returnSupplierSchema,
  DISPOSAL: disposalSchema,
};

const TITLES = {
  RETAIL: 'Lập phiếu xuất bán',
  RETURN_SUPPLIER: 'Lập phiếu trả NCC',
  DISPOSAL: 'Lập phiếu xuất hủy',
};

const SUBTITLES = {
  RETAIL: 'Xuất hàng bán cho khách hàng — lô hàng gợi ý theo FEFO',
  RETURN_SUPPLIER: 'Trả hàng cho nhà cung cấp — chọn đích danh lô bị trả',
  DISPOSAL: 'Xuất hủy hàng hỏng / hết hạn — bắt buộc chọn lý do',
};

function generateCode() {
  return `PX-2026-0${Math.floor(100 + Math.random() * 900)}`;
}

function partnerLabel(issueType, values) {
  if (issueType === 'RETAIL') {
    return CUSTOMER_OPTIONS.find((o) => o.value === values.customerId)?.label ?? '';
  }
  if (issueType === 'RETURN_SUPPLIER') {
    return SUPPLIER_OPTIONS.find((o) => o.value === values.supplierId)?.label ?? '';
  }
  return '—';
}

function buildVoucher(issueType, values, createdBy) {
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
    date: TODAY,
    status: 'POSTED',
    note: values.note,
    subType: ISSUE_TYPE_LABEL[issueType],
    partnerName: partnerLabel(issueType, values),
    createdBy: createdBy || 'Người lập phiếu',
    warehouse: DEFAULT_WAREHOUSE,
    items,
    total: items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0),
  };
}

export default function OutboundCreatePage() {
  const { issueType = 'RETAIL' } = useParams();
  const type = issueType.toUpperCase();
  const schema = SCHEMA_MAP[type];

  // Fallback for invalid type
  if (!schema) {
    return <div className="p-8 text-center text-red-500">Loại phiếu xuất không hợp lệ</div>;
  }

  return <OutboundCreateForm issueType={type} schema={schema} />;
}

function OutboundCreateForm({ issueType, schema }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const fullName = useSelector((state) => state.auth.user?.fullName);
  const [created, setCreated] = useState(null);

  const useFEFO = issueType === 'RETAIL';

  const defaults = {
    code: generateCode(),
    issue_type: issueType,
    ...(issueType === 'RETAIL' ? { customerId: undefined } : {}),
    ...(issueType === 'RETURN_SUPPLIER' ? { supplierId: undefined } : {}),
    ...(issueType === 'DISPOSAL' ? { reason_type: undefined } : {}),
    note: '',
    items: [emptyItem],
  };

  const methods = useForm({ resolver: zodResolver(schema), defaultValues: defaults });

  const onSubmit = (values) => {
    if (useFEFO) {
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
    }
    console.log('Outbound payload:', { ...values, issue_type: issueType });
    setCreated(buildVoucher(issueType, values, fullName));
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
        title={TITLES[issueType]}
        subtitle={SUBTITLES[issueType]}
        breadcrumb={[
          { title: 'Nghiệp vụ kho' },
          { title: 'Phiếu xuất', href: '/outbounds' },
          { title: TITLES[issueType] },
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
            <OutboundGeneralInfo issueType={issueType} />
            <OutboundLineItemsTable emptyItem={emptyItem} useFEFO={useFEFO} />
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
                  {useFEFO
                    ? 'Ưu tiên xuất theo lô FEFO. Xác nhận xong sẽ hiện tờ phiếu để xem lại và in.'
                    : 'Xác nhận xong sẽ hiện tờ phiếu để xem lại và in.'}
                </p>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

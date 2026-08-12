import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Card, App, Popconfirm } from 'antd';
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import VoucherResult from '@/components/ui/VoucherResult';
import AccessDenied from '@/components/feedback/AccessDenied';
import { usePermissions } from '@/hooks/usePermissions';
import InboundGeneralInfo from '@/features/inbounds/components/InboundGeneralInfo';
import InboundLineItemsTable from '@/features/inbounds/components/InboundLineItemsTable';
import { toInboundRecord } from '@/features/inbounds/utils/mapInbound';
import { inboundSchema, emptyItem } from '@/features/inbounds/schemas/inboundSchema';
import { inboundApi } from '@/api/inbounds';
import { supplierApi } from '@/api/partners';
import { productApi } from '@/api/products';
import { lotApi } from '@/api/lots';
import { storageLocationApi } from '@/api/warehouses';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';
import { toVoucher } from '@/utils/voucher';

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
  const isMobile = useIsMobile();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { canCreateInbound } = usePermissions();

  const [created, setCreated] = useState(null);

  // Master data queries
  const { data: suppliers = [], isLoading: loadingSuppliers, isError: errSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: supplierApi.getAll,
    enabled: canCreateInbound,
  });
  const { data: products = [], isError: errProducts } = useQuery({
    queryKey: ['products'],
    queryFn: productApi.getAll,
    enabled: canCreateInbound,
  });
  const { data: allLots = [], isError: errLots } = useQuery({
    queryKey: ['lots'],
    queryFn: lotApi.getAll,
    enabled: canCreateInbound,
  });
  const { data: locations = [], isError: errLocations } = useQuery({
    queryKey: ['storage-locations', DEFAULT_WAREHOUSE_ID],
    queryFn: () => storageLocationApi.getByWarehouse(DEFAULT_WAREHOUSE_ID),
    enabled: canCreateInbound,
  });

  const isError = errSuppliers || errProducts || errLots || errLocations;

  const activeFilter = (list) =>
    list.filter((p) => String(p.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE');

  const supplierOptions = useMemo(
    () => activeFilter(suppliers).map((s) => ({ value: s.id, label: s.name })),
    [suppliers],
  );

  const productOptions = useMemo(
    () => activeFilter(products).map((p) => ({ value: p.id, label: p.name, unit: p.unit ?? '' })),
    [products],
  );

  const lotsByProduct = useMemo(() => {
    const map = new Map();
    for (const lot of allLots) {
      if (String(lot.status ?? 'ACTIVE').toUpperCase() !== 'ACTIVE') continue;
      const list = map.get(lot.productId) ?? [];
      list.push(lot);
      map.set(lot.productId, list);
    }
    return map;
  }, [allLots]);

  const locationOptions = useMemo(
    () =>
      activeFilter(locations).map((loc) => ({
        value: loc.id,
        label: loc.locationCode,
      })),
    [locations],
  );

  const methods = useForm({
    resolver: zodResolver(inboundSchema),
    defaultValues: {
      supplierId: undefined,
      note: '',
      items: location.state?.prefill && Array.isArray(location.state.prefill)
        ? location.state.prefill.map(p => ({ ...emptyItem, ...p }))
        : [emptyItem],
    },
  });

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (payload) => inboundApi.create(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['inbounds'] });
      setCreated(toInboundRecord(res));
      message.success('Đã ghi sổ phiếu nhập kho');
      window.scrollTo({ top: 0 });
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const onSubmit = (values) => {
    save({
      warehouseId: DEFAULT_WAREHOUSE_ID,
      supplierId: values.supplierId,
      note: values.note || null,
      details: values.items.map((it) => ({
        productId: it.productId,
        lotId: it.lotId || null,
        lotCode: it.lotCode,
        mfgDate: it.mfgDate || null,
        expDate: it.expDate || null,
        locationId: it.locationId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
    });
  };

  const onError = () => {
    message.error('Vui lòng kiểm tra lại các trường bắt buộc.');
  };

  const startNew = () => {
    methods.reset({
      supplierId: undefined,
      note: '',
      items: [emptyItem],
    });
    setCreated(null);
  };

  if (!canCreateInbound) return <AccessDenied />;

  const breadcrumb = (last) => [
    { title: 'Nghiệp vụ kho' },
    { title: 'Phiếu nhập', href: '/inbounds' },
    { title: last },
  ];

  if (created) {
    return (
      <>
        <div className="no-print">
          <PageHeader title="Phiếu nhập kho đã lập" breadcrumb={breadcrumb('Kết quả')} />
        </div>
        <VoucherResult
          voucher={toVoucher('inbound', created)}
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
        breadcrumb={breadcrumb('Lập phiếu')}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inbounds')}>
            Quay lại
          </Button>
        }
      />

      {isError && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message="Không tải được dữ liệu danh mục"
          description="Có lỗi khi tải danh sách nhà cung cấp, sản phẩm hoặc vị trí kho. Vui lòng thử lại."
        />
      )}

      <form onSubmit={methods.handleSubmit(onSubmit, onError)}>
        <div className={isMobile ? 'flex flex-col gap-4' : 'grid grid-cols-1 gap-4 xl:grid-cols-3'}>
          <div className={`flex flex-col gap-4 ${isMobile ? '' : 'xl:col-span-2'}`}>
            <InboundGeneralInfo
              supplierOptions={supplierOptions}
              loadingSuppliers={loadingSuppliers}
            />
            <InboundLineItemsTable
              emptyItem={emptyItem}
              productOptions={productOptions}
              lotsByProduct={lotsByProduct}
              locationOptions={locationOptions}
            />
          </div>

          <div className={isMobile ? '' : 'xl:col-span-1'}>
            <div className={`flex flex-col gap-4 ${isMobile ? '' : 'xl:sticky xl:top-24'}`}>
              {!isMobile && <OrderSummary control={methods.control} />}

              <Card className="border-hair" styles={{ body: { padding: isMobile ? 16 : 22 } }}>
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
                    loading={isSaving}
                    block
                    className={isMobile ? 'min-h-[48px] text-base' : ''}
                  >
                    Hoàn tất nhập kho
                  </Button>
                </Popconfirm>
                {!isMobile && (
                  <p className="mt-4 mb-0 text-center text-xs text-slate-400">
                    Xác nhận xong sẽ hiện tờ phiếu hoàn chỉnh để xem lại và in.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

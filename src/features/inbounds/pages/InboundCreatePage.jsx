import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, App, Popconfirm } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CalculatorOutlined, PlusCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import VoucherResult from '@/components/ui/VoucherResult';
import AccessDenied from '@/components/feedback/AccessDenied';
import { usePermissions } from '@/hooks/usePermissions';
import { useInventorySnapshot } from '@/hooks/useInventorySnapshot';
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

const THEMES = {
  NEW: {
    bg: 'bg-emerald-50',
    textIcon: 'text-emerald-600',
    border: 'border-t-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dotPing: 'bg-emerald-400',
    dot: 'bg-emerald-500',
    btnAction: '!bg-emerald-600 hover:!bg-emerald-500 !border-none text-white shadow-emerald-500/20',
    btnPopConfirm: '!bg-emerald-600 hover:!bg-emerald-500 text-white',
    titleColor: 'text-emerald-700',
    label: 'Đang lập phiếu nhập mới'
  },
  RESTOCK: {
    bg: 'bg-cyan-50',
    textIcon: 'text-cyan-600',
    border: 'border-t-cyan-500',
    badgeBg: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    dotPing: 'bg-cyan-400',
    dot: 'bg-cyan-500',
    btnAction: '!bg-cyan-600 hover:!bg-cyan-500 !border-none text-white shadow-cyan-500/20',
    btnPopConfirm: '!bg-cyan-600 hover:!bg-cyan-500 text-white',
    titleColor: 'text-cyan-700',
    label: 'Đang nhập hàng bổ sung'
  }
};

function OrderSummary({ control, theme }) {
  const items = useWatch({ control, name: 'items' }) ?? [];
  const filled = items.filter((it) => it?.productId);
  const totalQty = items.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0);
  const totalAmount = items.reduce(
    (sum, it) => sum + (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0),
    0,
  );

  const bgClass = theme?.bg || 'bg-emerald-50';
  const textIconClass = theme?.textIcon || 'text-emerald-600';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 mb-5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bgClass} ${textIconClass}`}>
          <CalculatorOutlined className="text-base" />
        </div>
        <h3 className="m-0 text-base font-bold text-slate-800 tracking-wide">Tổng kết phiếu</h3>
      </div>
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between text-[14px]">
          <span className="text-slate-500 font-medium">Số mặt hàng</span>
          <span className="font-semibold text-slate-700">{filled.length}/{items.length} dòng</span>
        </div>
        <div className="flex items-center justify-between text-[14px]">
          <span className="text-slate-500 font-medium">Tổng số lượng</span>
          <span className="font-semibold text-slate-700">{formatNumber(totalQty)} thùng</span>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-dashed border-slate-200 pt-5">
        <span className="text-[14px] font-bold text-slate-500 uppercase tracking-wider">Tổng giá trị</span>
        <span className={`text-[22px] font-black ${textIconClass}`}>{formatCurrency(totalAmount)}</span>
      </div>
    </div>
  );
}

export default function InboundCreatePage() {
  const isMobile = useIsMobile();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { canCreateInbound } = usePermissions();

  const isNewMode = location.pathname.endsWith('/new');

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

  const { cells: inventoryCells } = useInventorySnapshot(undefined, {
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
        zoneCode: loc.zoneCode,
      })),
    [locations],
  );

  const methods = useForm({
    resolver: zodResolver(inboundSchema),
    defaultValues: {
      supplierId: undefined,
      note: '',
      items: location.state?.prefill && Array.isArray(location.state.prefill)
        ? location.state.prefill.map(p => ({ ...emptyItem, isNewLot: isNewMode, ...p }))
        : [{ ...emptyItem, isNewLot: isNewMode }],
    },
  });

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (payload) => inboundApi.create(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['inbounds'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'storage-map'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
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

  const onError = (errors) => {
    console.error('Validation errors:', errors);
    message.error('Vui lòng kiểm tra lại các trường thông tin bắt buộc.');
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
          onNew={startNew}
          listPath="/inbounds"
        />
      </>
    );
  }

  const modeLabel = isNewMode ? 'Nhập mới' : 'Nhập bổ sung';
  const ModeIcon = isNewMode ? PlusCircleOutlined : SyncOutlined;

  return (
    <FormProvider {...methods}>
      <PageHeader
        title="Lập phiếu nhập kho"
        subtitle="Ghi nhận hàng hoá nhập vào kho từ nhà cung cấp"
        breadcrumb={breadcrumb('Lập phiếu')}
        extra={
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isNewMode
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
            }`}>
              <ModeIcon className="text-[11px]" />
              {modeLabel}
            </span>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inbounds')}>
              Quay lại
            </Button>
          </div>
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
        <div className="flex flex-col gap-5 pb-24">
          {/* Thông tin phiếu (65-70%) + Tổng phiếu (30-35%) */}
          <div className={isMobile ? 'flex flex-col gap-4' : 'flex gap-5'}>
            <div className={isMobile ? '' : 'flex-[7] min-w-0'}>
              <div className={`rounded-2xl shadow-sm bg-white p-6 border-t-4 ${isNewMode ? THEMES.NEW.border : THEMES.RESTOCK.border}`}>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${isNewMode ? THEMES.NEW.bg : THEMES.RESTOCK.bg} ${isNewMode ? THEMES.NEW.textIcon : THEMES.RESTOCK.textIcon}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 00-1.5 0v2.546l-.943-1.048a.75.75 0 10-1.114 1.004l2.25 2.5a.75.75 0 001.114 0l2.25-2.5a.75.75 0 10-1.114-1.004l-.943 1.048V8.75z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="m-0 text-base font-bold text-slate-800 tracking-wide">Thông tin phiếu</h3>
                </div>
                <InboundGeneralInfo
                  supplierOptions={supplierOptions}
                  loadingSuppliers={loadingSuppliers}
                />
              </div>
            </div>
            <div className={isMobile ? '' : 'flex-[3] min-w-0'}>
              <div className={`rounded-2xl shadow-sm bg-gradient-to-b from-white to-slate-50/50 p-6 h-full border-t-4 ${isNewMode ? THEMES.NEW.border : THEMES.RESTOCK.border}`}>
                <OrderSummary control={methods.control} theme={isNewMode ? THEMES.NEW : THEMES.RESTOCK} />
              </div>
            </div>
          </div>

          {/* Bảng sản phẩm — khu vực trung tâm, full width */}
          <InboundLineItemsTable
            emptyItem={{ ...emptyItem, isNewLot: isNewMode }}
            productOptions={productOptions}
            lotsByProduct={lotsByProduct}
            locationOptions={locationOptions}
            inventoryCells={inventoryCells}
            isNewMode={isNewMode}
          />
        </div>

        {/* Action bar — sticky bottom */}
        <div className={`sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_12px_rgba(0,0,0,0.05)] py-4 flex items-center justify-end gap-3 ${isMobile ? 'px-2' : 'px-1'}`}>
          {!isMobile && (
            <div className="flex-1 flex items-center ml-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold ring-1 uppercase tracking-wide ${isNewMode ? THEMES.NEW.badgeBg : THEMES.RESTOCK.badgeBg}`}>
                <span className="relative flex h-2 w-2 mr-1">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isNewMode ? THEMES.NEW.dotPing : THEMES.RESTOCK.dotPing}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isNewMode ? THEMES.NEW.dot : THEMES.RESTOCK.dot}`}></span>
                </span>
                {isNewMode ? THEMES.NEW.label : THEMES.RESTOCK.label}
              </span>
            </div>
          )}
          <Button size="large" onClick={() => navigate('/inbounds')}>
            Hủy
          </Button>
          <Popconfirm
            title={<span className={`font-bold uppercase ${isNewMode ? THEMES.NEW.titleColor : THEMES.RESTOCK.titleColor}`}>XÁC NHẬN LẬP PHIẾU NHẬP?</span>}
            description="Xác nhận tạo phiếu nhập kho này?"
            onConfirm={methods.handleSubmit(onSubmit, onError)}
            okText="Xác nhận"
            cancelText="Hủy"
            okButtonProps={{ className: isNewMode ? THEMES.NEW.btnPopConfirm : THEMES.RESTOCK.btnPopConfirm }}
          >
            <Button
              type="primary"
              size="large"
              icon={<CheckOutlined />}
              loading={isSaving}
              className={`min-w-[180px] font-bold rounded-xl shadow-lg ${isNewMode ? THEMES.NEW.btnAction : THEMES.RESTOCK.btnAction}`}
            >
              Hoàn tất nhập kho
            </Button>
          </Popconfirm>
        </div>
      </form>
    </FormProvider>
  );
}

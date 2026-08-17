import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, App, Popconfirm } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, FileTextOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageHeader from '@/components/ui/PageHeader';
import VoucherResult from '@/components/ui/VoucherResult';
import AccessDenied from '@/components/feedback/AccessDenied';
import { usePermissions } from '@/hooks/usePermissions';
import { useInventorySnapshot } from '@/hooks/useInventorySnapshot';
import OutboundGeneralInfo from '@/features/outbounds/components/OutboundGeneralInfo';
import OutboundLineItemsTable from '@/features/outbounds/components/OutboundLineItemsTable';
import OrderSummary from '@/features/outbounds/components/OrderSummary';
import { toOutboundRecord } from '@/features/outbounds/utils/mapOutbound';
import { ISSUE_TYPES } from '@/features/outbounds/constants/issueTypes';
import { outboundApi } from '@/api/outbounds';
import { customerApi, supplierApi } from '@/api/partners';
import { alertApi } from '@/api/alerts';
import { lotApi } from '@/api/lots';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { toVoucher } from '@/utils/voucher';

const TITLES = {
  RETAIL: 'Lập phiếu xuất bán',
  RETURN_SUPPLIER: 'Lập phiếu trả NCC',
  DISPOSAL: 'Lập phiếu xuất hủy',
};

const SUBTITLES = {
  RETAIL: 'Xuất hàng bán cho khách hàng — ưu tiên lô hết hạn sớm nhất (FEFO)',
  RETURN_SUPPLIER: 'Trả hàng cho nhà cung cấp — chọn đích danh lô bị trả',
  DISPOSAL: 'Xuất hủy hàng hỏng / hết hạn — bắt buộc chọn lý do',
};

const THEMES = {
  RETAIL: {
    bg: 'bg-amber-50',
    textIcon: 'text-amber-600',
    border: 'border-t-amber-500',
    badgeBg: 'bg-amber-50 text-amber-700 ring-amber-200',
    dotPing: 'bg-amber-400',
    dot: 'bg-amber-500',
    btnAction: '!bg-amber-500 hover:!bg-amber-400 !border-none text-white shadow-amber-500/20',
    btnPopConfirm: '!bg-amber-600 hover:!bg-amber-500 text-white',
    titleColor: 'text-amber-700',
    label: 'Đang lập phiếu xuất bán'
  },
  RETURN_SUPPLIER: {
    bg: 'bg-violet-50',
    textIcon: 'text-violet-600',
    border: 'border-t-violet-500',
    badgeBg: 'bg-violet-50 text-violet-700 ring-violet-200',
    dotPing: 'bg-violet-400',
    dot: 'bg-violet-500',
    btnAction: '!bg-violet-500 hover:!bg-violet-400 !border-none text-white shadow-violet-500/20',
    btnPopConfirm: '!bg-violet-600 hover:!bg-violet-500 text-white',
    titleColor: 'text-violet-700',
    label: 'Đang lập phiếu trả ncc'
  },
  DISPOSAL: {
    bg: 'bg-red-50',
    textIcon: 'text-red-600',
    border: 'border-t-red-500',
    badgeBg: 'bg-red-50 text-red-700 ring-red-200',
    dotPing: 'bg-red-400',
    dot: 'bg-red-500',
    btnAction: '!bg-red-600 hover:!bg-red-500 !border-none text-white shadow-red-500/20',
    btnPopConfirm: '!bg-red-700 hover:!bg-red-600 text-white',
    titleColor: 'text-red-700',
    label: 'Đang lập phiếu xuất hủy'
  }
};

const newRow = () => ({
  key: Math.random().toString(36).slice(2, 9),
  cellKey: undefined,
  quantity: 1,
  unitPrice: 0,
  overrideReason: '',
});

const emptyForm = { customerId: undefined, supplierId: undefined, disposalReason: undefined, note: '' };

/**
 * Backend chỉ có cột `note` (tối đa 255 ký tự) cho phần diễn giải, không có chỗ
 * lưu nhà cung cấp của phiếu trả NCC hay lý do của phiếu xuất huỷ. Hai giá trị
 * đó được ghép vào đầu ghi chú để không mất thông tin người lập đã nhập.
 */
function buildNote(issueType, form, supplierName) {
  const prefix =
    issueType === 'RETURN_SUPPLIER' && supplierName
      ? `Trả NCC: ${supplierName}`
      : issueType === 'DISPOSAL' && form.disposalReason
        ? `Lý do huỷ: ${form.disposalReason}`
        : '';
  const text = [prefix, form.note.trim()].filter(Boolean).join(' — ');
  return text ? text.slice(0, 255) : null;
}

export default function OutboundCreatePage() {
  const { issueType = 'retail' } = useParams();
  const type = issueType.toUpperCase();

  if (!ISSUE_TYPES[type]) {
    return <div className="p-8 text-center text-red-500">Loại phiếu xuất không hợp lệ</div>;
  }

  return <OutboundCreateForm issueType={type} />;
}

function OutboundCreateForm({ issueType }) {
  const isMobile = useIsMobile();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fullName = useSelector((state) => state.auth.user?.fullName);
  const { canCreateOutbound } = usePermissions();

  // Người lập chọn thẳng ô vị trí đang có hàng: backend nhận cặp
  // (lotId, locationId) chứ không nhận productId.
  // Không đủ quyền thì khỏi gọi, endpoint chắc chắn trả 403.
  const { cells, isLoading, isError, error, refetch } = useInventorySnapshot(undefined, {
    enabled: canCreateOutbound,
  });

  // Danh mục đối tác chỉ cần cho loại phiếu tương ứng.
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: customerApi.getAll,
    enabled: issueType === 'RETAIL',
  });
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: supplierApi.getAll,
    enabled: issueType === 'RETURN_SUPPLIER',
  });

  const { data: riskData } = useQuery({
    queryKey: ['alerts', 'sell-through-risk'],
    queryFn: () => alertApi.getSellThroughRisk({ size: 9999 }),
    enabled: canCreateOutbound,
  });

  const riskLotIds = useMemo(() => {
    const set = new Set();
    if (riskData?.content) {
      riskData.content.forEach((r) => {
        if (r.atRisk) set.add(r.lotId);
      });
    }
    return set;
  }, [riskData]);

  const location = useLocation();
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [rows, setRows] = useState(() => {
    const prefill = location.state?.prefill;
    if (prefill && Array.isArray(prefill)) {
      return prefill.map(p => ({
        ...newRow(),
        ...p,
      }));
    }
    return [newRow()];
  });
  // Có giá trị => đã lưu, chuyển sang xem tờ phiếu server trả về.
  const [created, setCreated] = useState(null);

  const cellByKey = useMemo(() => new Map(cells.map((c) => [c.key, c])), [cells]);

  // Lô FEFO của mỗi sản phẩm = lô có hạn dùng sớm nhất trong số các ô còn hàng.
  // Backend không có endpoint gợi ý FEFO nên FE tự tính từ ảnh chụp tồn.
  const fefoLotIdByProduct = useMemo(() => {
    const best = new Map();
    for (const c of cells) {
      if (!c.expDate) continue;
      const current = best.get(c.productId);
      if (!current || c.expDate < current.expDate) best.set(c.productId, c);
    }
    return new Map([...best].map(([productId, c]) => [productId, c.lotId]));
  }, [cells]);

  // Fetch latest inbound prices for lots used in rows
  const [inboundPriceMap, setInboundPriceMap] = useState(new Map());
  const fetchedLotIds = useRef(new Set());

  useEffect(() => {
    const lotIds = rows
      .map((r) => r.cellKey && cellByKey.get(r.cellKey)?.lotId)
      .filter((id) => id && !fetchedLotIds.current.has(id));

    if (lotIds.length === 0) return;

    lotIds.forEach((lotId) => {
      fetchedLotIds.current.add(lotId);
      lotApi.getLatestInboundPrice(lotId).then((res) => {
        const price = res?.latestInboundPrice ?? 0;
        setInboundPriceMap((prev) => new Map(prev).set(lotId, price));
      }).catch(() => {});
    });
  }, [rows, cellByKey]);

  const activeOptions = (list) =>
    list
      .filter((p) => String(p.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE')
      .map((p) => ({ value: p.id, label: p.name }));

  const customerOptions = useMemo(() => activeOptions(customers), [customers]);
  const supplierOptions = useMemo(() => activeOptions(suppliers), [suppliers]);

  const patchRow = (key, patch) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (key) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (payload) => outboundApi.create(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['outbounds', DEFAULT_WAREHOUSE_ID] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'storage-map'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-snapshot'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setCreated(toOutboundRecord(res));
      message.success('Đã ghi sổ phiếu xuất kho');
      window.scrollTo({ top: 0 });
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const submit = () => {
    const errs = {};
    if (issueType === 'RETAIL' && !form.customerId) {
      errs.customerId = 'Vui lòng chọn khách hàng';
    }
    if (issueType === 'RETURN_SUPPLIER' && !form.supplierId) {
      errs.supplierId = 'Vui lòng chọn NCC';
    }
    if (issueType === 'DISPOSAL' && !form.disposalReason) {
      errs.disposalReason = 'Vui lòng chọn lý do';
    }
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      message.error('Vui lòng kiểm tra lại các trường bắt buộc.');
      return;
    }
    setFormErrors({});

    const filled = rows.filter((r) => r.cellKey);
    if (!filled.length) {
      message.error('Cần xuất ít nhất 1 dòng hàng.');
      return;
    }

    for (const r of filled) {
      const cell = cellByKey.get(r.cellKey);
      if (!r.quantity || r.quantity < 1) {
        message.error('Số lượng xuất phải lớn hơn 0.');
        return;
      }
      if (r.quantity > cell.quantity) {
        message.error(`Lô ${cell.lotCode} tại ${cell.locationCode} chỉ còn ${cell.quantity}.`);
        return;
      }
      const fefoLotId = fefoLotIdByProduct.get(cell.productId);
      if (fefoLotId != null && cell.lotId !== fefoLotId && !r.overrideReason.trim()) {
        message.error(`Lô ${cell.lotCode} không phải lô FEFO — bắt buộc nhập lý do.`);
        return;
      }
    }

    const supplierName = supplierOptions.find((o) => o.value === form.supplierId)?.label;

    save({
      warehouseId: DEFAULT_WAREHOUSE_ID,
      issueType,
      // Chỉ RETAIL mới được gắn khách hàng, hai loại kia gửi lên là 400.
      customerId: issueType === 'RETAIL' ? form.customerId : null,
      note: buildNote(issueType, form, supplierName),
      details: filled.map((r) => {
        const cell = cellByKey.get(r.cellKey);
        return {
          lotId: cell.lotId,
          locationId: cell.locationId,
          quantity: r.quantity,
          overrideReason: r.overrideReason.trim() || null,
          unitPrice: r.unitPrice || 0,
        };
      }),
    });
  };

  const startNew = () => {
    setForm(emptyForm);
    setRows([newRow()]);
    setCreated(null);
    // Tồn đã bị trừ bởi phiếu vừa ghi sổ, lấy lại ảnh chụp mới.
    refetch();
  };

  // Đặt sau toàn bộ hook để không vi phạm rules-of-hooks.
  if (!canCreateOutbound) return <AccessDenied />;

  const breadcrumb = (last) => [
    { title: 'Nghiệp vụ kho' },
    { title: 'Phiếu xuất', href: '/outbounds' },
    { title: last },
  ];

  if (created) {
    return (
      <>
        <div className="no-print">
          <PageHeader title="Phiếu xuất kho đã lập" breadcrumb={breadcrumb('Kết quả')} />
        </div>
        <VoucherResult
          voucher={toVoucher('outbound', created)}
          title="Đã ghi sổ phiếu xuất kho"
          onEdit={() => setCreated(null)}
          onNew={startNew}
          listPath="/outbounds"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={TITLES[issueType]}
        subtitle={SUBTITLES[issueType]}
        breadcrumb={breadcrumb(TITLES[issueType])}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/outbounds')}>
            Quay lại
          </Button>
        }
      />

      {isError && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message="Không tải được tồn kho hiện tại"
          // Spring trả 403 với body chỉ có chữ "Forbidden" — nói rõ nguyên nhân
          // để người dùng khỏi tưởng là lỗi mạng.
          description={
            error?.response?.status === 403
              ? 'Máy chủ chưa cho vai trò của bạn xem tồn kho để lập phiếu xuất. Hiện chỉ Quản lý kho, Kế toán và Nhân viên kho gọi được.'
              : getErrorMessage(error)
          }
          action={
            <Button size="small" onClick={() => refetch()}>
              Thử lại
            </Button>
          }
        />
      )}

      <div className="flex flex-col gap-5 pb-10">
        {/* Hàng trên: Thông tin chung + Tóm tắt */}
        <div className={isMobile ? 'flex flex-col gap-4' : 'flex gap-5'}>
          <div className={isMobile ? '' : 'flex-[7] min-w-0'}>
            <OutboundGeneralInfo
              issueType={issueType}
              value={form}
              onChange={(v) => { setForm(v); setFormErrors({}); }}
              errors={formErrors}
              customerOptions={customerOptions}
              supplierOptions={supplierOptions}
              loadingPartners={loadingCustomers || loadingSuppliers}
              createdBy={fullName}
              theme={THEMES[issueType]}
            />
          </div>

          <div className={isMobile ? '' : 'flex-[3] min-w-0'}>
            <OrderSummary rows={rows} theme={THEMES[issueType]} />
          </div>
        </div>

        {/* Bảng hàng hoá — full width */}
        <OutboundLineItemsTable
          rows={rows}
          cells={cells}
          cellByKey={cellByKey}
          fefoLotIdByProduct={fefoLotIdByProduct}
          riskLotIds={riskLotIds}
          inboundPriceMap={inboundPriceMap}
          isLoading={isLoading}
          onPatchRow={patchRow}
          onAddRow={() => setRows((p) => [...p, newRow()])}
          onRemoveRow={removeRow}
        />
      </div>

      {/* Action bar — sticky bottom */}
      <div className={`sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_12px_rgba(0,0,0,0.05)] py-4 flex items-center justify-end gap-3 ${isMobile ? 'px-2' : 'px-1'}`}>
        {!isMobile && (
          <div className="flex-1 flex items-center gap-3 ml-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold ring-1 uppercase tracking-wide ${THEMES[issueType]?.badgeBg || ''}`}>
              <span className="relative flex h-2 w-2 mr-1">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${THEMES[issueType]?.dotPing || ''}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${THEMES[issueType]?.dot || ''}`}></span>
              </span>
              {THEMES[issueType]?.label}
            </span>
            <div className="text-[13px] text-slate-500/80">
              Phiếu xuất ghi sổ ngay, không qua bước duyệt.
            </div>
          </div>
        )}
        <Button size="large" onClick={() => navigate('/outbounds')}>
          Hủy
        </Button>
        <Popconfirm
          title={<span className={`font-bold uppercase ${THEMES[issueType]?.titleColor || ''}`}>XÁC NHẬN LẬP PHIẾU XUẤT?</span>}
          description="Phiếu được ghi sổ ngay và trừ tồn, sai chỉ có thể huỷ chứ không sửa."
          onConfirm={submit}
          okText="Xác nhận"
          cancelText="Hủy"
          disabled={!cells.length}
          okButtonProps={{ className: THEMES[issueType]?.btnPopConfirm || '' }}
        >
          <Button
            type="primary"
            size="large"
            icon={<CheckOutlined />}
            loading={isSaving}
            disabled={!cells.length}
            className={`min-w-[180px] font-bold rounded-xl shadow-lg ${THEMES[issueType]?.btnAction || ''}`}
          >
            Hoàn tất xuất kho
          </Button>
        </Popconfirm>
      </div>
    </>
  );
}

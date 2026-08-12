import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, App, Popconfirm } from 'antd';
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';
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

let rowSeq = 1;
const newRow = () => ({
  key: `r${rowSeq++}`,
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
      // Tồn đã bị trừ ngay khi ghi sổ.
      queryClient.invalidateQueries({ queryKey: ['inventory-snapshot'] });
      setCreated(toOutboundRecord(res));
      message.success('Đã ghi sổ phiếu xuất kho');
      window.scrollTo({ top: 0 });
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const submit = () => {
    if (issueType === 'RETAIL' && !form.customerId) {
      message.error('Phiếu xuất bán bắt buộc chọn khách hàng.');
      return;
    }
    if (issueType === 'RETURN_SUPPLIER' && !form.supplierId) {
      message.error('Phiếu trả NCC bắt buộc chọn nhà cung cấp.');
      return;
    }
    if (issueType === 'DISPOSAL' && !form.disposalReason) {
      message.error('Phiếu xuất huỷ bắt buộc chọn lý do.');
      return;
    }

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
          // Backend chặn đơn giá bằng 0, để trống thì bỏ hẳn field.
          unitPrice: r.unitPrice > 0 ? r.unitPrice : null,
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

      <div className={isMobile ? 'flex flex-col gap-4' : 'grid grid-cols-1 gap-4 xl:grid-cols-3'}>
        <div className={`flex flex-col gap-4 ${isMobile ? '' : 'xl:col-span-2'}`}>
          <OutboundGeneralInfo
            issueType={issueType}
            value={form}
            onChange={setForm}
            customerOptions={customerOptions}
            supplierOptions={supplierOptions}
            loadingPartners={loadingCustomers || loadingSuppliers}
            createdBy={fullName}
          />
          <OutboundLineItemsTable
            rows={rows}
            cells={cells}
            cellByKey={cellByKey}
            fefoLotIdByProduct={fefoLotIdByProduct}
            riskLotIds={riskLotIds}
            isLoading={isLoading}
            onPatchRow={patchRow}
            onAddRow={() => setRows((p) => [...p, newRow()])}
            onRemoveRow={removeRow}
          />
        </div>

        <div className={isMobile ? '' : 'xl:col-span-1'}>
          <div className={`flex flex-col gap-4 ${isMobile ? '' : 'xl:sticky xl:top-24'}`}>
            {!isMobile && <OrderSummary rows={rows} />}
            <Card className="border-hair" styles={{ body: { padding: isMobile ? 16 : 22 } }}>
              <Popconfirm
                title="Hoàn tất xuất kho?"
                description="Phiếu được ghi sổ ngay và trừ tồn, sai chỉ có thể huỷ chứ không sửa."
                onConfirm={submit}
                okText="Xác nhận"
                cancelText="Hủy"
                disabled={!cells.length}
              >
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckOutlined />}
                  loading={isSaving}
                  disabled={!cells.length}
                  block
                  className={isMobile ? 'min-h-[48px] text-base' : ''}
                >
                  Hoàn tất xuất kho
                </Button>
              </Popconfirm>
              {!isMobile && (
                <p className="mt-4 mb-0 text-center text-xs text-slate-400">
                  Phiếu xuất ghi sổ ngay, không qua bước duyệt. Xác nhận xong sẽ hiện tờ phiếu để xem
                  lại và in.
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

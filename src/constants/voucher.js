/**
 * Cấu hình chứng từ "giấy" — dùng để dựng UI phiếu giống mẫu in thật
 * (Mẫu 01-VT / 02-VT ban hành theo Thông tư 200/2014/TT-BTC).
 *
 * Mọi phần chữ cố định trên mặt phiếu (tên đơn vị, số hiệu mẫu, nhãn dòng,
 * ô chữ ký...) gom về đây để phiếu nhập / phiếu xuất dùng chung một khuôn.
 */

// Đơn vị chủ quản in ở góc trái mặt phiếu.
export const COMPANY = {
  name: 'CÔNG TY TNHH TM & DV STOCKFLOW',
  dept: 'Bộ phận: Kho trung tâm Bình Tân',
  address: 'Lô C3, KCN Vĩnh Lộc, Q. Bình Tân, TP. Hồ Chí Minh',
};

// Kho mặc định của bản demo (chưa có chọn kho ở khâu lập phiếu).
export const DEFAULT_WAREHOUSE = 'Kho trung tâm Bình Tân';

const FORM_NOTE = 'Ban hành theo Thông tư số 200/2014/TT-BTC ngày 22/12/2014 của Bộ Tài chính';

/**
 * Khác biệt giữa các loại chứng từ: tiêu đề, số hiệu mẫu, tài khoản Nợ/Có,
 * nhãn các dòng thông tin và bộ ô chữ ký ở chân phiếu.
 *
 * `layout` quyết định bảng giữa phiếu:
 *   money    – nhập/xuất kho: số lượng, đơn giá, thành tiền, cộng tiền bằng chữ.
 *   count    – kiểm kê: theo sổ sách / thực tế / thừa / thiếu, không có tiền.
 *   incident – hàng bất thường: số lượng, tình trạng, nguyên nhân.
 */
export const VOUCHER_KINDS = {
  inbound: {
    title: 'PHIẾU NHẬP KHO',
    formNo: 'Mẫu số 01 - VT',
    formNote: FORM_NOTE,
    layout: 'money',
    debit: '156',
    credit: '331',
    partnerLabel: 'Họ và tên người giao hàng',
    partnerFallback: '(Nhà cung cấp)',
    warehouseLabel: 'Nhập tại kho',
    quantityLabel: 'Thực nhập',
    reasonLabel: 'Theo hoá đơn/hợp đồng số',
    signers: ['Người lập phiếu', 'Người giao hàng', 'Thủ kho', 'Kế toán trưởng'],
    listPath: '/inbounds',
  },
  outbound: {
    title: 'PHIẾU XUẤT KHO',
    formNo: 'Mẫu số 02 - VT',
    formNote: FORM_NOTE,
    layout: 'money',
    debit: '632',
    credit: '156',
    partnerLabel: 'Họ và tên người nhận hàng',
    partnerFallback: '(Nội bộ)',
    subTypeLabel: 'Loại xuất',
    warehouseLabel: 'Xuất tại kho',
    quantityLabel: 'Thực xuất',
    reasonLabel: 'Lý do xuất kho',
    signers: ['Người lập phiếu', 'Người nhận hàng', 'Thủ kho', 'Kế toán trưởng'],
    listPath: '/outbounds',
  },
  stocktake: {
    title: 'BIÊN BẢN KIỂM KÊ VẬT TƯ, HÀNG HOÁ',
    cardTitle: 'BIÊN BẢN KIỂM KÊ',
    formNo: 'Mẫu số 05 - VT',
    formNote: FORM_NOTE,
    layout: 'count',
    partnerLabel: 'Ban kiểm kê gồm',
    partnerFallback: 'Ban kiểm kê kho',
    warehouseLabel: 'Kiểm kê tại kho',
    reasonLabel: 'Lý do / phạm vi kiểm kê',
    quantityLabel: 'Số lượng',
    signers: ['Người lập biên bản', 'Thủ kho', 'Kế toán trưởng', 'Trưởng ban kiểm kê'],
    listPath: '/stocktakes',
  },
  abnormal: {
    title: 'BIÊN BẢN HÀNG HOÁ BẤT THƯỜNG',
    cardTitle: 'BIÊN BẢN HÀNG BẤT THƯỜNG',
    formNo: 'Biểu mẫu BB - 01',
    // Không phải mẫu của Bộ Tài chính nên ghi rõ là biểu mẫu nội bộ.
    formNote: 'Ban hành theo Quy chế quản lý kho của Công ty',
    layout: 'incident',
    partnerLabel: 'Người phát hiện',
    partnerFallback: 'Bộ phận kho',
    subTypeLabel: 'Tình trạng',
    warehouseLabel: 'Phát hiện tại kho',
    reasonLabel: 'Loại bất thường',
    quantityLabel: 'Số lượng',
    signers: ['Người lập biên bản', 'Thủ kho', 'Kế toán trưởng', 'Giám đốc'],
    listPath: '/abnormal-stocks',
  },
};

/**
 * Con dấu đóng trên mặt phiếu theo trạng thái. `null` = không đóng dấu
 * (phiếu nháp / đang lập chưa có dấu).
 */
export const VOUCHER_STAMPS = {
  POSTED: { label: 'ĐÃ GHI SỔ', color: '#1d4ed8' },
  APPROVED: { label: 'ĐÃ DUYỆT', color: '#15803d' },
  PENDING: { label: 'CHỜ DUYỆT', color: '#b45309' },
  REJECTED: { label: 'TỪ CHỐI', color: '#b91c1c' },
  VOIDED: { label: 'ĐÃ HUỶ', color: '#b91c1c' },
};

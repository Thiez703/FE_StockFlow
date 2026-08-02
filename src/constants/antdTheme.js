/**
 * Cấu hình theme cho Ant Design (dùng ở ConfigProvider trong App.jsx).
 *
 * Tone chủ đạo: DEEP ENTERPRISE BLUE — navy đậm cho nav/brand, royal blue cho CTA.
 * KHÔNG dùng xanh sky mặc định của AntD. Chỉnh màu / bo góc / chiều cao control
 * tập trung tại đây để toàn app đồng bộ. Các token màu này khớp với @theme trong
 * index.css (Tailwind) — sửa 1 chỗ nhớ sửa chỗ kia.
 */

// Palette dùng chung — tiện tái sử dụng ở chart, badge, status pill...
export const navy = {
  900: '#0A1E3F', // nền nav/brand đậm nhất
  700: '#12356B', // xanh đậm phụ
};

export const royal = {
  600: '#1E5AF0', // Primary — CTA / active (royal blue, có lực)
  500: '#3B74F5',
  tint: '#E8EFFF', // nền tint nhạt
};

const semantic = {
  success: '#16A34A',
  warning: '#F59E0B', // cũng là accent amber, dùng tiết chế
  danger: '#DC2626',
  info: '#1E5AF0',
};

const neutral = {
  text: '#0F172A',
  textSub: '#64748B',
  border: '#E2E8F0',
  page: '#F6F8FC',
  surface: '#FFFFFF',
};

const fontStack =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const antdTheme = {
  cssVar: true,
  token: {
    colorPrimary: royal[600],
    colorInfo: semantic.info,
    colorSuccess: semantic.success,
    colorWarning: semantic.warning,
    colorError: semantic.danger,
    colorLink: royal[600],
    colorTextBase: neutral.text,
    colorBorder: neutral.border,
    colorBorderSecondary: '#EEF2F7',
    colorBgLayout: neutral.page,
    borderRadius: 8,
    fontFamily: fontStack,
    fontSize: 14,
    controlHeight: 40,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: navy[900],
      headerHeight: 64,
      headerPadding: '0 24px',
      bodyBg: neutral.page,
    },
    // Menu ngang trên nền navy của TopNav (chữ sáng, hover tint).
    Menu: {
      horizontalItemSelectedColor: '#FFFFFF',
      horizontalItemHoverColor: '#FFFFFF',
      itemColor: '#C7D6F5',
      fontSize: 14,
      itemBorderRadius: 8,
    },
    Card: {
      borderRadiusLG: 16,
      paddingLG: 22,
      boxShadowTertiary: '0 1px 2px rgba(15, 23, 42, 0.04)',
    },
    Button: {
      controlHeight: 40,
      borderRadius: 8,
      fontWeight: 500,
      primaryShadow: '0 8px 18px rgba(30, 90, 240, 0.22)',
    },
    Input: { controlHeight: 40, borderRadius: 8, paddingBlock: 8 },
    InputNumber: { controlHeight: 40, borderRadius: 8 },
    Select: { controlHeight: 40, borderRadius: 8 },
    DatePicker: { controlHeight: 40, borderRadius: 8 },
    Table: {
      headerBg: '#F1F5F9',
      headerColor: '#475569',
      headerSplitColor: 'transparent',
      borderColor: '#EEF2F7',
      rowHoverBg: '#F1F6FF',
      cellPaddingBlock: 13,
      stickyScrollBarBg: '#CBD5E1',
    },
    Tag: { borderRadiusSM: 6 },
    Statistic: { titleFontSize: 13, contentFontSize: 26 },
    Modal: { borderRadiusLG: 16, titleFontSize: 18 },
    Tabs: { inkBarColor: royal[600], itemSelectedColor: royal[600] },
    Segmented: { itemSelectedBg: royal.tint, itemSelectedColor: royal[600] },
  },
};

export default antdTheme;

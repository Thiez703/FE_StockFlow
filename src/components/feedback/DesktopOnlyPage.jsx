import { Result, Button } from 'antd';
import { DesktopOutlined } from '@ant-design/icons';

/**
 * Trang thông báo khi user truy cập chức năng chỉ dành cho desktop trên mobile.
 * Hiển thị thay vì để layout vỡ hoặc trắng trang.
 */
export default function DesktopOnlyPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Result
        icon={<DesktopOutlined className="!text-5xl !text-slate-400" />}
        title={
          <span className="text-lg font-semibold text-ink">
            Chức năng này tối ưu cho máy tính
          </span>
        }
        subTitle={
          <span className="text-sm text-ink-sub leading-relaxed">
            Vui lòng truy cập trên máy tính hoặc máy tính bảng để có trải nghiệm tốt nhất.
          </span>
        }
        extra={
          <Button
            type="primary"
            onClick={() => window.history.back()}
            className="min-h-[44px] min-w-[120px]"
          >
            Quay lại
          </Button>
        }
      />
    </div>
  );
}

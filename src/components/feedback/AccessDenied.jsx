import { Result } from 'antd';
import { LockOutlined } from '@ant-design/icons';

/**
 * Trang thông báo không có quyền truy cập.
 * Hiển thị khi user không đủ role cho trang hiện tại.
 */
export default function AccessDenied() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Result
        icon={<LockOutlined className="!text-5xl !text-slate-400" />}
        title={<span className="text-lg font-semibold text-ink">Bạn không có quyền truy cập trang này</span>}
        subTitle={
          <span className="text-sm text-ink-sub">
            Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn.
          </span>
        }
      />
    </div>
  );
}

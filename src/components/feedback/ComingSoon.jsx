import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

/**
 * Trang 404 tối giản cho các đường dẫn không khớp route nào.
 */
export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Result
        status="404"
        title="Không tìm thấy trang"
        subTitle="Đường dẫn bạn truy cập không tồn tại hoặc đã được di chuyển."
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            Về Bảng điều khiển
          </Button>
        }
      />
    </div>
  );
}

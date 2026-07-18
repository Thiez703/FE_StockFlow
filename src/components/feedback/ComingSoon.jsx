import { Button, Result } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

/**
 * Màn hình tạm cho các mục menu chưa xây dựng, giúp demo điều hướng không bị trắng trang.
 */
export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Result
        icon={<ToolOutlined className="text-blue-500" />}
        title="Tính năng đang được phát triển"
        subTitle="Màn hình này nằm trong kế hoạch. Hiện tại bạn có thể xem trang Bảng điều khiển và Nhập kho."
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            Về Bảng điều khiển
          </Button>
        }
      />
    </div>
  );
}

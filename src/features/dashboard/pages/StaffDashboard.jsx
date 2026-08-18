import { Button } from 'antd';
import { 
  ImportOutlined, 
  ExportOutlined,
  ShoppingCartOutlined,
  UndoOutlined,
  DeleteOutlined,
  PlusSquareOutlined,
  AppstoreAddOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';

export default function StaffDashboard() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Bảng điều khiển nhân viên"
        subtitle="Thực hiện nhanh các nghiệp vụ nhập/xuất kho"
        breadcrumb={[{ title: 'Tổng quan' }, { title: 'Nhân viên kho' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-4">
        {/* Nhóm phiếu nhập */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-bl-full opacity-50 -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ImportOutlined className="text-xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 m-0">Nghiệp vụ Nhập Kho</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              type="primary" 
              size="large"
              icon={<PlusSquareOutlined />} 
              onClick={() => navigate('/inbounds/create/new')}
              className="bg-emerald-600 hover:bg-emerald-500 border-none shadow-md shadow-emerald-500/20 h-14 text-base flex justify-start pl-6 items-center"
            >
              <div className="flex flex-col items-start ml-2 leading-tight">
                <span>Nhập sản phẩm mới</span>
                <span className="text-xs font-normal opacity-80 mt-0.5">Sản phẩm chưa có trong kho</span>
              </div>
            </Button>
            
            <Button 
              size="large"
              icon={<AppstoreAddOutlined />} 
              onClick={() => navigate('/inbounds/create/old')}
              className="border-emerald-200 text-emerald-700 hover:text-emerald-600 hover:border-emerald-400 bg-emerald-50 h-14 text-base flex justify-start pl-6 items-center"
            >
              <div className="flex flex-col items-start ml-2 leading-tight">
                <span>Nhập hàng bổ sung</span>
                <span className="text-xs font-normal opacity-80 mt-0.5">Thêm vào lô/sản phẩm đã có</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Nhóm phiếu xuất */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-bl-full opacity-50 -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ExportOutlined className="text-xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 m-0">Nghiệp vụ Xuất Kho</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              type="primary" 
              size="large"
              icon={<ShoppingCartOutlined />} 
              onClick={() => navigate('/outbounds/create/retail')}
              className="bg-blue-600 hover:bg-blue-500 border-none shadow-md shadow-blue-500/20 h-14 text-base flex justify-start pl-6 items-center"
            >
              <div className="flex flex-col items-start ml-2 leading-tight">
                <span>Xuất bán lẻ</span>
                <span className="text-xs font-normal opacity-80 mt-0.5">Xuất hàng cho khách mua</span>
              </div>
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                size="large"
                icon={<UndoOutlined />} 
                onClick={() => navigate('/outbounds/create/return_supplier')}
                className="border-amber-200 text-amber-700 hover:text-amber-600 hover:border-amber-400 bg-amber-50 h-14 text-base flex justify-start pl-4 items-center"
              >
                <span>Trả Nhà Cung Cấp</span>
              </Button>
              
              <Button 
                size="large"
                icon={<DeleteOutlined />} 
                onClick={() => navigate('/outbounds/create/disposal')}
                className="border-rose-200 text-rose-700 hover:text-rose-600 hover:border-rose-400 bg-rose-50 h-14 text-base flex justify-start pl-4 items-center"
              >
                <span>Xuất Hủy</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { Tabs } from 'antd';
import PageHeader from '@/components/ui/PageHeader';
import ProductsTab from '@/features/master-data/components/ProductsTab';
import CategoriesTab from '@/features/master-data/components/CategoriesTab';
import UnitsTab from '@/features/master-data/components/UnitsTab';
import LocationsTab from '@/features/master-data/components/LocationsTab';
import LotsTab from '@/features/master-data/components/LotsTab';
import PartnersTab from '@/features/master-data/components/PartnersTab';

const TAB_ITEMS = [
  { key: 'products', label: 'Sản phẩm', children: <ProductsTab /> },
  { key: 'categories', label: 'Danh mục', children: <CategoriesTab /> },
  { key: 'units', label: 'Đơn vị tính', children: <UnitsTab /> },
  { key: 'locations', label: 'Vị trí lưu trữ', children: <LocationsTab /> },
  { key: 'lots', label: 'Lô hàng', children: <LotsTab /> },
  { key: 'partners', label: 'Nhà cung cấp & Khách hàng', children: <PartnersTab /> },
];

/**
 * Gộp 5 màn hình dữ liệu nền (Danh mục, Đơn vị tính, Vị trí, Lô hàng, Đối tác)
 * vào 1 trang dạng Tab — các trang này đều là CRUD bảng nhỏ, gộp lại để menu gọn hơn.
 */
export default function MasterDataPage() {
  const [tab, setTab] = useState('products');

  return (
    <>
      <PageHeader
        title="Dữ liệu nền"
        subtitle="Sản phẩm, danh mục, đơn vị tính, vị trí lưu trữ, lô hàng và đối tác"
        breadcrumb={[{ title: 'Dữ liệu nền' }]}
      />

      <Tabs activeKey={tab} onChange={setTab} items={TAB_ITEMS} />
    </>
  );
}

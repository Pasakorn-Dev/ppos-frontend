import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import BranchPriceModal from '../components/BranchPriceModal';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [permissions, setPermissions] = useState({ can_add: false, can_edit: false, can_delete: false });
  const [loading, setLoading] = useState(true);

  // State สำหรับเก็บข้อมูล Master Data (เอาไว้ใส่ Select Option)
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [units, setUnits] = useState([]);

  // State สำหรับ Modal เพิ่ม/แก้ไข สินค้า
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category_id: '',
    supplier_id: '',
    unit_id: '',
    price: '',
    reorder_point: 0,
    is_active: true
  });

  // State สำหรับ Modal กำหนดราคาสาขา
  const [selectedProductForPrice, setSelectedProductForPrice] = useState(null);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // 1. ดึงสิทธิ์การใช้งานเมนู
    fetch('http://localhost:5000/api/menus', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const currentMenu = data.data.find(m => m.link === '/products');
          
          // เปลี่ยนจาก currentMenu.permissions เป็น currentMenu ตรงๆ
          if (currentMenu) {
            setPermissions({
              can_add: currentMenu.can_add === true || currentMenu.can_add === 1,
              can_edit: currentMenu.can_edit === true || currentMenu.can_edit === 1,
              can_delete: currentMenu.can_delete === true || currentMenu.can_delete === 1,
            });
          }
        }
      })
      .catch(err => console.error('Error fetching permissions:', err));

    // 2. ดึง Master Data 
    fetchMasterData(token);
    // 3. ดึงรายการสินค้า
    fetchProducts(token);
  }, []);
  const fetchMasterData = (token) => {
    fetch('http://localhost:5000/api/master/categories', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json()).then(data => data.success && setCategories(data.data)).catch(console.error);

    fetch('http://localhost:5000/api/master/suppliers', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json()).then(data => data.success && setSuppliers(data.data)).catch(console.error);

    fetch('http://localhost:5000/api/master/units', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json()).then(data => data.success && setUnits(data.data)).catch(console.error);
  };

  const fetchProducts = (token = localStorage.getItem('token')) => {
    setLoading(true);
    fetch('http://localhost:5000/api/products', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success) setProducts(data.data);
      })
      .catch(err => console.error('Error fetching products:', err))
      .finally(() => setLoading(false));
  };

  // เปิด Modal เพิ่ม / แก้ไข สินค้า
  const openModal = (product = null) => {
    if (product) {
      setEditId(product.id);
      setFormData({
        barcode: product.barcode || '',
        name: product.name || '',
        category_id: product.category_id || '',
        supplier_id: product.supplier_id || '',
        unit_id: product.unit_id || '',
        price: product.price || '',
        reorder_point: product.reorder_point || 0,
        is_active: product.is_active
      });
    } else {
      setEditId(null);
      setFormData({
        barcode: '',
        name: '',
        category_id: '',
        supplier_id: '',
        unit_id: '',
        price: '',
        reorder_point: 0,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // บันทึก เพิ่ม/แก้ไข สินค้า
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `http://localhost:5000/api/products/${editId}` : 'http://localhost:5000/api/products';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: editId ? 'แก้ไขสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ',
          timer: 1500,
          showConfirmButton: false
        });
        closeModal();
        fetchProducts(token);
      } else {
        Swal.fire('เกิดข้อผิดพลาด', data.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    }
  };

  // ลบสินค้า
  const handleDelete = (id) => {
    Swal.fire({
      title: 'ยืนยันการลบสินค้า?',
      text: "ข้อมูลสินค้านี้จะถูกลบออกจากระบบอย่างถาวร!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(`http://localhost:5000/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            Swal.fire('ลบสำเร็จ!', 'ลบสินค้าเรียบร้อยแล้ว', 'success');
            fetchProducts(token);
          } else {
            Swal.fire('เกิดข้อผิดพลาด', data.message, 'error');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  // เปิด Modal กำหนดราคาสาขา
  const openBranchPriceModal = (product) => {
    setSelectedProductForPrice(product);
    setIsPriceModalOpen(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">จัดการสินค้า</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">เพิ่ม แก้ไข และกำหนดราคาสินค้าประจำสาขา</p>
        </div>
        {permissions.can_add && (
          <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 text-sm font-medium transition-colors">
            <i className="fas fa-plus"></i> เพิ่มสินค้าใหม่
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 text-sm">
            <tr>
              <th className="p-4">บาร์โค้ด</th>
              <th className="p-4">ชื่อสินค้า</th>
              <th className="p-4">หมวดหมู่</th>
              <th className="p-4">ซัพพลายเออร์</th>
              <th className="p-4">ราคากลาง</th>
              <th className="p-4">หน่วยนับ</th>
              <th className="p-4">สถานะ</th>
              <th className="p-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr><td colSpan="8" className="p-8 text-center text-gray-500">กำลังโหลดข้อมูลสินค้า...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="8" className="p-8 text-center text-gray-500">ไม่มีข้อมูลสินค้าในระบบ</td></tr>
            ) : (
              products.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 last:border-0 transition-colors">
                  <td className="p-4 font-mono text-xs">{item.barcode || '-'}</td>
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{item.category_name || '-'}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{item.supplier_name || '-'}</td>
                  <td className="p-4 text-blue-600 dark:text-blue-400 font-bold">฿{Number(item.price).toFixed(2)}</td>
                  <td className="p-4">{item.unit_name || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                      {item.is_active ? 'เปิดขาย' : 'ปิดขาย'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    
                    {/* ปุ่มกำหนดราคาสาขา */}
                    <button 
                      onClick={() => openBranchPriceModal(item)} 
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg shadow-sm text-xs font-medium transition-colors"
                      title="กำหนดราคาเฉพาะสาขา"
                    >
                      <i className="fas fa-tags mr-1"></i> ราคาสาขา
                    </button>

                    {permissions.can_edit && (
                      <button onClick={() => openModal(item)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg shadow-sm text-xs font-medium transition-colors">
                        <i className="fas fa-edit mr-1"></i> แก้ไข
                      </button>
                    )}
                    {permissions.can_delete && (
                      <button onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg shadow-sm text-xs font-medium transition-colors">
                        <i className="fas fa-trash-alt mr-1"></i> ลบ
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal เพิ่ม/แก้ไข สินค้า */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {editId ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัสบาร์โค้ด</label>
                  <input type="text" name="barcode" value={formData.barcode} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="885XXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อสินค้า *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="ชื่อสินค้า" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หมวดหมู่</label>
                  <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ซัพพลายเออร์</label>
                  <select name="supplier_id" value={formData.supplier_id} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- เลือกซัพพลายเออร์ --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หน่วยนับ</label>
                  <select name="unit_id" value={formData.unit_id} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- เลือกหน่วยนับ --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.unit_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ราคากลาง (บาท) *</label>
                  <input type="number" step="0.01" name="price" required value={formData.price} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                </div>
              </div>

              {editId && (
                <div className="flex items-center pt-2">
                  <input type="checkbox" id="is_active_prod" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-4 h-4 text-blue-600 rounded" />
                  <label htmlFor="is_active_prod" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">เปิดขายสินค้านี้</label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 rounded-lg transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-colors">
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal กำหนดราคาสาขา */}
      <BranchPriceModal 
        product={selectedProductForPrice}
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        onSaved={fetchProducts}
      />
    </div>
  );
}
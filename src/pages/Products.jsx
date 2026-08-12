import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [permissions, setPermissions] = useState({ can_add: false, can_edit: false, can_delete: false });
  const [loading, setLoading] = useState(true);

  // State สำหรับเก็บข้อมูล Master Data (เอาไว้ใส่ Select Option)
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [units, setUnits] = useState([]);

  // State สำหรับ Modal และ Form สินค้า
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category_id: '',
    supplier_id: '',
    unit_id: '',
    unit: '', // ชื่อหน่วยสำรอง
    price: '',
    reorder_point: 0,
    image_url: '',
    is_active: true
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // 1. ดึงสิทธิ์การใช้งานเมนู
    fetch('http://localhost:5000/api/menus', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const productMenu = data.data.find(m => m.link === '/products');
          if (productMenu) {
            setPermissions({
              can_add: productMenu.can_add,
              can_edit: productMenu.can_edit,
              can_delete: productMenu.can_delete
            });
          }
        }
      });

    // 2. ดึงข้อมูล Master Data สำหรับทำ Dropdown
    fetchMasterData(token);

    // 3. โหลดรายการสินค้า
    fetchProducts(token);
  }, []);

  const fetchMasterData = async (token) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [catRes, supRes, unitRes] = await Promise.all([
        fetch('http://localhost:5000/api/master/categories', { headers }),
        fetch('http://localhost:5000/api/master/suppliers', { headers }),
        fetch('http://localhost:5000/api/master/units', { headers })
      ]);

      const catData = await catRes.json();
      const supData = await supRes.json();
      const unitData = await unitRes.json();

      if (catData.success) setCategories(catData.data);
      if (supData.success) setSuppliers(supData.data);
      if (unitData.success) setUnits(unitData.data);
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  };

  const fetchProducts = async (token) => {
    try {
      const res = await fetch('http://localhost:5000/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setProducts(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบสินค้า?',
      text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire('ลบสำเร็จ!', 'ข้อมูลสินค้าถูกลบเรียบร้อยแล้ว', 'success');
        setProducts(products.filter(p => p.id !== id));
      } else {
        Swal.fire('ลบไม่สำเร็จ!', data.message, 'error');
      }
    } catch (error) {
      Swal.fire('ข้อผิดพลาด!', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditId(product.id);
      setFormData({
        barcode: product.barcode || '',
        name: product.name || '',
        category_id: product.category_id || '',
        supplier_id: product.supplier_id || '',
        unit_id: product.unit_id || '',
        unit: product.unit || '',
        price: product.price || '',
        reorder_point: product.reorder_point || 0,
        image_url: product.image_url || '',
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
        unit: '',
        price: '',
        reorder_point: 0,
        image_url: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // พิเศษ: หากเลือก unit_id ให้ดึงชื่อ unit มาเก็บบันทึกสำรองไว้ด้วยอัตโนมัติ
    if (name === 'unit_id') {
      const selectedUnit = units.find(u => u.id === Number(value));
      setFormData({
        ...formData,
        unit_id: value,
        unit: selectedUnit ? selectedUnit.unit_name : ''
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = editId 
      ? `http://localhost:5000/api/products/${editId}` 
      : 'http://localhost:5000/api/products';
    const method = editId ? 'PUT' : 'POST';

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
        Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
          .fire({ icon: 'success', title: editId ? 'แก้ไขสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ' });
        
        closeModal();
        fetchProducts(token);
      } else {
        Swal.fire('ข้อผิดพลาด', data.message, 'warning');
      }
    } catch (error) {
      Swal.fire('ระบบขัดข้อง', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  if (loading) return <div className="p-8 text-center dark:text-white">กำลังโหลดข้อมูลสินค้า...</div>;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">จัดการสินค้า (Products)</h2>
        {permissions.can_add && (
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-2"
            onClick={() => openModal()}
          >
            <i className="fas fa-plus"></i> เพิ่มสินค้าใหม่
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
            <tr>
              <th className="p-4">บาร์โค้ด</th>
              <th className="p-4">ชื่อสินค้า</th>
              <th className="p-4">ราคาขาย</th>
              <th className="p-4">หน่วยนับ</th>
              <th className="p-4">สถานะ</th>
              <th className="p-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">ไม่มีข้อมูลสินค้า</td></tr>
            ) : (
              products.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 last:border-0">
                  <td className="p-4 font-mono text-sm">{item.barcode || '-'}</td>
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4 text-blue-600 dark:text-blue-400 font-bold">฿{Number(item.price).toFixed(2)}</td>
                  <td className="p-4">{item.unit}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${item.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                      {item.is_active ? 'เปิดขาย' : 'ปิดขาย'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    {permissions.can_edit && (
                      <button onClick={() => openModal(item)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg shadow-sm text-sm">
                        <i className="fas fa-edit"></i> แก้ไข
                      </button>
                    )}
                    {permissions.can_delete && (
                      <button onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg shadow-sm text-sm">
                        <i className="fas fa-trash-alt"></i> ลบ
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal เพิ่ม/แก้ไขสินค้า */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{editId ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-200"><i className="fas fa-times text-xl"></i></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">บาร์โค้ด (Barcode)</label>
                <input type="text" name="barcode" value={formData.barcode} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none" placeholder="เช่น 8850123456789" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อสินค้า *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none" placeholder="ชื่อสินค้า" />
              </div>

              {/* หมวดหมู่ และ ซัพพลายเออร์ (ดึงมาจาก Master API) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หมวดหมู่สินค้า</label>
                  <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none">
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ซัพพลายเออร์</label>
                  <select name="supplier_id" value={formData.supplier_id} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none">
                    <option value="">-- เลือกซัพพลายเออร์ --</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ราคาขาย (บาท) *</label>
                  <input type="number" step="0.01" name="price" required value={formData.price} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หน่วยนับ *</label>
                  <select name="unit_id" required value={formData.unit_id} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none">
                    <option value="">-- เลือกหน่วยนับ --</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.unit_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">จุดเตือนสต็อก (Reorder Point)</label>
                  <input type="number" name="reorder_point" value={formData.reorder_point} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ลิงก์รูปภาพ (Image URL)</label>
                  <input type="text" name="image_url" value={formData.image_url} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none" placeholder="https://..." />
                </div>
              </div>

              {editId && (
                <div className="flex items-center pt-2">
                  <input type="checkbox" id="is_active_prod" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-4 h-4 text-blue-600 rounded" />
                  <label htmlFor="is_active_prod" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">เปิดขายสินค้านี้</label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 rounded-lg">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
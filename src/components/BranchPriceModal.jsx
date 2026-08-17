import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function BranchPriceModal({ product, isOpen, onClose, onSaved }) {
  const [branchPrices, setBranchPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      fetchBranchPrices();
    }
  }, [isOpen, product]);

  const fetchBranchPrices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/products/${product.id}/branch-prices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBranchPrices(data.data);
      } else {
        Swal.fire('ข้อผิดพลาด', data.message || 'ไม่สามารถโหลดข้อมูลราคาสาขาได้', 'error');
      }
    } catch (err) {
      console.error('Fetch branch prices error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (branchId, field, value) => {
    setBranchPrices(prev =>
      prev.map(item =>
        item.branch_id === branchId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/products/${product.id}/branch-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prices: branchPrices })
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกราคาสาขาสำเร็จ',
          timer: 1500,
          showConfirmButton: false
        });
        if (onSaved) onSaved();
        onClose();
      } else {
        Swal.fire('เกิดข้อผิดพลาด', data.message || 'ไม่สามารถบันทึกได้', 'error');
      }
    } catch (err) {
      console.error('Save branch prices error:', err);
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-700 transform transition-all">
        
        {/* Header */}
        <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <i className="fas fa-tags text-purple-600 dark:text-purple-400"></i>
              กำหนดราคาขายตามสาขา
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              สินค้า: <span className="font-semibold text-blue-600 dark:text-blue-400">{product?.name}</span> 
              <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">
                ราคากลาง: ฿{Number(product?.price || 0).toFixed(2)}
              </span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 custom-scrollbar">
          {loading ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
              <i className="fas fa-circle-notch fa-spin text-2xl text-blue-500"></i>
              <span>กำลังดึงข้อมูลสาขาตามสิทธิ์...</span>
            </div>
          ) : branchPrices.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              ไม่พบสาขาที่คุณมีสิทธิ์จัดการ
            </div>
          ) : (
            branchPrices.map(item => (
              <div 
                key={item.branch_id} 
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-750 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-sm"
              >
                {/* ชื่อสาขา */}
                <div className="sm:w-1/3">
                  <span className="font-bold text-gray-800 dark:text-gray-200 block text-sm flex items-center gap-2">
                    <i className="fas fa-store text-blue-500"></i>
                    {item.branch_name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {item.price !== null && item.price !== '' ? 'ใช้ราคาเฉพาะสาขา' : 'ใช้ราคากลางอัตโนมัติ'}
                  </span>
                </div>

                {/* ช่องกรอกราคา Override */}
                <div className="sm:w-1/3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    ราคาขายสาขา (฿)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder={`ราคากลาง (฿${product?.price})`}
                    value={item.price ?? ''}
                    onChange={(e) => handleInputChange(item.branch_id, 'price', e.target.value)}
                    className="w-full px-3 py-1.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  />
                </div>

                {/* สวิตช์เปิด/ปิดขายเฉพาะสาขา */}
                <div className="sm:w-1/4 flex items-center sm:justify-end gap-2 pt-1 sm:pt-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={item.is_active}
                      onChange={(e) => handleInputChange(item.branch_id, 'is_active', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                    <span className="ml-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {item.is_active ? 'เปิดขาย' : 'ปิดขาย'}
                    </span>
                  </label>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900">
          <button 
            onClick={onClose} 
            className="px-4 py-2 border dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> กำลังบันทึก...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> บันทึกราคาสาขา
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
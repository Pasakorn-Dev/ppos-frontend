// src/pages/Branches.jsx
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [permissions, setPermissions] = useState({ can_add: false, can_edit: false, can_delete: false });
  const [loading, setLoading] = useState(true);

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ branch_code: '', branch_name: '', contact_number: '', address: '', is_active: true });

  useEffect(() => {
    const token = localStorage.getItem('token');
    // โหลดสิทธิ์
    fetch('http://localhost:5000/api/menus', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const branchMenu = data.data.find(m => m.link === '/branches');
          if (branchMenu) setPermissions({ can_add: branchMenu.can_add, can_edit: branchMenu.can_edit, can_delete: branchMenu.can_delete });
        }
      });
    // โหลดสาขา
    fetchBranches(token);
  }, []);

  const fetchBranches = async (token) => {
    try {
      const res = await fetch('http://localhost:5000/api/branches', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setBranches(data.data);
      setLoading(false);
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบข้อมูล?', text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#6b7280',
      confirmButtonText: 'ใช่, ลบเลย!', cancelButtonText: 'ยกเลิก'
    });

    if (!result.isConfirmed) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/branches/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        Swal.fire('ลบสำเร็จ!', 'ข้อมูลสาขาถูกลบเรียบร้อยแล้ว', 'success');
        setBranches(branches.filter(b => b.id !== id));
      } else { Swal.fire('ลบไม่สำเร็จ!', data.message, 'error'); }
    } catch (error) { Swal.fire('ข้อผิดพลาด!', 'เกิดข้อผิดพลาดในการลบข้อมูล', 'error'); }
  };

  const openModal = (branch = null) => {
    if (branch) {
      setEditId(branch.id);
      setFormData({ ...branch });
    } else {
      setEditId(null);
      setFormData({ branch_code: '', branch_name: '', contact_number: '', address: '', is_active: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditId(null); };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = editId ? `http://localhost:5000/api/branches/${editId}` : 'http://localhost:5000/api/branches';
    const method = editId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formData) });
      const data = await res.json();

      if (data.success) {
        Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
            .fire({ icon: 'success', title: editId ? 'แก้ไขสาขาสำเร็จ' : 'เพิ่มสาขาสำเร็จ' });
        closeModal();
        fetchBranches(token);
      } else { Swal.fire('ข้อผิดพลาด', data.message, 'warning'); }
    } catch (error) { Swal.fire('ระบบขัดข้อง', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error'); }
  };

  if (loading) return <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">จัดการสาขา (Branches)</h2>
        {permissions.can_add && (
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-2" onClick={() => openModal()}>
            <i className="fas fa-plus"></i> เพิ่มสาขา
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
            <tr>
              <th className="p-4">รหัสสาขา</th>
              <th className="p-4">ชื่อสาขา</th>
              <th className="p-4">เบอร์ติดต่อ</th>
              <th className="p-4">สถานะ</th>
              <th className="p-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 ? (
              <tr><td colSpan="5" className="p-4 text-center text-gray-500">ไม่มีข้อมูลสาขา</td></tr>
            ) : (
              branches.map((branch) => (
                <tr key={branch.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 last:border-0">
                  <td className="p-4 font-medium">{branch.branch_code}</td>
                  <td className="p-4">{branch.branch_name}</td>
                  <td className="p-4">{branch.contact_number || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${branch.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                      {branch.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                      {permissions.can_edit && (
                        <button 
                          onClick={() => openModal(branch)} 
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-2 text-sm"
                        >
                          <i className="fas fa-edit"></i> แก้ไข
                        </button>
                      )}
                      {permissions.can_delete && (
                        <button 
                          onClick={() => handleDelete(branch.id)} 
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-2 text-sm"
                        >
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{editId ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-200"><i className="fas fa-times text-xl"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัสสาขา *</label><input type="text" name="branch_code" required value={formData.branch_code} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อสาขา *</label><input type="text" name="branch_name" required value={formData.branch_name} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เบอร์ติดต่อ</label><input type="text" name="contact_number" value={formData.contact_number} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ที่อยู่</label><textarea name="address" rows="2" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white outline-none resize-none"></textarea></div>
              {editId && (
                <div className="flex items-center pt-2">
                  <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-4 h-4 text-blue-600 rounded" />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">เปิดใช้งานสาขานี้</label>
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
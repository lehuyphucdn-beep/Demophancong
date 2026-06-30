import React, { useState, useMemo } from "react";
import { ScheduleItem } from "../types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { Search, UserPlus, Plus, Trash2, Filter, RotateCcw, AlertTriangle, CheckCircle } from "lucide-react";
import { CHART_COLORS, getStringColor } from "../utils/colors";

interface AssignmentTabProps {
  items: ScheduleItem[];
  setItems: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
  lecturers: string[];
  addLecturer: (name: string) => void;
  resetData: () => void;
}

export default function AssignmentTab({
  items,
  setItems,
  lecturers,
  addLecturer,
  resetData
}: AssignmentTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("All");
  const [selectedInstructorFilter, setSelectedInstructorFilter] = useState("All");
  const [newLecturerName, setNewLecturerName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Add a new assignment item
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemData, setNewItemData] = useState({
    code: "",
    name: "",
    className: "",
    major: "",
    studentCount: 20,
    part: "2 Part",
    instructor: "",
    hours: 45
  });

  // Unique majors for filter
  const majors = useMemo(() => {
    const list = new Set<string>();
    items.forEach(item => {
      if (item.major) list.add(item.major);
    });
    return ["All", ...Array.from(list)];
  }, [items]);

  // Handle lecturer change
  const handleLecturerChange = (id: string, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, instructor: value };
      }
      return item;
    }));
  };

  // Add new assignment to state
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.code || !newItemData.className) {
      alert("Vui lòng nhập Mã môn và Lớp!");
      return;
    }

    const newItem: ScheduleItem = {
      id: `${newItemData.code}-${newItemData.className}-${Date.now()}`,
      code: newItemData.code.toUpperCase().trim(),
      name: newItemData.name.trim() || "Môn học mới",
      className: newItemData.className.toUpperCase().trim(),
      major: newItemData.major.trim(),
      studentCount: Number(newItemData.studentCount) || 0,
      part: newItemData.part || "2 Part",
      instructor: newItemData.instructor,
      hours: Number(newItemData.hours) || 0
    };

    setItems(prev => [newItem, ...prev]);
    setIsAddingItem(false);
    setNewItemData({
      code: "",
      name: "",
      className: "",
      major: "",
      studentCount: 20,
      part: "2 Part",
      instructor: "",
      hours: 45
    });
  };

  // Delete an assignment row
  const handleDeleteItem = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa dòng phân công này?")) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Handle adding new lecturer
  const handleAddLecturerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLecturerName.trim();
    if (!name) return;
    if (lecturers.includes(name)) {
      alert("Giảng viên này đã tồn tại!");
      return;
    }
    addLecturer(name);
    setNewLecturerName("");
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.instructor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMajor = selectedMajor === "All" || item.major === selectedMajor;
      const matchesInstructor = selectedInstructorFilter === "All" || 
        (selectedInstructorFilter === "Unassigned" ? item.instructor === "" : item.instructor === selectedInstructorFilter);

      return matchesSearch && matchesMajor && matchesInstructor;
    });
  }, [items, searchTerm, selectedMajor, selectedInstructorFilter]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;

  // Calculate stats for instructors dynamically
  const lecturerChartData = useMemo(() => {
    const hoursMap: Record<string, number> = {};
    
    // Initialize all lecturers with 0 hours to make sure they are in the chart if they exist
    lecturers.forEach(l => {
      if (l) hoursMap[l] = 0;
    });

    items.forEach(item => {
      const inst = item.instructor || "Chưa phân công";
      hoursMap[inst] = (hoursMap[inst] || 0) + item.hours;
    });

    return Object.entries(hoursMap)
      .map(([name, hours]) => ({
        name,
        hours
      }))
      .sort((a, b) => b.hours - a.hours); // Sort by hours descending
  }, [items, lecturers]);

  // Summary widgets
  const summaryStats = useMemo(() => {
    const totalHours = items.reduce((sum, item) => sum + item.hours, 0);
    const unassignedCount = items.filter(item => !item.instructor).length;
    const totalClasses = new Set(items.map(item => item.className)).size;
    
    return {
      totalHours,
      unassignedCount,
      totalClasses,
      totalItems: items.length
    };
  }, [items]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left Column: Management Tables & Controls */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex flex-col justify-between" id="stat-total-items">
            <span className="text-gray-500 text-xs font-medium">Tổng số lớp-môn</span>
            <span className="text-2xl font-semibold text-gray-900 mt-1">{summaryStats.totalItems}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex flex-col justify-between" id="stat-total-classes">
            <span className="text-gray-500 text-xs font-medium">Tổng số lớp học</span>
            <span className="text-2xl font-semibold text-indigo-600 mt-1">{summaryStats.totalClasses}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex flex-col justify-between" id="stat-total-hours">
            <span className="text-gray-500 text-xs font-medium">Tổng số giờ giảng dạy</span>
            <span className="text-2xl font-semibold text-emerald-600 mt-1">{summaryStats.totalHours} AP</span>
          </div>
          <div className={`p-4 rounded-xl shadow-xs border flex flex-col justify-between ${
            summaryStats.unassignedCount > 0 
              ? "bg-amber-50/50 border-amber-100 text-amber-900" 
              : "bg-emerald-50/50 border-emerald-100 text-emerald-900"
          }`} id="stat-unassigned">
            <span className="text-xs font-medium">Chưa phân công</span>
            <div className="flex items-center gap-1.5 mt-1">
              {summaryStats.unassignedCount > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              )}
              <span className="text-2xl font-semibold">{summaryStats.unassignedCount}</span>
            </div>
          </div>
        </div>

        {/* Filter and Control Bar */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" /> Bảng phân công giảng viên
            </h3>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
                id="btn-add-item"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm lớp môn
              </button>
              
              <button
                onClick={resetData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 transition-colors"
                id="btn-reset-data"
                title="Khôi phục dữ liệu gốc"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Khôi phục gốc
              </button>
            </div>
          </div>

          {/* Form to Add New Assignment Item */}
          {isAddingItem && (
            <form onSubmit={handleAddItem} className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3 animate-fade-in">
              <div className="md:col-span-1">
                <label className="block text-[11px] font-medium text-gray-500 uppercase">Mã môn *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: AMD201"
                  required
                  value={newItemData.code}
                  onChange={e => setNewItemData(prev => ({ ...prev, code: e.target.value }))}
                  className="mt-1 block w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-gray-500 uppercase">Tên môn học</label>
                <input
                  type="text"
                  placeholder="Tên đầy đủ của môn học"
                  value={newItemData.name}
                  onChange={e => setNewItemData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[11px] font-medium text-gray-500 uppercase">Lớp *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: CO1303"
                  required
                  value={newItemData.className}
                  onChange={e => setNewItemData(prev => ({ ...prev, className: e.target.value }))}
                  className="mt-1 block w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase">Chuyên ngành</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 3+0 COMP&AI"
                  value={newItemData.major}
                  onChange={e => setNewItemData(prev => ({ ...prev, major: e.target.value }))}
                  className="mt-1 block w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase">Số SV</label>
                <input
                  type="number"
                  placeholder="Số lượng sinh viên"
                  value={newItemData.studentCount}
                  onChange={e => setNewItemData(prev => ({ ...prev, studentCount: Number(e.target.value) }))}
                  className="mt-1 block w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase">Số giờ AP</label>
                <input
                  type="number"
                  placeholder="Số giờ"
                  value={newItemData.hours}
                  onChange={e => setNewItemData(prev => ({ ...prev, hours: Number(e.target.value) }))}
                  className="mt-1 block w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 bg-indigo-600 text-white font-medium rounded text-xs hover:bg-indigo-700 transition-colors"
                >
                  Xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 font-medium rounded text-xs hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}

          {/* Search and Column Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm môn, lớp, giảng viên..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-8 block w-full rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <select
                value={selectedMajor}
                onChange={e => { setSelectedMajor(e.target.value); setCurrentPage(1); }}
                className="block w-full rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 px-2 text-xs text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">Tất cả Chuyên ngành ({majors.length - 1})</option>
                {majors.filter(m => m !== "All").map(m => (
                  <option key={m} value={m}>{m || "(Trống)"}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedInstructorFilter}
                onChange={e => { setSelectedInstructorFilter(e.target.value); setCurrentPage(1); }}
                className="block w-full rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 px-2 text-xs text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">Bộ lọc Giảng viên</option>
                <option value="Unassigned" className="text-amber-600 font-semibold">⚠️ Chưa phân công</option>
                {lecturers.filter(Boolean).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Schedule Grid Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">Môn</th>
                  <th scope="col" className="px-4 py-3 text-left w-1/3">Tên môn học</th>
                  <th scope="col" className="px-4 py-3 text-left">Lớp</th>
                  <th scope="col" className="px-4 py-3 text-left">Chuyên ngành</th>
                  <th scope="col" className="px-4 py-3 text-left">Giảng viên phân công</th>
                  <th scope="col" className="px-4 py-3 text-center">Số giờ</th>
                  <th scope="col" className="px-3 py-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedItems.length > 0 ? (
                  paginatedItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-mono font-medium text-gray-900">
                        {item.code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800 line-clamp-2" title={item.name}>
                          {item.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-medium font-mono">
                          {item.className}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {item.major || <span className="text-gray-300 italic">Trống</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={item.instructor}
                          onChange={(e) => handleLecturerChange(item.id, e.target.value)}
                          className={`w-full max-w-[150px] rounded-md border py-1 px-1.5 text-xs focus:ring-1 focus:ring-indigo-500 ${
                            item.instructor 
                              ? "bg-emerald-50/50 text-emerald-800 border-emerald-200 font-medium" 
                              : "bg-amber-50 text-amber-800 border-amber-200 font-medium"
                          }`}
                        >
                          <option value="">-- Chưa phân công --</option>
                          {lecturers.filter(Boolean).map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-semibold text-gray-700">
                        {item.hours}h
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-all"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      Không tìm thấy lịch phân công nào khớp với điều kiện lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-100">
            <div className="text-gray-500 text-xs">
              Hiển thị <span className="font-semibold text-gray-700">{Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)}</span> đến{" "}
              <span className="font-semibold text-gray-700">{Math.min(filteredItems.length, currentPage * itemsPerPage)}</span> trong tổng số{" "}
              <span className="font-semibold text-gray-700">{filteredItems.length}</span> dòng
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <span className="px-3 py-1 text-xs font-semibold text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Dynamic Load Chart & Quick Add Lecturer */}
      <div className="space-y-6">
        
        {/* Quick Add Lecturer */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3 text-sm">
            <UserPlus className="w-4 h-4 text-indigo-500" /> Thêm giảng viên mới vào danh sách
          </h3>
          <form onSubmit={handleAddLecturerSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập nick danh (ví dụ: anhnd)"
              required
              value={newLecturerName}
              onChange={e => setNewLecturerName(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs shrink-0"
            >
              Thêm GV
            </button>
          </form>
          {/* Quick list of lecturers count */}
          <div className="mt-3 flex flex-wrap gap-1 max-h-[110px] overflow-y-auto pt-1 border-t border-gray-50">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block w-full mb-1">
              Danh sách giảng viên hiện tại ({lecturers.filter(Boolean).length}):
            </span>
            {lecturers.filter(Boolean).sort().map(l => (
              <span key={l} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic Lecturer Hours Chart */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 text-sm">
              Biểu đồ tổng giờ giảng viên (Cập nhật động)
            </h3>
            <span className="text-[10px] text-indigo-600 bg-indigo-50 font-medium px-2 py-0.5 rounded-full">
              Real-time
            </span>
          </div>

          <p className="text-gray-500 text-[11px] leading-relaxed">
            Xem tổng số giờ (AP) giảng viên đảm nhận dựa theo bảng phân công bên trái. Giúp kiểm soát định mức và tránh quá tải.
          </p>

          <div className="h-[380px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={lecturerChartData}
                layout="vertical"
                margin={{ top: 5, right: 15, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#F3F4F6" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#4B5563" 
                  fontSize={10} 
                  tickLine={false} 
                  width={90}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-900 text-white p-2.5 rounded-lg text-xs shadow-md border-0">
                          <p className="font-bold">{data.name}</p>
                          <p className="mt-1 text-indigo-300">Tổng giờ: <span className="font-semibold text-white">{data.hours} giờ AP</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={12}>
                  {lecturerChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === "Chưa phân công" ? "#EF4444" : getStringColor(entry.name)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { ScheduleItem } from "./types";
import { parseCSV, convertGridToSchedule } from "./utils/csvParser";
import { SAMPLE_CSV } from "./utils/sampleData";
import AssignmentTab from "./components/AssignmentTab";
import LecturerAnalysisTab from "./components/LecturerAnalysisTab";
import CourseAnalysisTab from "./components/CourseAnalysisTab";
import ClassAnalysisTab from "./components/ClassAnalysisTab";
import CsvUploadExport from "./components/CsvUploadExport";
import { 
  Calendar, 
  Users, 
  BookOpen, 
  GraduationCap, 
  FileSpreadsheet, 
  Layers, 
  TrendingUp,
  Download,
  Upload,
  RotateCcw
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"assign" | "lecturers" | "courses" | "classes" | "files">("assign");

  // Initial parse of the preloaded FPT CSV data
  const initialItems = useMemo(() => {
    const grid = parseCSV(SAMPLE_CSV);
    return convertGridToSchedule(grid);
  }, []);

  const initialLecturers = useMemo(() => {
    return Array.from(new Set(
      initialItems.map(item => item.instructor.trim()).filter(Boolean)
    ));
  }, [initialItems]);

  // Load items state with LocalStorage fallback
  const [items, setItems] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem("fpt_schedule_items");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Lỗi đọc dữ liệu local storage:", e);
      }
    }
    return initialItems;
  });

  // Load lecturers state with LocalStorage fallback
  const [lecturers, setLecturers] = useState<string[]>(() => {
    const saved = localStorage.getItem("fpt_schedule_lecturers");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Lỗi đọc dữ liệu giảng viên local storage:", e);
      }
    }
    return initialLecturers;
  });

  // Persist items to LocalStorage (complying with primitive dependencies guideline)
  const itemsSerialized = JSON.stringify(items);
  useEffect(() => {
    localStorage.setItem("fpt_schedule_items", itemsSerialized);
  }, [itemsSerialized]);

  // Persist lecturers to LocalStorage
  const lecturersSerialized = JSON.stringify(lecturers);
  useEffect(() => {
    localStorage.setItem("fpt_schedule_lecturers", lecturersSerialized);
  }, [lecturersSerialized]);

  // Manual addition of new lecturer to pool
  const addLecturer = (name: string) => {
    const cleaned = name.trim();
    if (!cleaned) return;
    setLecturers(prev => {
      if (prev.includes(cleaned)) return prev;
      return [...prev, cleaned];
    });
  };

  // Revert all data to original FPT sample
  const handleResetData = () => {
    if (confirm("Bạn có chắc chắn muốn khôi phục toàn bộ dữ liệu mẫu gốc ban đầu?")) {
      setItems(initialItems);
      setLecturers(initialLecturers);
      localStorage.removeItem("fpt_schedule_items");
      localStorage.removeItem("fpt_schedule_lecturers");
    }
  };

  // Update data when a new CSV file is uploaded
  const handleNewDataUploaded = (newItems: ScheduleItem[]) => {
    setItems(newItems);
    // Extract new lecturers list automatically
    const extractedLecs = Array.from(new Set(
      newItems.map(item => item.instructor.trim()).filter(Boolean)
    ));
    setLecturers(extractedLecs);
  };

  // Compute stats dynamically for summary widgets matching dashboard design
  const computedStats = useMemo(() => {
    const uniqueCourses = new Set(items.map(item => item.code)).size;
    const uniqueClasses = new Set(items.map(item => item.className)).size;
    const unassignedCount = items.filter(item => !item.instructor).length;
    
    // Calculate over-limit instructors (> 120 hours)
    const hoursMap: Record<string, number> = {};
    items.forEach(item => {
      if (item.instructor) {
        hoursMap[item.instructor] = (hoursMap[item.instructor] || 0) + item.hours;
      }
    });
    const overLimitCount = Object.values(hoursMap).filter(h => h > 120).length;

    return {
      uniqueCourses,
      uniqueClasses,
      unassignedCount,
      overLimitCount
    };
  }, [items]);

  const activeTabTitle = useMemo(() => {
    switch (activeTab) {
      case "assign":
        return "Bảng Phân Công Chi Tiết";
      case "lecturers":
        return "Phân Tích Theo Giảng Viên";
      case "courses":
        return "Phân Tích Theo Môn Học";
      case "classes":
        return "Phân Tích Theo Lớp Học";
      case "files":
        return "Quản Lý & Nhập Xuất Tệp CSV";
      default:
        return "Hệ Thống Phân Công";
    }
  }, [activeTab]);

  const navigationItems = [
    { id: "assign" as const, label: "Phân công giảng dạy", icon: Calendar },
    { id: "lecturers" as const, label: "Phân tích Giảng viên", icon: Users },
    { id: "courses" as const, label: "Phân tích Môn học", icon: BookOpen },
    { id: "classes" as const, label: "Phân tích Lớp học", icon: Layers },
    { id: "files" as const, label: "Tải lên / Xuất File CSV", icon: FileSpreadsheet },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden" id="app-container">
      
      {/* Sidebar - Technical dark slate theme */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0" id="app-sidebar">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-xs uppercase shadow-sm">EP</div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">EduSched Pro</h1>
              <p className="text-[10px] text-slate-500 tracking-wide font-mono">FPT Assignment</p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" id="sidebar-nav">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left font-medium text-sm ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
                id={`tab-btn-${item.id}`}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Details */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Hệ thống</div>
            <div className="text-xs text-slate-300 font-medium">Kỳ học: Fall 2026</div>
            <div className="text-[10px] text-slate-500 mt-1">Cập nhật: Tự động (Local)</div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-full overflow-hidden" id="main-content-pane">
        
        {/* Top Header Row */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0 shadow-xs" id="main-header">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">{activeTabTitle}</h2>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider">
              Dữ liệu đã nạp
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleResetData}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-all text-xs font-medium text-slate-700 bg-white shadow-xs"
              title="Khôi phục dữ liệu gốc ban đầu"
              id="header-btn-reset"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Khôi phục mẫu
            </button>
            <button 
              onClick={() => setActiveTab("files")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-xs font-medium transition-all"
              id="header-btn-export"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Nhập / Xuất CSV
            </button>
          </div>
        </header>

        {/* Dynamic View & Scroll Area */}
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto bg-slate-50" id="main-view-container">
          
          {/* Active Tab Component Render */}
          <div className="flex-1 animate-fade-in" id="active-tab-wrapper">
            {activeTab === "assign" && (
              <AssignmentTab
                items={items}
                setItems={setItems}
                lecturers={lecturers}
                addLecturer={addLecturer}
                resetData={handleResetData}
              />
            )}

            {activeTab === "lecturers" && (
              <LecturerAnalysisTab items={items} />
            )}

            {activeTab === "courses" && (
              <CourseAnalysisTab items={items} />
            )}

            {activeTab === "classes" && (
              <ClassAnalysisTab items={items} />
            )}

            {activeTab === "files" && (
              <CsvUploadExport
                onDataLoaded={handleNewDataUploaded}
                currentItems={items}
                loadSample={handleResetData}
              />
            )}
          </div>

          {/* Summary Stats Bottom - Replicated beautifully from Design HTML */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0 pt-4 border-t border-slate-200/60" id="summary-stats-bottom">
            <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
              <div className="text-xs text-slate-500 font-bold uppercase mb-1 tracking-wider">Tổng số môn học</div>
              <div className="text-2xl font-bold font-mono text-slate-900">{computedStats.uniqueCourses}</div>
              <div className="mt-2 text-[10px] text-green-600 font-bold">Thống kê duy nhất</div>
            </div>
            <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
              <div className="text-xs text-slate-500 font-bold uppercase mb-1 tracking-wider">Tổng số lớp</div>
              <div className="text-2xl font-bold font-mono text-slate-900">{computedStats.uniqueClasses}</div>
              <div className="mt-2 text-[10px] text-slate-400 font-medium">Bố trí các chuyên ngành</div>
            </div>
            <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
              <div className="text-xs text-slate-500 font-bold uppercase mb-1 tracking-wider">Lớp-môn chưa phân công</div>
              <div className={`text-2xl font-bold font-mono ${computedStats.unassignedCount > 0 ? "text-amber-500" : "text-green-600"}`}>
                {String(computedStats.unassignedCount).padStart(2, '0')}
              </div>
              <div className="mt-2">
                {computedStats.unassignedCount > 0 ? (
                  <span className="text-[10px] bg-amber-50 text-amber-600 inline-block px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Yêu cầu hành động</span>
                ) : (
                  <span className="text-[10px] bg-green-50 text-green-600 inline-block px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Đã hoàn tất</span>
                )}
              </div>
            </div>
            <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
              <div className="text-xs text-slate-500 font-bold uppercase mb-1 tracking-wider">Số GV vượt tải (&gt;120h)</div>
              <div className={`text-2xl font-bold font-mono ${computedStats.overLimitCount > 0 ? "text-red-500" : "text-slate-900"}`}>
                {String(computedStats.overLimitCount).padStart(2, '0')}
              </div>
              <div className="mt-2 text-[10px] text-slate-400 font-medium">Theo định mức giờ AP</div>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}


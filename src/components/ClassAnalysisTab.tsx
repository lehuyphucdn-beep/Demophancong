import React, { useMemo, useState } from "react";
import { ScheduleItem } from "../types";
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  BookOpen, 
  Search, 
  Filter, 
  HelpCircle,
  Clock
} from "lucide-react";

interface ClassAnalysisTabProps {
  items: ScheduleItem[];
}

export default function ClassAnalysisTab({ items }: ClassAnalysisTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "duplicated" | "optimal">("all");

  // Group items by class and analyze instructor duplicates
  const classDataList = useMemo(() => {
    const grouped: Record<string, {
      className: string;
      major: string;
      totalStudents: number;
      subjects: ScheduleItem[];
      duplicates: Array<{
        instructor: string;
        count: number;
        subjects: string[];
      }>;
    }> = {};

    items.forEach(item => {
      const cls = item.className.trim();
      if (!cls) return;

      if (!grouped[cls]) {
        grouped[cls] = {
          className: cls,
          major: item.major,
          totalStudents: 0,
          subjects: [],
          duplicates: []
        };
      }

      grouped[cls].subjects.push(item);
      grouped[cls].totalStudents += item.studentCount;
    });

    // Check for duplicate lecturers within each class
    Object.values(grouped).forEach(data => {
      const instructorCounts: Record<string, {
        count: number;
        subjects: string[];
      }> = {};

      data.subjects.forEach(sub => {
        const inst = sub.instructor.trim();
        if (!inst) return; // Ignore unassigned

        if (!instructorCounts[inst]) {
          instructorCounts[inst] = { count: 0, subjects: [] };
        }
        instructorCounts[inst].count += 1;
        instructorCounts[inst].subjects.push(sub.code);
      });

      // Find instructors teaching 2 or more subjects in the same class
      Object.entries(instructorCounts).forEach(([inst, info]) => {
        if (info.count >= 2) {
          data.duplicates.push({
            instructor: inst,
            count: info.count,
            subjects: info.subjects
          });
        }
      });
    });

    return Object.values(grouped).sort((a, b) => a.className.localeCompare(b.className));
  }, [items]);

  // Filter classes based on search term and duplicate status
  const filteredClasses = useMemo(() => {
    return classDataList.filter(cls => {
      const matchesSearch = 
        cls.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subjects.some(s => s.instructor.toLowerCase().includes(searchTerm.toLowerCase()));

      const hasDuplicates = cls.duplicates.length > 0;
      
      const matchesFilter = 
        filterType === "all" ||
        (filterType === "duplicated" && hasDuplicates) ||
        (filterType === "optimal" && !hasDuplicates);

      return matchesSearch && matchesFilter;
    });
  }, [classDataList, searchTerm, filterType]);

  // Summary counts
  const summaryCounts = useMemo(() => {
    const total = classDataList.length;
    const duplicated = classDataList.filter(c => c.duplicates.length > 0).length;
    return {
      total,
      duplicated,
      optimal: total - duplicated
    };
  }, [classDataList]);

  return (
    <div className="space-y-6">

      {/* Header Panel */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" /> Phân tích trực quan theo lớp học
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Theo dõi phân công môn học chi tiết cho từng lớp. Phát hiện tức thì các trường hợp trùng lặp giảng viên (một giảng viên đảm nhiệm từ 2 môn trở lên trong cùng một lớp).
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Tìm lớp, chuyên ngành..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 block w-full rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 text-xs text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterType === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Tất cả ({summaryCounts.total})
            </button>
            <button
              onClick={() => setFilterType("duplicated")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                filterType === "duplicated" ? "bg-amber-100 text-amber-800 shadow-xs" : "text-gray-500 hover:text-amber-600"
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-500" /> Bị lặp ({summaryCounts.duplicated})
            </button>
            <button
              onClick={() => setFilterType("optimal")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                filterType === "optimal" ? "bg-emerald-100 text-emerald-800 shadow-xs" : "text-gray-500 hover:text-emerald-600"
              }`}
            >
              <CheckCircle className="w-3 h-3 text-emerald-500" /> Đa dạng ({summaryCounts.optimal})
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Class Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClasses.length > 0 ? (
          filteredClasses.map(clsData => {
            const hasDup = clsData.duplicates.length > 0;
            return (
              <div 
                key={clsData.className} 
                className={`bg-white rounded-xl shadow-xs border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  hasDup ? "border-amber-200/80 ring-1 ring-amber-100/50" : "border-gray-100"
                }`}
              >
                {/* Card Header */}
                <div className={`p-4 ${hasDup ? "bg-amber-50/40" : "bg-gray-50/40"} border-b border-gray-100`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-lg font-black font-mono tracking-tight text-gray-900">
                        {clsData.className}
                      </span>
                      <span className="block text-[10px] text-gray-400 font-semibold uppercase mt-0.5">
                        {clsData.major || "Chuyên ngành: Khác"}
                      </span>
                    </div>
                    
                    {/* Status Badge */}
                    {hasDup ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 border border-amber-200 text-amber-800 font-bold px-2.5 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3 text-amber-500" /> GV bị lặp ({clsData.duplicates.length})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Phân công đa dạng
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body - Subject List */}
                <div className="p-4 flex-1 space-y-3">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                    Môn học kỳ học & Giảng viên đứng lớp ({clsData.subjects.length}):
                  </span>
                  
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {clsData.subjects.map(sub => (
                      <div key={sub.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-gray-50/80 border border-gray-100 hover:bg-gray-50">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-gray-900 text-[11px]">{sub.code}</span>
                          <p className="text-[10px] text-gray-500 line-clamp-1 max-w-[160px]" title={sub.name}>{sub.name}</p>
                        </div>
                        <div className="text-right">
                          {sub.instructor ? (
                            <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded text-[10px] border border-indigo-100">
                              {sub.instructor}
                            </span>
                          ) : (
                            <span className="font-semibold text-red-500 text-[10px] italic">⚠️ Chưa phân công</span>
                          )}
                          <span className="block text-[10px] text-gray-400 font-mono mt-0.5">{sub.hours}h AP</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Warning Box for Duplicates */}
                  {hasDup && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg space-y-1.5 mt-3">
                      <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1 uppercase">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Cảnh báo trùng lặp giảng viên:
                      </span>
                      {clsData.duplicates.map((dup, i) => (
                        <p key={i} className="text-[11px] text-amber-900 leading-relaxed font-medium">
                          • Thầy/Cô <strong className="text-amber-950 font-mono bg-amber-100/60 px-1 rounded">{dup.instructor}</strong> dạy <strong className="text-amber-950">{dup.count} môn</strong> cho lớp này: ({dup.subjects.join(", ")})
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer - Summary stats */}
                <div className="px-4 py-2.5 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-gray-400" /> Tổng số môn: <strong>{clsData.subjects.length}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" /> Tổng giờ: <strong>{clsData.subjects.reduce((sum, item) => sum + item.hours, 0)}h AP</strong>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white p-12 text-center text-gray-500 rounded-xl border border-gray-100 shadow-xs">
            Không tìm thấy lớp học nào khớp với điều kiện tìm kiếm.
          </div>
        )}
      </div>

    </div>
  );
}

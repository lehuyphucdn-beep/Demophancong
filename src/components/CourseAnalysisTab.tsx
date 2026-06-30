import React, { useMemo, useState } from "react";
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
import { BookOpen, Users, HelpCircle, Award, AlertCircle, ArrowUpDown } from "lucide-react";
import { getStringColor } from "../utils/colors";

interface CourseAnalysisTabProps {
  items: ScheduleItem[];
}

export default function CourseAnalysisTab({ items }: CourseAnalysisTabProps) {
  const [sortField, setSortField] = useState<"code" | "students" | "instructorCount">("instructorCount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Aggregate stats by Course Code
  const courseStats = useMemo(() => {
    const statsMap: Record<string, {
      code: string;
      name: string;
      students: number;
      instructors: Set<string>;
      classes: Set<string>;
      totalHours: number;
    }> = {};

    items.forEach(item => {
      const code = item.code.trim();
      // Clean course name (take first line or trim)
      const cleanName = item.name.split("\n")[0].replace(/[";]/g, "").trim();

      if (!statsMap[code]) {
        statsMap[code] = {
          code,
          name: cleanName,
          students: 0,
          instructors: new Set<string>(),
          classes: new Set<string>(),
          totalHours: 0
        };
      }

      statsMap[code].students += item.studentCount;
      if (item.instructor) {
        statsMap[code].instructors.add(item.instructor);
      }
      statsMap[code].classes.add(item.className);
      statsMap[code].totalHours += item.hours;
    });

    return Object.values(statsMap).map(course => ({
      ...course,
      instructorCount: course.instructors.size,
      classCount: course.classes.size,
      instructorsList: Array.from(course.instructors),
      classesList: Array.from(course.classes)
    }));
  }, [items]);

  // Determine Most and Least Instructors courses
  const extremes = useMemo(() => {
    if (courseStats.length === 0) return null;

    // Filter courses that have at least one instructor assigned to make it real
    const activeCourses = courseStats.filter(c => c.instructorCount > 0);
    if (activeCourses.length === 0) return null;

    const sortedByInstructors = [...activeCourses].sort((a, b) => b.instructorCount - a.instructorCount);
    
    // Most instructors
    const maxVal = sortedByInstructors[0].instructorCount;
    const mostInstructors = sortedByInstructors.filter(c => c.instructorCount === maxVal);

    // Least instructors
    const minVal = sortedByInstructors[sortedByInstructors.length - 1].instructorCount;
    const leastInstructors = sortedByInstructors.filter(c => c.instructorCount === minVal);

    // Most students
    const sortedByStudents = [...courseStats].sort((a, b) => b.students - a.students);
    const mostStudents = sortedByStudents[0];

    return {
      mostInstructors,
      leastInstructors,
      mostStudents
    };
  }, [courseStats]);

  // Sort course stats list
  const sortedCourseStats = useMemo(() => {
    return [...courseStats].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [courseStats, sortField, sortOrder]);

  const toggleSort = (field: "code" | "students" | "instructorCount") => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Recharts Data for Course Students & Instructors
  const chartData = useMemo(() => {
    return courseStats
      .map(c => ({
        code: c.code,
        students: c.students,
        instructors: c.instructorCount
      }))
      .sort((a, b) => b.students - a.students)
      .slice(0, 15); // Top 15 courses by student count
  }, [courseStats]);

  return (
    <div className="space-y-6">

      {/* Header Info */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" /> Phân tích trực quan theo các môn học
        </h2>
        <p className="text-gray-500 text-xs mt-1">
          Báo cáo thống kê quy mô sinh viên học tập và mật độ phân công giảng viên tham gia giảng dạy của từng môn học.
        </p>
      </div>

      {/* KPI Extremes Widgets */}
      {extremes && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card: Most Instructors */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 border border-indigo-100 p-5 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Môn nhiều Giảng Viên nhất</h4>
            </div>
            
            <div className="space-y-2">
              {extremes.mostInstructors.slice(0, 2).map(c => (
                <div key={c.code} className="bg-white/80 p-2.5 rounded-lg border border-indigo-50">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-xs text-indigo-900">{c.code}</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                      {c.instructorCount} giảng viên dạy
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1 line-clamp-1 font-medium">{c.name}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Lớp học ({c.classCount}): {c.classesList.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Least Instructors */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 border border-amber-100 p-5 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Môn ít Giảng Viên nhất</h4>
            </div>
            
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {extremes.leastInstructors.slice(0, 3).map(c => (
                <div key={c.code} className="bg-white/80 p-2.5 rounded-lg border border-amber-50">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-xs text-amber-900">{c.code}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                      {c.instructorCount} GV
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1 line-clamp-1">{c.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    GV dạy: <span className="font-semibold text-gray-600">{c.instructorsList.join(", ") || "(Chưa phân công)"}</span>
                  </p>
                </div>
              ))}
              {extremes.leastInstructors.length > 3 && (
                <p className="text-[10px] text-amber-600 italic text-center pt-1">
                  và {extremes.leastInstructors.length - 3} môn học khác với chỉ {extremes.leastInstructors[0].instructorCount} giảng viên dạy.
                </p>
              )}
            </div>
          </div>

          {/* Card: Most Students */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-100 p-5 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Môn quy mô Sinh Viên lớn nhất</h4>
            </div>
            
            {extremes.mostStudents && (
              <div className="bg-white/80 p-4 rounded-lg border border-emerald-50 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-sm text-emerald-900">{extremes.mostStudents.code}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                      {extremes.mostStudents.students} Sinh viên
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1.5 font-semibold line-clamp-1">{extremes.mostStudents.name}</p>
                </div>
                <div className="text-[11px] text-gray-500 mt-3 pt-2 border-t border-gray-100 flex justify-between">
                  <span>Số lượng lớp học: <strong>{extremes.mostStudents.classCount}</strong></span>
                  <span>Tổng giờ dạy: <strong>{extremes.mostStudents.totalHours}h AP</strong></span>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Main Grid: Visual Chart and Table List */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Course Statistics Table */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Danh sách thống kê chi tiết</h3>
            <span className="text-[10px] text-gray-500 font-semibold bg-gray-200 px-2.5 py-0.5 rounded-full">
              {courseStats.length} Môn học độc lập
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-xs">
              <thead className="bg-gray-50/50 text-gray-500 font-semibold uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">
                    <button 
                      onClick={() => toggleSort("code")}
                      className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                    >
                      Môn <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left w-2/5">Tên môn học</th>
                  <th scope="col" className="px-4 py-3 text-center">
                    <button 
                      onClick={() => toggleSort("students")}
                      className="flex items-center gap-1 justify-center mx-auto hover:text-indigo-600 transition-colors"
                    >
                      Sinh viên <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    <button 
                      onClick={() => toggleSort("instructorCount")}
                      className="flex items-center gap-1 justify-center mx-auto hover:text-indigo-600 transition-colors"
                    >
                      Số Giảng Viên <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">Giảng viên đứng lớp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedCourseStats.map(course => (
                  <tr key={course.code} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gray-950 whitespace-nowrap">{course.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 line-clamp-1">{course.name}</p>
                      <span className="text-[10px] text-gray-400">
                        Lớp học ({course.classCount}): {course.classesList.join(", ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700 font-mono">
                      {course.students}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px] ${
                        course.instructorCount > 1 
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                          : course.instructorCount === 1 
                          ? "bg-gray-100 text-gray-700" 
                          : "bg-red-50 text-red-700 border border-red-100"
                      }`}>
                        {course.instructorCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {course.instructorsList.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {course.instructorsList.map(inst => (
                            <span key={inst} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
                              {inst}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-red-500 italic">⚠️ Chưa phân công</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual Chart: quy mô sinh viên & số giảng viên */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">
              Quy mô sinh viên - Top 15 môn lớn nhất
            </h3>
            <p className="text-gray-500 text-[11px] mt-1">
              Biểu đồ trực quan so sánh tổng số sinh viên đăng ký học của 15 môn học hàng đầu.
            </p>
          </div>

          <div className="h-[430px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#F3F4F6" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={9} />
                <YAxis dataKey="code" type="category" stroke="#374151" fontSize={9} width={75} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-900 text-white p-2.5 rounded-lg text-xs shadow-md border-0">
                          <p className="font-bold">{data.code}</p>
                          <p className="mt-1 text-emerald-300">Tổng sinh viên: <span className="font-semibold text-white">{data.students} SV</span></p>
                          <p className="text-indigo-300">Giảng viên phụ trách: <span className="font-semibold text-white">{data.instructors} GV</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="students" radius={[0, 4, 4, 0]} barSize={10}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStringColor(entry.code)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-center text-[10px] text-gray-400 italic">
            * Màu sắc được định vị đồng bộ theo mã môn học trên toàn bộ hệ thống
          </div>
        </div>

      </div>

    </div>
  );
}

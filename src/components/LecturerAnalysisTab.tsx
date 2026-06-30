import React, { useMemo, useState } from "react";
import { ScheduleItem } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { getStringColor } from "../utils/colors";
import { Users, Clock, BookOpen, GraduationCap, Info } from "lucide-react";

interface LecturerAnalysisTabProps {
  items: ScheduleItem[];
}

export default function LecturerAnalysisTab({ items }: LecturerAnalysisTabProps) {
  const [selectedLecturer, setSelectedLecturer] = useState<string>("All");

  // Filter out empty instructors
  const assignedItems = useMemo(() => {
    return items.filter(item => item.instructor.trim() !== "");
  }, [items]);

  const lecturersList = useMemo(() => {
    const list = new Set<string>();
    assignedItems.forEach(item => {
      list.add(item.instructor);
    });
    return Array.from(list).sort();
  }, [assignedItems]);

  // 1. DATA FOR: TỔNG SỐ GIỜ (Hours) stacked by Lớp (Classes)
  const hoursByClassData = useMemo(() => {
    // We want to find all unique classes
    const allClasses = new Set<string>();
    assignedItems.forEach(item => {
      if (item.className) allClasses.add(item.className);
    });

    const dataMap: Record<string, Record<string, number>> = {};
    // Initialize map
    lecturersList.forEach(lec => {
      dataMap[lec] = {};
    });

    assignedItems.forEach(item => {
      const lec = item.instructor;
      const cls = item.className;
      const hrs = item.hours;
      dataMap[lec][cls] = (dataMap[lec][cls] || 0) + hrs;
    });

    const chartRows = lecturersList.map(lec => {
      return {
        name: lec,
        ...dataMap[lec]
      };
    });

    return {
      rows: chartRows,
      classes: Array.from(allClasses)
    };
  }, [assignedItems, lecturersList]);

  // 2. DATA FOR: TỔNG SỐ LỚP (Classes) stacked by Môn (Courses)
  const classesByCourseData = useMemo(() => {
    const allCourses = new Set<string>();
    assignedItems.forEach(item => {
      if (item.code) allCourses.add(item.code);
    });

    const dataMap: Record<string, Record<string, number>> = {};
    lecturersList.forEach(lec => {
      dataMap[lec] = {};
    });

    assignedItems.forEach(item => {
      const lec = item.instructor;
      const course = item.code;
      // Increment classes count (each row represents a class taught by lecturer for that course)
      dataMap[lec][course] = (dataMap[lec][course] || 0) + 1;
    });

    const chartRows = lecturersList.map(lec => {
      return {
        name: lec,
        ...dataMap[lec]
      };
    });

    return {
      rows: chartRows,
      courses: Array.from(allCourses)
    };
  }, [assignedItems, lecturersList]);

  // 3. DATA FOR: TỔNG SỐ MÔN (Courses) stacked by Lớp (Classes)
  const coursesByClassData = useMemo(() => {
    const allClasses = new Set<string>();
    assignedItems.forEach(item => {
      if (item.className) allClasses.add(item.className);
    });

    const dataMap: Record<string, Record<string, string[]>> = {};
    lecturersList.forEach(lec => {
      dataMap[lec] = {};
    });

    assignedItems.forEach(item => {
      const lec = item.instructor;
      const cls = item.className;
      const course = item.code;
      if (!dataMap[lec][cls]) {
        dataMap[lec][cls] = [];
      }
      if (!dataMap[lec][cls].includes(course)) {
        dataMap[lec][cls].push(course);
      }
    });

    const chartRows = lecturersList.map(lec => {
      const row: Record<string, any> = { name: lec };
      // Store the count of distinct courses for each class
      Object.entries(dataMap[lec]).forEach(([cls, courses]) => {
        row[cls] = courses.length;
      });
      return row;
    });

    return {
      rows: chartRows,
      classes: Array.from(allClasses)
    };
  }, [assignedItems, lecturersList]);

  // Lecturer Detail Stats Cards
  const selectedLecturerStats = useMemo(() => {
    if (selectedLecturer === "All") return null;

    const lecItems = assignedItems.filter(item => item.instructor === selectedLecturer);
    const totalHours = lecItems.reduce((sum, item) => sum + item.hours, 0);
    const classes = Array.from(new Set(lecItems.map(item => item.className)));
    const courses = Array.from(new Set(lecItems.map(item => item.code)));
    const studentCount = lecItems.reduce((sum, item) => sum + item.studentCount, 0);

    return {
      name: selectedLecturer,
      totalHours,
      classesCount: classes.length,
      coursesCount: courses.length,
      studentCount,
      classes,
      courses: lecItems.map(item => ({
        code: item.code,
        name: item.name,
        className: item.className,
        hours: item.hours,
        students: item.studentCount
      }))
    };
  }, [assignedItems, selectedLecturer]);

  // General Top stats
  const topStats = useMemo(() => {
    if (lecturersList.length === 0) return null;

    const statsMap = lecturersList.map(lec => {
      const lecItems = assignedItems.filter(item => item.instructor === lec);
      const hours = lecItems.reduce((sum, item) => sum + item.hours, 0);
      return { name: lec, hours };
    });

    const sortedByHours = [...statsMap].sort((a, b) => b.hours - a.hours);
    const maxHrs = sortedByHours[0];
    const minHrs = sortedByHours[sortedByHours.length - 1];

    return {
      maxHrs,
      minHrs,
      avgHrs: Math.round(assignedItems.reduce((s, i) => s + i.hours, 0) / lecturersList.length)
    };
  }, [assignedItems, lecturersList]);

  return (
    <div className="space-y-6">
      
      {/* Top Header Summary for Lecturers */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" /> Phân tích trực quan theo giảng viên
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Tổng quan và so sánh tải dạy của toàn bộ giảng viên thông qua các biểu đồ xếp chồng (Stacked Charts).
          </p>
        </div>
        
        {/* Dropdown to see details of a specific lecturer */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-gray-500 whitespace-nowrap font-medium">Chi tiết giảng viên:</span>
          <select
            value={selectedLecturer}
            onChange={e => setSelectedLecturer(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 py-1.5 px-3 text-xs text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          >
            <option value="All">-- Tất cả giảng viên --</option>
            {lecturersList.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Analysis view or Lecturer Detail View depending on dropdown */}
      {selectedLecturer !== "All" && selectedLecturerStats ? (
        // Specific Lecturer Detailed view
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <div className="md:col-span-1 bg-white p-6 rounded-xl border border-indigo-100 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-lg">
                {selectedLecturerStats.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">{selectedLecturerStats.name}</h3>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">Giảng viên cơ hữu</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Tổng số giờ dạy</span>
                <span className="text-xl font-bold text-indigo-600 mt-1 block">{selectedLecturerStats.totalHours} AP</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Tổng số sinh viên</span>
                <span className="text-xl font-bold text-emerald-600 mt-1 block">{selectedLecturerStats.studentCount} SV</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Tổng số lớp</span>
                <span className="text-xl font-bold text-amber-600 mt-1 block">{selectedLecturerStats.classesCount} Lớp</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Tổng số môn dạy</span>
                <span className="text-xl font-bold text-rose-600 mt-1 block">{selectedLecturerStats.coursesCount} Môn</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Danh sách lớp đảm nhận:</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedLecturerStats.classes.map(cls => (
                  <span key={cls} className="text-xs px-2.5 py-1 bg-gray-100 rounded-md text-gray-700 font-mono font-medium border border-gray-200">
                    {cls}
                  </span>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedLecturer("All")} 
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Quay lại xem so sánh toàn bộ
            </button>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Lịch dạy chi tiết của {selectedLecturerStats.name}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left">Môn</th>
                    <th scope="col" className="px-4 py-2.5 text-left">Tên môn</th>
                    <th scope="col" className="px-4 py-2.5 text-left">Lớp</th>
                    <th scope="col" className="px-4 py-2.5 text-center">Số giờ</th>
                    <th scope="col" className="px-4 py-2.5 text-center">Số SV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedLecturerStats.courses.map((course, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-mono font-medium text-gray-900">{course.code}</td>
                      <td className="px-4 py-2.5 text-gray-700">{course.name}</td>
                      <td className="px-4 py-2.5 font-mono text-indigo-600 font-semibold">{course.className}</td>
                      <td className="px-4 py-2.5 text-center font-semibold text-gray-800 font-mono">{course.hours}h</td>
                      <td className="px-4 py-2.5 text-center font-mono text-gray-600">{course.students}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // Stacked Charts for all Lecturers Comparison
        <div className="space-y-6">
          
          {/* General Overview Metrics */}
          {topStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50/30 border border-indigo-100/50 p-4 rounded-xl flex items-center gap-3">
                <Clock className="w-8 h-8 text-indigo-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Trung bình tải dạy</span>
                  <span className="text-lg font-bold text-indigo-700 mt-0.5 block">{topStats.avgHrs} giờ / giảng viên</span>
                </div>
              </div>
              <div className="bg-emerald-50/30 border border-emerald-100/50 p-4 rounded-xl flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-emerald-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Dạy nhiều giờ nhất</span>
                  <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                    {topStats.maxHrs?.name} ({topStats.maxHrs?.hours}h)
                  </span>
                </div>
              </div>
              <div className="bg-amber-50/30 border border-amber-100/50 p-4 rounded-xl flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Dạy ít giờ nhất</span>
                  <span className="text-lg font-bold text-amber-700 mt-0.5 block">
                    {topStats.minHrs?.name} ({topStats.minHrs?.hours}h)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3 Color-Coded Stacked Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Total Hours stacked by Class */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Tổng số giờ AP (Theo lớp)
                </h3>
                <p className="text-gray-500 text-[11px] mt-1">
                  Mỗi cột là giảng viên. Các phần màu thể hiện thời gian (AP) phân bổ cho từng Lớp khác nhau.
                </p>
              </div>

              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hoursByClassData.rows}
                    margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={9} tickLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={9} tickLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
                          return (
                            <div className="bg-gray-900 text-white p-2.5 rounded-lg text-xs shadow-md border-0 max-w-[200px]">
                              <p className="font-bold border-b border-gray-700 pb-1 mb-1.5">{label}</p>
                              {payload.map((entry, i) => {
                                if (!entry.value) return null;
                                return (
                                  <div key={i} className="flex justify-between gap-4 mt-1">
                                    <span className="text-gray-300">{entry.name}:</span>
                                    <span className="font-semibold" style={{ color: entry.color }}>{entry.value}h</span>
                                  </div>
                                );
                              })}
                              <div className="flex justify-between gap-4 mt-1.5 pt-1.5 border-t border-gray-700 font-bold">
                                <span>Tổng cộng:</span>
                                <span>{total}h</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {hoursByClassData.classes.map((className) => (
                      <Bar 
                        key={className} 
                        dataKey={className} 
                        stackId="hoursStack" 
                        fill={getStringColor(className)} 
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-gray-400 font-medium italic">
                  * Biểu đồ xếp chồng phân biệt theo các Lớp khác nhau
                </span>
              </div>
            </div>

            {/* Chart 2: Total Classes stacked by Course Code */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tổng số lớp dạy (Theo môn)
                </h3>
                <p className="text-gray-500 text-[11px] mt-1">
                  Mỗi cột là giảng viên. Phân biệt màu sắc thể hiện số lớp họ đứng tương ứng cho từng Môn học.
                </p>
              </div>

              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={classesByCourseData.rows}
                    margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={9} tickLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={9} tickLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
                          return (
                            <div className="bg-gray-900 text-white p-2.5 rounded-lg text-xs shadow-md border-0 max-w-[200px]">
                              <p className="font-bold border-b border-gray-700 pb-1 mb-1.5">{label}</p>
                              {payload.map((entry, i) => {
                                if (!entry.value) return null;
                                return (
                                  <div key={i} className="flex justify-between gap-4 mt-1">
                                    <span className="text-gray-300">{entry.name}:</span>
                                    <span className="font-semibold" style={{ color: entry.color }}>{entry.value} lớp</span>
                                  </div>
                                );
                              })}
                              <div className="flex justify-between gap-4 mt-1.5 pt-1.5 border-t border-gray-700 font-bold">
                                <span>Tổng số lớp:</span>
                                <span>{total}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {classesByCourseData.courses.map((courseCode) => (
                      <Bar 
                        key={courseCode} 
                        dataKey={courseCode} 
                        stackId="classesStack" 
                        fill={getStringColor(courseCode)} 
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-gray-400 font-medium italic">
                  * Biểu đồ xếp chồng phân biệt theo các Môn học
                </span>
              </div>
            </div>

            {/* Chart 3: Total Courses stacked by Class */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Tổng số môn giảng dạy (Theo lớp)
                </h3>
                <p className="text-gray-500 text-[11px] mt-1">
                  Mỗi cột là giảng viên. Phân biệt màu sắc thể hiện số môn học riêng biệt họ đảm nhận ở từng Lớp.
                </p>
              </div>

              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={coursesByClassData.rows}
                    margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={9} tickLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={9} tickLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
                          return (
                            <div className="bg-gray-900 text-white p-2.5 rounded-lg text-xs shadow-md border-0 max-w-[200px]">
                              <p className="font-bold border-b border-gray-700 pb-1 mb-1.5">{label}</p>
                              {payload.map((entry, i) => {
                                if (!entry.value) return null;
                                return (
                                  <div key={i} className="flex justify-between gap-4 mt-1">
                                    <span className="text-gray-300">{entry.name}:</span>
                                    <span className="font-semibold" style={{ color: entry.color }}>{entry.value} môn</span>
                                  </div>
                                );
                              })}
                              <div className="flex justify-between gap-4 mt-1.5 pt-1.5 border-t border-gray-700 font-bold">
                                <span>Tổng số môn:</span>
                                <span>{total}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {coursesByClassData.classes.map((className) => (
                      <Bar 
                        key={className} 
                        dataKey={className} 
                        stackId="coursesStack" 
                        fill={getStringColor(className)} 
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-gray-400 font-medium italic">
                  * Biểu đồ xếp chồng phân biệt theo các Lớp khác nhau
                </span>
              </div>
            </div>

          </div>

          {/* Quick Guidance Alert */}
          <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg flex gap-2 text-xs text-blue-800">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p>
              <strong>Mẹo phân tích:</strong> Di chuột (Hover) qua các phần màu của cột giảng viên để xem chi tiết thông số phân bổ lớp học, số môn dạy hoặc phân bổ số giờ cụ thể của từng giảng viên.
            </p>
          </div>

        </div>
      )}

    </div>
  );
}

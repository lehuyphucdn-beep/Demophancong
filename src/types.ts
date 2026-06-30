export interface ScheduleItem {
  id: string;
  code: string;       // Môn
  name: string;       // Tên môn
  className: string;  // Lớp
  major: string;      // Chuyên ngành
  studentCount: number; // Số sinh viên cần học
  part: string;       // Part
  instructor: string; // Giảng viên
  hours: number;      // Số giờ AP
}

export interface LecturerStats {
  instructor: string;
  totalHours: number;
  totalClasses: number;
  totalCourses: number;
  classes: string[];
  courses: string[];
}

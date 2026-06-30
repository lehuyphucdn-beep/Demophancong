import { ScheduleItem } from "../types";

export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentValue = "";
  
  // Detect delimiter: if there are more semicolons than commas in first 2000 chars, use semicolon, else comma
  let semicolonCount = 0;
  let commaCount = 0;
  const sampleLength = Math.min(text.length, 2000);
  for (let i = 0; i < sampleLength; i++) {
    if (text[i] === ';') {
      semicolonCount++;
    } else if (text[i] === ',') {
      commaCount++;
    }
  }
  const delimiter = semicolonCount >= commaCount ? ';' : ',';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentValue += '"';
          i++; // Skip next quote
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentValue += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        row.push(currentValue.trim());
        currentValue = "";
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n
        }
        row.push(currentValue.trim());
        // Only push row if it contains actual data
        if (row.length > 0 && row.some(cell => cell !== "")) {
          lines.push(row);
        }
        row = [];
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
  }

  // Push remaining row if exists
  if (currentValue !== "" || row.length > 0) {
    row.push(currentValue.trim());
    if (row.some(cell => cell !== "")) {
      lines.push(row);
    }
  }

  return lines;
}

export function convertGridToSchedule(grid: string[][]): ScheduleItem[] {
  if (grid.length < 2) return [];

  const headers = grid[0].map(h => h.toLowerCase().trim());
  
  // Find indices based on headers
  let codeIdx = headers.findIndex(h => h === "môn" || h === "mon" || h.includes("code") || h === "ma mon" || h === "mã môn");
  let nameIdx = headers.findIndex(h => h === "tên môn" || h === "ten mon" || h.includes("name") || h.includes("subject"));
  let classIdx = headers.findIndex(h => h === "lớp" || h === "lop" || h.includes("class"));
  let majorIdx = headers.findIndex(h => h === "chuyên ngành" || h === "chuyen nganh" || h.includes("major") || h.includes("special"));
  let studentIdx = headers.findIndex(h => h === "số sinh viên cần học" || h === "so sinh vien" || h.includes("student") || h.includes("sv"));
  let partIdx = headers.findIndex(h => h === "part" || h.includes("part"));
  let instructorIdx = headers.findIndex(h => h === "giảng viên" || h === "giang vien" || h.includes("instructor") || h.includes("gv"));
  let hoursIdx = headers.findIndex(h => h === "số giờ ap" || h === "so gio" || h.includes("hour") || h.includes("ap"));

  // Fallback to absolute indices if not matched
  if (codeIdx === -1) codeIdx = 0;
  if (nameIdx === -1) nameIdx = 1;
  if (classIdx === -1) classIdx = 2;
  if (majorIdx === -1) majorIdx = 3;
  if (studentIdx === -1) studentIdx = 4;
  if (partIdx === -1) partIdx = 5;
  if (instructorIdx === -1) instructorIdx = 6;
  if (hoursIdx === -1) hoursIdx = 7;

  const items: ScheduleItem[] = [];

  for (let i = 1; i < grid.length; i++) {
    const row = grid[i];
    if (row.length < 2) continue; // Skip empty rows

    const code = row[codeIdx] || "";
    const name = row[nameIdx] || "";
    const className = row[classIdx] || "";
    const major = row[majorIdx] || "";
    
    const studentCountRaw = row[studentIdx] || "0";
    const studentCount = parseInt(studentCountRaw.replace(/[^0-9]/g, "")) || 0;

    const part = row[partIdx] || "";
    const instructor = row[instructorIdx] || "";
    
    const hoursRaw = row[hoursIdx] || "0";
    const hours = parseInt(hoursRaw.replace(/[^0-9]/g, "")) || 0;

    items.push({
      id: `${code}-${className}-${i}`,
      code,
      name,
      className,
      major,
      studentCount,
      part,
      instructor,
      hours
    });
  }

  return items;
}

export function exportToCSV(items: ScheduleItem[]): string {
  const headers = ["Môn", "Tên môn", "Lớp", "Chuyên ngành", "Số sinh viên cần học", "Part", "Giảng viên", "Số giờ AP"];
  const rows = items.map(item => {
    // Format cell values with double quotes if they contain newlines, semicolons or double quotes
    const formatCell = (val: string) => {
      if (val.includes('\n') || val.includes(';') || val.includes('"')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    return [
      formatCell(item.code),
      formatCell(item.name),
      formatCell(item.className),
      formatCell(item.major),
      item.studentCount.toString(),
      formatCell(item.part),
      formatCell(item.instructor),
      item.hours.toString()
    ];
  });
  
  // Use semicolon delimited as in the user requirement
  return [headers.join(';'), ...rows.map(row => row.join(';'))].join('\r\n');
}

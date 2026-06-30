import React, { useRef, useState } from "react";
import { ScheduleItem } from "../types";
import { parseCSV, convertGridToSchedule, exportToCSV } from "../utils/csvParser";
import { Upload, Download, FileSpreadsheet, RefreshCw, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";

interface CsvUploadExportProps {
  onDataLoaded: (items: ScheduleItem[]) => void;
  currentItems: ScheduleItem[];
  loadSample: () => void;
}

export default function CsvUploadExport({
  onDataLoaded,
  currentItems,
  loadSample
}: CsvUploadExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success?: boolean;
    message?: string;
    rowCount?: number;
  }>({});

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setUploadStatus({ success: false, message: "Không thể đọc nội dung file." });
        return;
      }

      try {
        const grid = parseCSV(text);
        if (grid.length < 2) {
          setUploadStatus({ success: false, message: "File CSV trống hoặc không đúng định dạng." });
          return;
        }

        const items = convertGridToSchedule(grid);
        if (items.length === 0) {
          setUploadStatus({ 
            success: false, 
            message: "Không trích xuất được dòng phân công nào. Vui lòng kiểm tra lại dòng tiêu đề (Header)." 
          });
          return;
        }

        onDataLoaded(items);
        setUploadStatus({ 
          success: true, 
          message: "Tải lên và phân tích file thành công!", 
          rowCount: items.length 
        });

        // Reset status message after 5 seconds
        setTimeout(() => setUploadStatus({}), 6000);
      } catch (err) {
        console.error(err);
        setUploadStatus({ success: false, message: "Có lỗi xảy ra khi xử lý file CSV này." });
      }
    };
    reader.readAsText(file, "UTF-8"); // Handle UTF-8 encoding properly for Vietnamese text
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleExport = () => {
    if (currentItems.length === 0) {
      alert("Không có dữ liệu phân công để xuất!");
      return;
    }
    const csvContent = exportToCSV(currentItems);
    
    // Create blob with UTF-8 BOM so Excel handles Vietnamese accents correctly
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Phan_Cong_Lich_Day_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* Upload Drag-and-Drop Area */}
      <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-500" /> Tải lên File CSV mới
          </h3>
          <p className="text-gray-500 text-xs mt-1">
            Kéo thả hoặc nhấn để chọn file phân công dạng .csv. Hệ thống hỗ trợ xử lý cả dấu phân cách phẩy (,) và chấm phẩy (;).
          </p>
        </div>

        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive 
              ? "border-indigo-500 bg-indigo-50/20" 
              : "border-gray-200 hover:border-indigo-400 hover:bg-gray-50/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-gray-700">
              Kéo thả file .csv phân công vào đây hoặc <span className="text-indigo-600 hover:underline">Nhấp để duyệt</span>
            </p>
            <p className="text-[10px] text-gray-400">
              Hỗ trợ mã hóa UTF-8 tiếng Việt, file .csv dung lượng tối đa 10MB
            </p>
          </div>
        </div>

        {/* Upload Status Alert */}
        {uploadStatus.message && (
          <div className={`p-3.5 rounded-lg border text-xs flex gap-2 items-center ${
            uploadStatus.success 
              ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
              : "bg-red-50 border-red-100 text-red-800"
          }`}>
            {uploadStatus.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <div>
              <strong>{uploadStatus.message}</strong>
              {uploadStatus.success && uploadStatus.rowCount && (
                <span className="block mt-0.5 text-[11px] text-emerald-600">
                  Đã tải thành công <strong>{uploadStatus.rowCount}</strong> dòng phân công lịch dạy vào bộ nhớ.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export / Template Guide and Controls */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-500" /> Xuất dữ liệu & Hướng dẫn
            </h3>
            <p className="text-gray-500 text-xs mt-1">
              Xuất lịch phân công đã được cập nhật hiện tại ra file CSV hoặc tải dữ liệu mẫu ban đầu để tham khảo.
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">
              Cột bắt buộc trong file CSV (ngăn cách bởi dấu `;` hoặc `,`):
            </span>
            <ul className="text-[11px] text-gray-600 space-y-1 font-medium pl-1">
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" /> <code>Môn</code>: Mã môn học (ví dụ: AMD201)</li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" /> <code>Tên môn</code>: Tên đầy đủ môn học</li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" /> <code>Lớp</code>: Mã lớp học (ví dụ: CO1303)</li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" /> <code>Chuyên ngành</code>: Tên ngành</li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" /> <code>Số sinh viên cần học</code></li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" /> <code>Giảng viên</code>: Nickname giảng viên</li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" /> <code>Số giờ AP</code>: Số giờ giảng dạy</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={handleExport}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Tải về file phân công (.csv)
          </button>
          
          <button
            onClick={() => {
              if (confirm("Hành động này sẽ ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu mẫu ban đầu. Tiếp tục?")) {
                loadSample();
                setUploadStatus({ success: true, message: "Đã nạp lại bộ dữ liệu mẫu FPT thành công!" });
              }
            }}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-200"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Nạp bộ dữ liệu FPT mẫu ban đầu
          </button>
        </div>
      </div>

    </div>
  );
}

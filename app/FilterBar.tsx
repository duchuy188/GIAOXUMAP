"use client";
import { dioceses } from "./data";

interface FilterBarProps {
  selected: string;
  onSelectChange: (value: string) => void;
}

export default function FilterBar({ selected, onSelectChange }: FilterBarProps) {

  return (
    <div className="w-full border-b bg-white px-4 py-2 flex items-center gap-3 overflow-x-auto">
      
      {/* Dropdown chọn giáo xứ */}
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onSelectChange(e.target.value)}
          className="border rounded-full px-4 py-2 text-sm font-medium text-green-700 border-green-500 focus:outline-none"
        >
          <option>Tất cả giáo xứ</option>
          {dioceses.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Danh sách lọc nằm ngang */}
      <div className="flex gap-2">
        {dioceses.map((d) => (
          <button
            key={d}
            onClick={() => onSelectChange(d)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap border 
              ${selected === d 
                ? "bg-green-500 text-white border-green-500" 
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

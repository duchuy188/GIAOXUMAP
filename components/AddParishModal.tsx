"use client";

import { useState, useRef } from "react";
import { X, Upload, MapPin } from "lucide-react";
import { Map } from "@/components/ui/map";
import type MapLibreGL from "maplibre-gl";

interface AddParishModalProps {
  isOpen: boolean;
  onClose: () => void;
  dioceses: string[];
  onAddParish: (data: any) => void;
}

export default function AddParishModal({ isOpen, onClose, dioceses, onAddParish }: AddParishModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    diocese: "",
    description: "",
    image: "",
    lat: 14.0583,
    lng: 108.2772,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const mapRef = useRef<MapLibreGL.Map | null>(null);
  const markerRef = useRef<MapLibreGL.Marker | null>(null);

  // Handle location search with Nominatim - auto search when typing
  const handleLocationSearch = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      // Add better search parameters for more accurate results
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json` +
        `&q=${encodeURIComponent(query)}` +
        `&countrycodes=vn` +
        `&limit=8` +
        `&addressdetails=1` +
        `&dedupe=1` +
        `&extratags=1`
      );
      const data = await response.json();
      
      // Sort results by importance/rank
      const sortedResults = data.sort((a: any, b: any) => {
        // Prioritize results with 'church', 'cathedral', 'place_of_worship' in type
        const aIsChurch = a.type?.includes('church') || a.type?.includes('cathedral') || a.class === 'amenity' && a.type === 'place_of_worship';
        const bIsChurch = b.type?.includes('church') || b.type?.includes('cathedral') || b.class === 'amenity' && b.type === 'place_of_worship';
        
        if (aIsChurch && !bIsChurch) return -1;
        if (!aIsChurch && bIsChurch) return 1;
        
        // Then sort by importance
        return (parseFloat(b.importance) || 0) - (parseFloat(a.importance) || 0);
      });
      
      setSearchResults(sortedResults);
      setShowResults(sortedResults.length > 0);
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  // Select location from search results
  const handleSelectLocation = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setFormData(prev => ({ ...prev, lat, lng }));
    setShowResults(false);
    setSearchQuery(result.display_name);

    // Move map to location
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 1500,
      });
    }

    // Update marker
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Gọi callback để thêm vào danh sách
    onAddParish(formData);
    
    // Đóng modal và reset form
    onClose();
    setFormData({
      name: "",
      diocese: "",
      description: "",
      image: "",
      lat: 14.0583,
      lng: 108.2772,
    });
    setSearchQuery("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-gray-900">Thêm giáo xứ mới</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tên giáo xứ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên giáo xứ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ví dụ: Giáo xứ Phú Cam"
            />
          </div>

          {/* Giáo phận */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giáo phận <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.diocese}
              onChange={(e) => setFormData({ ...formData, diocese: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Chọn giáo phận</option>
              {dioceses.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px]"
              placeholder="Mô tả về giáo xứ..."
            />
          </div>

          {/* Hình ảnh */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="URL hình ảnh"
              />
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </div>
          </div>

          {/* Vị trí */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vị trí <span className="text-red-500">*</span>
            </label>
            
            {/* Search bar */}
            <div className="relative mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleLocationSearch(e.target.value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Tìm kiếm địa chỉ hoặc click trên bản đồ"
                />
                <button
                  type="button"
                  onClick={() => handleLocationSearch(searchQuery)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Tìm
                </button>
              </div>

              {/* Search results dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectLocation(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{result.name || result.display_name.split(',')[0]}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{result.display_name}</p>
                          {result.type && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                              {result.type === 'place_of_worship' ? 'Nhà thờ' : result.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="w-full h-[400px] rounded-lg border border-gray-300 overflow-hidden relative">
              <Map
                ref={mapRef}
                center={[formData.lng, formData.lat]}
                zoom={12}
                onLoad={(map) => {
                  mapRef.current = map;
                  
                  // Add draggable marker
                  const marker = new (window as any).maplibregl.Marker({
                    draggable: true,
                    color: "#ef4444",
                  })
                    .setLngLat([formData.lng, formData.lat])
                    .addTo(map);

                  markerRef.current = marker;

                  // Update position when marker is dragged
                  marker.on("dragend", () => {
                    const lngLat = marker.getLngLat();
                    setFormData(prev => ({
                      ...prev,
                      lat: lngLat.lat,
                      lng: lngLat.lng,
                    }));
                  });

                  // Click on map to move marker
                  map.on("click", (e: any) => {
                    marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
                    setFormData(prev => ({
                      ...prev,
                      lat: e.lngLat.lat,
                      lng: e.lngLat.lng,
                    }));
                  });
                }}
              />
            </div>
            
            {/* Coordinates */}
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900">📍 Vị trí đã chọn:</p>
              <div className="flex gap-4 mt-2 text-sm text-green-700">
                <div>
                  <span className="font-medium">Vĩ độ:</span> {formData.lat.toFixed(6)}
                </div>
                <div>
                  <span className="font-medium">Kinh độ:</span> {formData.lng.toFixed(6)}
                </div>
              </div>
            </div>
            
            <p className="mt-2 text-xs text-gray-500">
              💡 Tìm kiếm địa chỉ, kéo thả marker hoặc click trên bản đồ để chọn vị trí chính xác
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
            >
              Thêm giáo xứ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

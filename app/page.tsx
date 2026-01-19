"use client";

import { Map, MapMarker, MarkerContent, MarkerLabel, MarkerPopup, MapRoute } from "@/components/ui/map";
import { useState, useRef, useEffect } from "react";
import { MapPin, Menu, Plus, Flag, Search, Flower2, Star, Clock, Route, Loader2, ChevronDown, X } from "lucide-react";
import { dioceses as diocesesData } from "./data";
import type MapLibreGL from "maplibre-gl";
import maplibregl from "maplibre-gl";
import AddParishModal from "@/components/AddParishModal";
import Image from "next/image";

// 27 Giáo phận Việt Nam với tọa độ
const dioceses = [
  { name: "Lạng Sơn – Cao Bằng", lat: 21.8537, lng: 106.7615, region: "north" },
  { name: "Hưng Hóa", lat: 21.1400, lng: 105.5000, region: "north" },
  { name: "Bắc Ninh", lat: 21.1861, lng: 106.0763, region: "north" },
  { name: "Hà Nội", lat: 21.0278, lng: 105.8342, region: "north" },
  { name: "Hải Phòng", lat: 20.8449, lng: 106.6881, region: "north" },
  { name: "Thái Bình", lat: 20.4463, lng: 106.3366, region: "north" },
  { name: "Bùi Chu", lat: 20.3325, lng: 106.2470, region: "north" },
  { name: "Phát Diệm", lat: 20.0600, lng: 106.0800, region: "north" },
  { name: "Thanh Hóa", lat: 19.8067, lng: 105.7850, region: "north" },
  { name: "Vinh", lat: 18.6796, lng: 105.6813, region: "north" },
  { name: "Hà Tĩnh", lat: 18.3428, lng: 105.9057, region: "north" },
  { name: "Huế", lat: 16.4637, lng: 107.5909, region: "central" },
  { name: "Đà Nẵng", lat: 16.0544, lng: 108.2022, region: "central" },
  { name: "Qui Nhơn", lat: 13.7820, lng: 109.2190, region: "central" },
  { name: "Kon Tum", lat: 14.3545, lng: 108.0076, region: "central" },
  { name: "Nha Trang", lat: 12.2388, lng: 109.1967, region: "central" },
  { name: "Ban Mê Thuột", lat: 12.6675, lng: 108.0378, region: "central" },
  { name: "TP.HCM", lat: 10.8231, lng: 106.6297, region: "south" },
  { name: "Đà Lạt", lat: 11.9404, lng: 108.4583, region: "south" },
  { name: "Phan Thiết", lat: 10.9804, lng: 108.2615, region: "south" },
  { name: "Phú Cường", lat: 11.3254, lng: 106.4770, region: "south" },
  { name: "Xuân Lộc", lat: 10.9370, lng: 107.2430, region: "south" },
  { name: "Vĩnh Long", lat: 10.2537, lng: 105.9722, region: "south" },
  { name: "Long Xuyên", lat: 10.3864, lng: 105.4352, region: "south" },
  { name: "Cần Thơ", lat: 10.0452, lng: 105.7469, region: "south" },
  { name: "Bà Rịa", lat: 10.5417, lng: 107.2428, region: "south" },
  { name: "Mỹ Tho", lat: 10.3600, lng: 106.3590, region: "south" },
];

// Danh sách nhà thờ nổi bật
const churches = [
  {
    name: "Nhà thờ Lớn Hà Nội (Chính tòa Thánh Giuse)",
    diocese: "Hà Nội",
    lat: 21.0285,
    lng: 105.8473,
    region: "north",
    description: "Nhà thờ chính tòa của Tổng Giáo phận Hà Nội, kiến trúc Gothic cổ, xây từ cuối thế kỷ 19.",
    image: "https://hanoireview.vn/wp-content/uploads/2024/09/nha-tho-lon-giuse-ha-noi-1727668926.jpg"
  },
  {
    name: "Nhà thờ Chính tòa Phủ Cam",
    diocese: "Huế",
    lat: 16.4524,
    lng: 107.6010,
    region: "central",
    description: "Nhà thờ chính tòa của Tổng Giáo phận Huế, thiết kế hiện đại, nằm bên bờ sông An Cựu.",
    image: "https://giothanhle.net/wp-content/uploads/2024/06/Nha-Tho-Giao-Xu-Xuan-Bang.webp"
  },
  {
    name: "Nhà thờ Đức Bà Sài Gòn",
    diocese: "TP.HCM",
    lat: 10.7798,
    lng: 106.6990,
    region: "south",
    description: "Nhà thờ chính tòa của Tổng Giáo phận TP.HCM, biểu tượng kiến trúc Công giáo ở miền Nam.",
    image: "https://dulichdiaphuong.com/imgs/thanh-pho-ho-chi-minh/nha-tho-duc-ba.jpg"
  }
];

export default function Home() {
  const [selectedDiocese, setSelectedDiocese] = useState("Tất cả giáo xứ");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parishes, setParishes] = useState<any[]>([]); // Danh sách giáo xứ đã thêm
  const mapRef = useRef<MapLibreGL.Map | null>(null);

  // Route planning state
  const [startPoint, setStartPoint] = useState<string>("");
  const [endPoint, setEndPoint] = useState<string>("");
  const [waypoints, setWaypoints] = useState<string[]>([]);
  const [routeData, setRouteData] = useState<{
    coordinates: [number, number][];
    duration: number;
    distance: number;
  } | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isRoutePanelOpen, setIsRoutePanelOpen] = useState(false);

  // Kết hợp tất cả locations
  const allLocations = [
    ...churches.map(c => ({ ...c, type: 'church' as const })),
    ...dioceses.map(d => ({ ...d, type: 'diocese' as const })),
    ...parishes.map(p => ({ ...p, type: 'parish' as const })),
  ];

  // Hàm tính route
  const calculateRoute = async () => {
    if (!startPoint || !endPoint) return;

    setIsCalculatingRoute(true);
    try {
      const start = allLocations.find(l => l.name === startPoint);
      const end = allLocations.find(l => l.name === endPoint);
      
      if (!start || !end) return;

      // Build waypoints string
      let coordinates = `${start.lng},${start.lat}`;
      
      for (const wpName of waypoints) {
        const wp = allLocations.find(l => l.name === wpName);
        if (wp) {
          coordinates += `;${wp.lng},${wp.lat}`;
        }
      }
      
      coordinates += `;${end.lng},${end.lat}`;

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes?.length > 0) {
        const route = data.routes[0];
        setRouteData({
          coordinates: route.geometry.coordinates,
          duration: route.duration,
          distance: route.distance,
        });

        // Fit map to route bounds
        if (mapRef.current && route.geometry.coordinates.length > 0) {
          const bounds = route.geometry.coordinates.reduce(
            (bounds: any, coord: [number, number]) => {
              return bounds.extend(coord);
            },
            new maplibregl.LngLatBounds(
              route.geometry.coordinates[0],
              route.geometry.coordinates[0]
            )
          );
          mapRef.current.fitBounds(bounds, { padding: 50 });
        }
      }
    } catch (error) {
      console.error("Failed to calculate route:", error);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} phút`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}p`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Hàm để di chuyển đến điểm được chọn
  const handleDioceseClick = (diocese: typeof dioceses[0]) => {
    setSelectedDiocese(diocese.name);
    
    // Sử dụng flyTo để di chuyển map mượt mà đến vị trí
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [diocese.lng, diocese.lat],
        zoom: 10,
        duration: 1500, // Animation duration in ms
      });
    }
  };

  // Hàm xử lý khi chọn từ dropdown
  const handleDropdownChange = (dioceseName: string) => {
    if (dioceseName === "Tất cả giáo xứ") {
      handleShowAll();
    } else {
      const diocese = dioceses.find(d => d.name === dioceseName);
      if (diocese) handleDioceseClick(diocese);
    }
  };

  // Hàm hiển thị tất cả (zoom out)
  const handleShowAll = () => {
    setSelectedDiocese("Tất cả giáo xứ");
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [105.854444, 21.028511],
        zoom: 6,
        duration: 1500,
      });
    }
  };

  // Hàm thêm giáo xứ mới
  const handleAddParish = (parishData: any) => {
    const newParish = {
      id: Date.now(),
      ...parishData,
      addedAt: new Date().toISOString(),
    };
    setParishes(prev => [...prev, newParish]);
    console.log("Đã thêm giáo xứ:", newParish);
    // TODO: Gọi API để lưu vào database
  };

  // Lọc giáo phận (dioceses)
  const filteredDioceses = dioceses.filter((diocese) => {
    if (selectedDiocese !== "Tất cả giáo xứ" && diocese.name !== selectedDiocese) {
      return false;
    }
    const matchesSearch = diocese.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Lọc nhà thờ theo giáo phận và tìm kiếm
  const filteredChurches = churches.filter((church) => {
    if (selectedDiocese !== "Tất cả giáo xứ" && church.diocese !== selectedDiocese) {
      return false;
    }
    const matchesSearch = church.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // *** Dùng logic này khi có data giáo xứ (parishes) ***
  // const filteredParishes = allParishes.filter(p =>
  //   selectedDiocese === "Tất cả giáo xứ" ? true : p.diocese === selectedDiocese
  // );

  return (
    <div className="h-screen w-screen flex">
      {/* Sidebar */}
      <aside className="w-96 bg-white border-r border-gray-200 shadow-lg z-40 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-gray-900">Giáo xứ Việt Nam</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 p-3 border-b border-gray-200">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Thêm giáo xứ</span>
          </button>
          <button 
            onClick={() => setIsRoutePanelOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Route className="w-4 h-4" />
            <span className="font-medium">Lập tuyến đường</span>
          </button>
        </div>

        {/* Route Planning Section */}
        {isRoutePanelOpen && (
          <div className="border-b border-gray-200 bg-blue-50">
            <div className="p-3 flex items-center justify-between border-b border-blue-200">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Route className="w-4 h-4" />
                Lập tuyến đường
              </h3>
              <button
                onClick={() => setIsRoutePanelOpen(false)}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            <div className="px-4 pb-4 pt-3 space-y-2">
            {/* Start Point */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Điểm bắt đầu</label>
              <select
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn điểm bắt đầu</option>
                {allLocations.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name} ({loc.type === 'church' ? 'Nhà thờ' : loc.type === 'diocese' ? 'Giáo phận' : 'Giáo xứ'})
                  </option>
                ))}
              </select>
            </div>

            {/* Waypoints */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Điểm dừng (tùy chọn)</label>
              {waypoints.map((wp, index) => (
                <div key={index} className="flex gap-1 mb-1">
                  <select
                    value={wp}
                    onChange={(e) => {
                      const newWaypoints = [...waypoints];
                      newWaypoints[index] = e.target.value;
                      setWaypoints(newWaypoints);
                    }}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Chọn điểm dừng</option>
                    {allLocations
                      .filter(l => l.name !== startPoint && l.name !== endPoint)
                      .map((loc) => (
                        <option key={loc.name} value={loc.name}>{loc.name}</option>
                      ))}
                  </select>
                  <button
                    onClick={() => setWaypoints(waypoints.filter((_, i) => i !== index))}
                    className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => setWaypoints([...waypoints, ""])}
                className="text-xs text-blue-600 hover:text-blue-700 mt-1"
              >
                + Thêm điểm dừng
              </button>
            </div>

            {/* End Point */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Điểm kết thúc</label>
              <select
                value={endPoint}
                onChange={(e) => setEndPoint(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn điểm kết thúc</option>
                {allLocations.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name} ({loc.type === 'church' ? 'Nhà thờ' : loc.type === 'diocese' ? 'Giáo phận' : 'Giáo xứ'})
                  </option>
                ))}
              </select>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculateRoute}
              disabled={!startPoint || !endPoint || isCalculatingRoute}
              className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isCalculatingRoute ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tính...
                </>
              ) : (
                <>
                  <Route className="w-4 h-4" />
                  Tính tuyến đường
                </>
              )}
            </button>

            {/* Route Info */}
            {routeData && (
              <div className="mt-2 p-2 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-600" />
                    <span className="font-medium">{formatDuration(routeData.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Route className="w-3.5 h-3.5 text-gray-600" />
                    <span className="font-medium">{formatDistance(routeData.distance)}</span>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm giáo xứ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Horizontal Filter Bar - Dropdown + Diocese Buttons */}
        <div className="border-b border-gray-200 bg-gray-50">
          {/* Dropdown */}
          <div className="p-3">
            <select
              value={selectedDiocese}
              onChange={(e) => handleDropdownChange(e.target.value)}
              className="w-full border-2 rounded-full px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option>Tất cả giáo xứ</option>
              {dioceses.map((d) => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Horizontal Scrollable Diocese Buttons */}
          <div className="px-3 pb-3 overflow-x-auto">
            <div className="flex gap-2">
              <button
                onClick={handleShowAll}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedDiocese === "Tất cả giáo xứ"
                    ? "bg-green-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                Tất cả
              </button>
              {dioceses.map((d) => (
                <button
                  key={d.name}
                  onClick={() => handleDioceseClick(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedDiocese === d.name
                      ? "bg-green-500 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        </div>



        {/* Dioceses List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {/* Giáo xứ đã thêm */}
          {parishes.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">
                Giáo xứ đã thêm ({parishes.length})
              </h3>
              <div className="space-y-2">
                {parishes
                  .filter(p => selectedDiocese === "Tất cả giáo xứ" || p.diocese === selectedDiocese)
                  .map((parish) => (
                  <div
                    key={parish.id}
                    className="p-3 bg-green-50 hover:bg-green-100 rounded-lg cursor-pointer transition-colors border border-green-200"
                    onClick={() => {
                      if (mapRef.current) {
                        mapRef.current.flyTo({
                          center: [parish.lng, parish.lat],
                          zoom: 14,
                          duration: 1500,
                        });
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-gray-900">{parish.name}</h3>
                        <p className="text-xs text-green-600 mt-0.5">{parish.diocese}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {parish.lat.toFixed(4)}, {parish.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Giáo phận */}
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">
            Nhà thờ nổi bật
          </h3>
          <div className="space-y-2">
            {filteredChurches.map((church, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors border border-blue-200"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.flyTo({
                      center: [church.lng, church.lat],
                      zoom: 15,
                      duration: 1500,
                    });
                  }
                }}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-gray-900">{church.name}</h3>
                    <p className="text-xs text-blue-600 mt-0.5">{church.diocese}</p>
                    {church.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{church.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {church.lat.toFixed(4)}, {church.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Map */}
      <div className="flex-1">
        <Map ref={mapRef} center={[105.854444, 21.028511]} zoom={6}>
          {/* Route Line */}
          {routeData && (
            <MapRoute
              coordinates={routeData.coordinates}
              color="#3b82f6"
              width={5}
              opacity={0.8}
            />
          )}

          {/* Markers cho giáo xứ đã thêm */}
          {parishes.map((parish) => (
            <MapMarker key={parish.id} longitude={parish.lng} latitude={parish.lat}>
              <MarkerContent>
                <div className="size-5 rounded-full bg-green-500 border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform" />
                <MarkerLabel position="bottom">{parish.name}</MarkerLabel>
              </MarkerContent>
              <MarkerPopup className="p-0 w-72">
                {parish.image && (
                  <div className="relative h-40 overflow-hidden rounded-t-md">
                    <Image
                      fill
                      src={parish.image}
                      alt={parish.name}
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2 p-3">
                  <div>
                    <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                      {parish.diocese}
                    </span>
                    <h3 className="font-semibold text-gray-900 leading-tight mt-1">
                      {parish.name}
                    </h3>
                  </div>
                  {parish.description && (
                    <p className="text-sm text-gray-600">{parish.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1">
                    <MapPin className="size-3.5" />
                    <span>{parish.lat.toFixed(4)}, {parish.lng.toFixed(4)}</span>
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}

          {/* Markers cho nhà thờ nổi bật */}
          {churches.map((church) => (
            <MapMarker key={church.name} longitude={church.lng} latitude={church.lat}>
              <MarkerContent>
                <div className="size-6 rounded-full bg-blue-500 border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform" />
                <MarkerLabel position="bottom">{church.name}</MarkerLabel>
              </MarkerContent>
              <MarkerPopup className="p-0 w-72">
                <div className="relative h-40 overflow-hidden rounded-t-md">
                  <Image
                    fill
                    src={church.image}
                    alt={church.name}
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2 p-3">
                  <div>
                    <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                      {church.diocese}
                    </span>
                    <h3 className="font-semibold text-gray-900 leading-tight mt-1">
                      {church.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">{church.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1">
                    <MapPin className="size-3.5" />
                    <span>{church.lat.toFixed(4)}, {church.lng.toFixed(4)}</span>
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}

          {/* Markers cho 27 giáo phận */}
          {dioceses.map((diocese) => (
            <MapMarker key={diocese.name} longitude={diocese.lng} latitude={diocese.lat}>
              <MarkerContent>
                <div className="size-4 rounded-full bg-red-500 border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform" />
                <MarkerLabel position="bottom">{diocese.name}</MarkerLabel>
              </MarkerContent>
            </MapMarker>
          ))}
        </Map>
      </div>

      {/* Add Parish Modal */}
      <AddParishModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dioceses={dioceses.map(d => d.name)}
        onAddParish={handleAddParish}
      />
    </div>
  );
}

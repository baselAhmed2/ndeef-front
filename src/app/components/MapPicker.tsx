"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { MapPin, Crosshair, Loader2, Navigation, Check, ExternalLink, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MapPickerProps {
  onLocationSelect: (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
}

const defaultCenter = {
  lat: 30.0444, // Cairo
  lng: 31.2357,
};

// Nominatim API response interface
interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export default function MapPicker({
  onLocationSelect,
  initialAddress,
  initialLat,
  initialLng,
}: MapPickerProps) {
  const [lat, setLat] = useState(initialLat ?? defaultCenter.lat);
  const [lng, setLng] = useState(initialLng ?? defaultCenter.lng);
  const [address, setAddress] = useState(initialAddress ?? "");
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate OpenStreetMap iframe URL
  const mapPreviewSrc = useMemo(() => {
    // bbox = bounding box (left, bottom, right, top)
    const delta = 0.01; // zoom level
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [lat, lng]);

  // Open larger map URL
  const largeMapUrl = useMemo(() => {
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
  }, [lat, lng]);

  // Search address using Nominatim API (OpenStreetMap Geocoding)
  const searchAddress = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      // Egypt bounding box: roughly 22-32°N, 25-35°E
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=eg&accept-language=en`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Search failed');

      const data: NominatimResult[] = await response.json();
      setSearchResults(data);
      setShowResults(data.length > 0);
    } catch (error) {
      console.error('Address search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle address input change with debounce
  const handleAddressChange = (value: string) => {
    setAddress(value);
    onLocationSelect({
      address: value,
      latitude: lat,
      longitude: lng,
    });

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    if (value.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAddress(value);
      }, 800);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Select a search result
  const selectSearchResult = (result: NominatimResult) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    const newAddress = result.display_name;

    setLat(newLat);
    setLng(newLng);
    setAddress(newAddress);
    setShowResults(false);
    setSearchResults([]);

    onLocationSelect({
      address: newAddress,
      latitude: newLat,
      longitude: newLng,
    });
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        setLat(newLat);
        setLng(newLng);
        setIsLocating(false);
        
        // Update parent with new coordinates
        onLocationSelect({
          address: address || `Location at ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`,
          latitude: newLat,
          longitude: newLng,
        });
      },
      (error) => {
        let errorMsg = "Unable to retrieve your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMsg = "Location request timed out.";
            break;
        }
        setLocationError(errorMsg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleLatChange = (value: string) => {
    const newLat = parseFloat(value);
    if (!isNaN(newLat)) {
      setLat(newLat);
      onLocationSelect({
        address,
        latitude: newLat,
        longitude: lng,
      });
    }
  };

  const handleLngChange = (value: string) => {
    const newLng = parseFloat(value);
    if (!isNaN(newLng)) {
      setLng(newLng);
      onLocationSelect({
        address,
        latitude: lat,
        longitude: newLng,
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Address Input with Search */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Laundry address
        </label>
        <div className="relative">
          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="Search for street name (e.g., 'Tahrir Square, Cairo')"
            className="w-full border-2 rounded-xl px-4 py-3.5 pl-10 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:border-[#0f4c5c] focus:ring-[#0f4c5c]/10 border-gray-200 hover:border-gray-300 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <AnimatePresence mode="wait">
              {isSearching ? (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 size={16} className="animate-spin text-[#0f4c5c]" />
                </motion.div>
              ) : address ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check size={16} className="text-emerald-500" strokeWidth={3} />
                </motion.div>
              ) : (
                <Search size={16} className="text-gray-400" />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showResults && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border-2 border-gray-100 rounded-xl shadow-xl overflow-hidden"
            >
              <div className="max-h-[200px] overflow-y-auto">
                {searchResults.map((result, index) => (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() => selectSearchResult(result)}
                    className="w-full text-left px-4 py-3 hover:bg-[#0f4c5c]/5 transition-colors border-b border-gray-50 last:border-0"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin size={14} className="text-[#0f4c5c] mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 leading-snug line-clamp-2">
                          {result.display_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg bg-slate-50">
        <iframe
          title="Location map preview"
          src={mapPreviewSrc}
          className="h-[250px] w-full border-0"
          loading="lazy"
        />
        
        {/* Map overlay with coordinates */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-gray-600 shadow-md font-medium flex items-center gap-2">
            <Navigation size={12} className="text-[#0f4c5c]" />
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </div>
          <a
            href={largeMapUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-[#0f4c5c] shadow-md hover:bg-white transition-colors flex items-center gap-1"
          >
            <ExternalLink size={12} />
            Open Map
          </a>
        </div>
      </div>

      {/* Quick Actions & Coordinates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Use Current Location Button */}
        <motion.button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0f4c5c] text-white rounded-xl text-sm font-semibold hover:bg-[#0a3440] transition-colors disabled:opacity-70 shadow-md shadow-[#0f4c5c]/20"
        >
          {isLocating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Crosshair size={16} />
          )}
          {isLocating ? "Detecting..." : "Use My Location"}
        </motion.button>

        {/* Open in Maps Link */}
        <a
          href={largeMapUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#0f4c5c]/20 text-[#0f4c5c] rounded-xl text-sm font-semibold hover:bg-[#0f4c5c]/5 transition-colors"
        >
          <MapPin size={16} />
          Pick on Full Map
        </a>
      </div>

      {/* Manual Coordinates Input */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Fine-tune Coordinates
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Latitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={lat}
              onChange={(e) => handleLatChange(e.target.value)}
              className="w-full border-2 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:border-[#0f4c5c] focus:ring-[#0f4c5c]/10 border-gray-200 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Longitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={lng}
              onChange={(e) => handleLngChange(e.target.value)}
              className="w-full border-2 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:border-[#0f4c5c] focus:ring-[#0f4c5c]/10 border-gray-200 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {locationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-50 border border-red-200 rounded-xl"
          >
            <p className="text-red-600 text-xs flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shrink-0">!</span>
              {locationError}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      <p className="text-xs text-gray-500 leading-relaxed">
        <span className="font-medium text-[#0f4c5c]">Tip:</span> You can enter the address manually above, use your current location, or adjust the coordinates directly. The map will update automatically.
      </p>
    </motion.div>
  );
}

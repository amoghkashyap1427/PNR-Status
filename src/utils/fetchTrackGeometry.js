export const getTrainRouteGeometry = async (trainNumber) => {
    if (!trainNumber) return null;

    // Check cache first
    const cacheKey = `route_${trainNumber}`;
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const parsedCache = JSON.parse(cached);
            // Cache valid for 30 days
            if (parsedCache.timestamp && Date.now() - parsedCache.timestamp < 30 * 24 * 60 * 60 * 1000) {
                if (parsedCache.data) {
                    return parsedCache.data;
                } else if (parsedCache.points) {
                    // Old cache format detected, need to re-fetch to get stops
                    localStorage.removeItem(cacheKey);
                }
            }
        }
    } catch (e) {
        console.warn("Error reading route geometry from cache:", e);
    }

    try {
        const key = import.meta.env.VITE_RAILRADAR_KEY;
        const response = await fetch(
            `https://api.railradar.in/v1/trains/${trainNumber}/route?format=geojson&stops=true`,
            {
                headers: { Authorization: `Bearer ${key}` },
            }
        );

        if (!response.ok) {
            console.warn("Failed to fetch track geometry:", response.status);
            return null;
        }

        const json = await response.json();
        
        // Log the structure once for debugging purposes
        // console.log("Route GeoJSON Structure:", Object.keys(json.data || {}));

        let points = [];
        let stops = [];

        if (json.success && json.data) {
            // Store stops for major halt correlation
            if (json.data.stops && Array.isArray(json.data.stops)) {
                stops = json.data.stops.filter(stop => stop.lat != null && stop.lng != null);
            }

            // Prefer the GeoJSON Linestring if available
            if (json.data.geojson && json.data.geojson.type === "Feature" && json.data.geojson.geometry) {
                const geom = json.data.geojson.geometry;
                if (geom.type === "LineString") {
                    // GeoJSON coordinates are [lng, lat], Leaflet needs [lat, lng]
                    points = geom.coordinates.map(coord => [coord[1], coord[0]]);
                } else if (geom.type === "MultiLineString") {
                    points = geom.coordinates.flatMap(line => line.map(coord => [coord[1], coord[0]]));
                }
            } 
            
            // Fallback to plotting stops if no continuous linestring is available
            if (points.length === 0 && stops.length > 0) {
                points = stops.map(stop => [parseFloat(stop.lat), parseFloat(stop.lng)]);
            }
        }

        if (points.length > 0) {
            // Validate points are roughly within India bounds (lat 6-38, lng 68-98)
            const isValid = points.every(p => p[0] >= 6 && p[0] <= 38 && p[1] >= 68 && p[1] <= 98);
            
            if (isValid) {
                const responseData = { points, stops };
                // Save to cache
                try {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        timestamp: Date.now(),
                        data: responseData
                    }));
                } catch (e) {
                    console.warn("Error caching route geometry:", e);
                }
                return responseData;
            } else {
                console.warn("Track geometry coordinates are out of bounds.");
                return null;
            }
        }

        return null;
    } catch (e) {
        console.error("Error fetching track geometry:", e);
        return null;
    }
};

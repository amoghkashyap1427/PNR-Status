import { useEffect, useState, useContext, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import { SearchContext } from "../../context/SearchContext";
import trainsJson from "../../data/trainNameNumber.json";
import { getTrainRouteGeometry } from "../../utils/fetchTrackGeometry";

// Custom Icons
const createIcon = (color, extraClass = '') => L.divIcon({
    className: `custom-marker ${extraClass}`,
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 10px ${color}, 0 0 20px ${color};"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const sourceIcon = createIcon('#00ffcc'); // Cyan for source
const destIcon = createIcon('#ff3366');   // Pink for dest
const currentIcon = createIcon('#ffff00', 'tm-current-pulse');// Yellow for current with pulse

const majorHaltIcon = L.divIcon({
    className: 'custom-marker tm-major-halt',
    html: `<div></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
});

const FitBounds = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [80, 80] });
        }
    }, [bounds, map]);
    return null;
};

const TrainMap = () => {
    const { tdContextState, setTdContextState } = useContext(SearchContext);
    
    const [query, setQuery] = useState(tdContextState.trainNo || "");
    const [liveData, setLiveData] = useState(tdContextState.liveData || null);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filteredTrains, setFilteredTrains] = useState([]);
    const [showTrainList, setShowTrainList] = useState(false);
    
    // New states for track geometry
    const [trackGeometry, setTrackGeometry] = useState(null);
    const [isFetchingRoute, setIsFetchingRoute] = useState(false);

    useEffect(() => {
        if (tdContextState.trainNo && !liveData) {
            fetchTrainDetails(tdContextState.trainNo);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Effect to fetch track geometry when a train is loaded
    useEffect(() => {
        const trainNum = liveData?.train?.number;
        if (trainNum) {
            setIsFetchingRoute(true);
            setTrackGeometry(null); // Reset before fetching new
            getTrainRouteGeometry(trainNum).then(geometry => {
                setTrackGeometry(geometry);
                setIsFetchingRoute(false);
            });
        }
    }, [liveData?.train?.number]);

    // Effect to poll live status every 60 seconds
    useEffect(() => {
        let interval;
        const trainNum = liveData?.train?.number;
        if (trainNum) {
            interval = setInterval(() => {
                fetchTrainDetails(trainNum, true); // true for isPolling
            }, 60000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [liveData?.train?.number]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && query.trim()) {
            setShowTrainList(false);
            fetchTrainDetails(query);
        }
    };

    const handleQueryChange = (val) => {
        setQuery(val);
        if (val.length >= 1) {
            const q = val.toLowerCase();
            const results = trainsJson.trains
                .filter(
                    (t) =>
                        t.number.startsWith(q) ||
                        t.name.toLowerCase().includes(q)
                )
                .slice(0, 8);
            setFilteredTrains(results);
            setShowTrainList(true);
        } else {
            setShowTrainList(false);
        }
    };

    const handleSelect = (train) => {
        setQuery(train.number);
        setShowTrainList(false);
        fetchTrainDetails(train.number);
    };

    const fetchTrainDetails = async (trainNumber, isPolling = false) => {
        if (!trainNumber) return;
        if (!isPolling) {
            setLoading(true);
            setError(null);
            setLiveData(null);
        }

        try {
            const d = new Date();
            const actualDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const dateQuery = `?date=${actualDate}`;
            const response = await fetch(
                `https://api.railradar.in/v1/trains/${trainNumber.trim()}/live${dateQuery}`,
                { headers: { Authorization: `Bearer ${import.meta.env.VITE_RAILRADAR_KEY}` } }
            );
            const json = await response.json();
            if (json.success) {
                setLiveData(json.data);
                setTdContextState(prev => ({ ...prev, trainNo: trainNumber, liveData: json.data }));
            } else {
                setError("No train found. Try a different number or name.");
            }
        } catch {
            if (!isPolling) setError("API call failed. Please try again.");
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    // Extract Map Data
    let mapStops = [];
    let bounds = [];
    let sourceStop = null;
    let destStop = null;
    let currentLoc = null;

    if (liveData && liveData.train) {
        sourceStop = liveData.train.source;
        destStop = liveData.train.destination;

        // Ensure lat/lng are parsed as numbers if they exist
        if (sourceStop && sourceStop.lat && sourceStop.lng) {
            sourceStop.lat = parseFloat(sourceStop.lat);
            sourceStop.lng = parseFloat(sourceStop.lng);
            mapStops.push([sourceStop.lat, sourceStop.lng]);
            bounds.push([sourceStop.lat, sourceStop.lng]);
        }

        if (destStop && destStop.lat && destStop.lng) {
            destStop.lat = parseFloat(destStop.lat);
            destStop.lng = parseFloat(destStop.lng);
            mapStops.push([destStop.lat, destStop.lng]);
            bounds.push([destStop.lat, destStop.lng]);
        }

        // Check if current location has coordinates
        if (liveData.currentLocation) {
             const cCode = liveData.currentLocation.stationCode;
             
             // First check if current location is source or destination
             if (sourceStop && cCode === sourceStop.code) {
                 currentLoc = { ...sourceStop, stationName: sourceStop.name };
             } else if (destStop && cCode === destStop.code) {
                 currentLoc = { ...destStop, stationName: destStop.name };
             }
             
             // If we found current location coordinates
             if (currentLoc && currentLoc.lat && currentLoc.lng) {
                 bounds.push([currentLoc.lat, currentLoc.lng]);
             } else if (liveData.currentLocation.lat && liveData.currentLocation.lng) {
                 currentLoc = {
                     stationName: liveData.currentLocation.stationName || cCode,
                     lat: parseFloat(liveData.currentLocation.lat),
                     lng: parseFloat(liveData.currentLocation.lng)
                 };
                 if (sourceStop && destStop && sourceStop.lat && destStop.lat) {
                     mapStops = [
                         [sourceStop.lat, sourceStop.lng],
                         [currentLoc.lat, currentLoc.lng],
                         [destStop.lat, destStop.lng]
                     ];
                 }
                 bounds.push([currentLoc.lat, currentLoc.lng]);
             }
        }
    }

    // Extract Major Halts
    let majorHalts = [];
    if (trackGeometry && trackGeometry.stops && liveData && liveData.route) {
        liveData.route.forEach(routeStop => {
            // Check if it's a halt
            if (routeStop.isHalt) {
                // Make sure it's not the source or destination
                if (routeStop.stationCode !== sourceStop?.code && routeStop.stationCode !== destStop?.code) {
                    const geoStop = trackGeometry.stops.find(s => s.code === routeStop.stationCode);
                    if (geoStop && geoStop.lat && geoStop.lng) {
                        majorHalts.push({
                            ...routeStop,
                            lat: parseFloat(geoStop.lat),
                            lng: parseFloat(geoStop.lng)
                        });
                    }
                }
            }
        });
    }

    // Determine Polyline Positions
    const polylinePositions = (trackGeometry && trackGeometry.points && trackGeometry.points.length > 1) 
        ? trackGeometry.points 
        : (mapStops.length > 1 ? mapStops : null);

    return (
        <div className="tmApp">
            {/* Overlay Search Card */}
            <div className="tmSearchCard">
                <div className="tmInputBlock">
                    <div className="tmInputRow">
                        <i className="fa-solid fa-train tmInputIcon"></i>
                        <input
                            className="tmInput"
                            type="text"
                            placeholder="e.g. 12951 or Rajdhani"
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            onBlur={() => setTimeout(() => setShowTrainList(false), 150)}
                            onFocus={() => query.length >= 1 && setShowTrainList(true)}
                            onKeyDown={handleKeyDown}
                        />
                        {query && (
                            <button className="tmClearBtn" onClick={() => setQuery("")}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        )}
                        <button className="tmSearchBtn" onClick={() => fetchTrainDetails(query)}>
                            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-search"></i>}
                        </button>
                    </div>
                    {showTrainList && filteredTrains.length > 0 && (
                        <div className="tmDropdown">
                            {filteredTrains.map((t) => (
                                <div key={t.number} className="tmDropdownItem" onMouseDown={() => handleSelect(t)}>
                                    <span className="tmDropNumber">{t.number}</span>
                                    <span className="tmDropName">{t.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {error && <div className="tmError">{error}</div>}
                

            </div>

            {/* Full Screen Map */}
            <div className="tmMapContainer">
                <MapContainer 
                    center={[22.5937, 78.9629]} // Center of India
                    zoom={5} 
                    zoomControl={false}
                    scrollWheelZoom={true} 
                    style={{ height: "100%", width: "100%", backgroundColor: '#0a192f' }}
                >
                    {/* Dark Theme TileLayer */}
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    
                    {bounds.length > 0 && <FitBounds bounds={bounds} />}

                    {/* Polyline connecting points */}
                    {polylinePositions && (
                        <>
                            <Polyline positions={polylinePositions} color="#00ffcc" weight={10} opacity={0.2} lineCap="round" lineJoin="round" />
                            <Polyline positions={polylinePositions} color="#00ffcc" weight={3} opacity={1} dashArray="10, 10" lineCap="round" lineJoin="round" />
                        </>
                    )}

                    {/* Major Halts */}
                    {majorHalts.map(halt => (
                        <Marker key={halt.stationCode} position={[halt.lat, halt.lng]} icon={majorHaltIcon}>
                            <Popup className="tmPopup">
                                <strong>HALT</strong><br/>
                                {halt.stationName} ({halt.stationCode})<br/>
                                <span style={{ fontSize: '0.8rem', color: '#ccc' }}>
                                    Arr: {halt.scheduledArrival ? new Date(halt.scheduledArrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}<br/>
                                    Dep: {halt.scheduledDeparture ? new Date(halt.scheduledDeparture).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                                </span>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Source Marker */}
                    {sourceStop && sourceStop.lat && sourceStop.lng && (
                        <Marker position={[sourceStop.lat, sourceStop.lng]} icon={sourceIcon}>
                            <Popup className="tmPopup">
                                <strong>SOURCE</strong><br/>
                                {sourceStop.stationName} ({sourceStop.stationCode})
                            </Popup>
                        </Marker>
                    )}

                    {/* Destination Marker */}
                    {destStop && destStop.lat && destStop.lng && (
                        <Marker position={[destStop.lat, destStop.lng]} icon={destIcon}>
                            <Popup className="tmPopup">
                                <strong>DESTINATION</strong><br/>
                                {destStop.stationName} ({destStop.stationCode})
                            </Popup>
                        </Marker>
                    )}
                    
                    {/* Current Location Marker */}
                    {currentLoc && currentLoc.lat && currentLoc.lng && (
                        <Marker position={[currentLoc.lat, currentLoc.lng]} icon={currentIcon}>
                            <Popup className="tmPopup">
                                <strong>CURRENT LOCATION</strong><br/>
                                {currentLoc.stationName}
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default TrainMap;
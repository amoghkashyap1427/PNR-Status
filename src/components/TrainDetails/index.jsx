import "./style.css";
import { useState, useRef, useEffect, useCallback, useContext } from "react";
import { useLocation } from "react-router-dom";
import CustomDatePicker from "./CustomDatePicker";
import trainsJson from "../../data/trainNameNumber.json";
import { SearchContext } from "../../context/SearchContext";
import TrainMap from "../TrainMap";

// ── Constants ─────────────────────────────────────────────────
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Helpers ───────────────────────────────────────────────────
const formatDelay = (mins) => {
    if (mins == null || mins <= 0) return { text: "ON TIME", cls: "rrOnTime" };
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const hText = h > 0 ? `${h}H ` : "";
    const mText = (m > 0 || h === 0) ? `${m}M ` : "";
    return { text: `${hText}${mText}LATE`.trim(), cls: "rrLate" };
};

const formatLastUpdated = (isoStr) => {
    if (!isoStr) return "just now";
    const then = new Date(isoStr);
    const now = new Date();
    const diffMs = now - then;
    if (diffMs < 60000) return "just now";
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        if (diffDays === 1) return "1 day ago";
        return `${diffDays} days ago`;
    }
    if (diffHours > 0) {
        const remainingMins = diffMins % 60;
        if (remainingMins === 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} ${remainingMins} minute${remainingMins > 1 ? "s" : ""} ago`;
    }
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
};

const formatTime = (isoStr) => {
    if (!isoStr) return null;
    return new Date(isoStr).toLocaleTimeString("en-IN", {
        hour: "numeric", minute: "2-digit", hour12: true
    }).replace(' ', '').toUpperCase();
};

const checkDelayed = (sched, act, apiDelay) => {
    if (apiDelay > 0) return true;
    if (!sched || !act) return false;
    // Consider delayed if actual is at least 60 seconds (60000ms) after scheduled
    return (new Date(act).getTime() - new Date(sched).getTime()) >= 60000;
};

const formatDuration = (mins) => {
    if (mins == null) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
};

// A time can either be a plain string ("6:35AM") or an object
// { scheduled, actual, delayed } describing both the timetable time
// and the live/predicted time. Both shapes are supported.
const TimeCell = ({ value, align = "left" }) => {
    if (value == null || value === "") return <span className="rrTimeDash">--</span>;
    if (typeof value === "string") {
        return <span className="rrTimeSched">{value}</span>;
    }
    const { scheduled, actual, delayed } = value;
    return (
        <div className={`rrTimeStack rrTimeStack--${align}`}>
            {actual && actual !== scheduled && (
                <span className={`rrTimeActual ${delayed ? "rrTimeLate" : "rrTimeOk"}`}>{actual}</span>
            )}
            {scheduled && <span className="rrTimeSched">{scheduled}</span>}
        </div>
    );
};

// ── Route Timeline ────────────────────────────────────────────
const getBadgeText = (status) => {
    if (status === 'departed') return 'DEPARTED';
    if (status === 'upcoming') return 'UPCOMING';
    return 'HERE';
};

const RouteTimeline = ({ route, currentLocation, nextHalt, currentStopRef }) => {
    const [expandedGroups, setExpandedGroups] = useState({});

    const groups = [];
    let intermediates = [];
    let currentDayStr = null;
    let dayIndex = 1;

    const formatDateShort = (d) => {
        const parts = d.toDateString().split(' ');
        return `${parts[0]}, ${parts[1]} ${parseInt(parts[2], 10)}`;
    };

    route.forEach((stop) => {
        const isoStr = stop.scheduledArrival || stop.scheduledDeparture || stop.actualArrival || stop.actualDeparture;
        let dayDivider = null;
        if (isoStr) {
            const d = new Date(isoStr);
            const dayStr = d.toDateString();
            if (currentDayStr === null) {
                currentDayStr = dayStr;
            } else if (currentDayStr !== dayStr) {
                currentDayStr = dayStr;
                dayIndex++;
                dayDivider = `Day ${dayIndex} - ${formatDateShort(d)}`;
            }
        }

        if (dayDivider) {
            if (intermediates.length > 0) {
                groups.push({ type: "intermediate", stops: [...intermediates] });
                intermediates = [];
            }
            groups.push({ type: "day-divider", text: dayDivider, status: stop.status });
        }

        if (stop.isHalt) {
            if (intermediates.length > 0) {
                groups.push({ type: "intermediate", stops: [...intermediates] });
                intermediates = [];
            }
            groups.push({ type: "halt", stop });
        } else {
            intermediates.push(stop);
        }
    });
    if (intermediates.length > 0) {
        groups.push({ type: "intermediate", stops: intermediates });
    }

    // Auto-expand the intermediate group that currently contains the train
    useEffect(() => {
        if (!currentLocation) return;
        const idx = groups.findIndex(
            (g) => g.type === "intermediate" &&
                g.stops.some((s) => s.stationCode === currentLocation.stationCode)
        );
        if (idx !== -1) setExpandedGroups((prev) => ({ ...prev, [idx]: true }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route, currentLocation?.stationCode]);

    const toggle = (idx) =>
        setExpandedGroups((prev) => ({ ...prev, [idx]: !prev[idx] }));

    return (
        <div className="rrTimeline">
            {groups.map((group, idx) => {
                if (group.type === "day-divider") {
                    const isDeparted = group.status === "departed";
                    return (
                        <div key={`day-div-${idx}`} className="rrDayDividerGroup">
                            <div className="rrDayDividerTrackCol">
                                <div className={`rrTrackLine rrTrackFull ${isDeparted ? "rrTrackDone" : "rrTrackPending"}`}></div>
                            </div>
                            <div className="rrDayDividerContent">
                                <div className="rrDayDividerLine"></div>
                                <span className="rrDayDividerBadge">{group.text}</span>
                            </div>
                        </div>
                    );
                }

                if (group.type === "halt") {
                    const { stop } = group;
                    const isCurrent = stop.stationCode === currentLocation?.stationCode;
                    const isNextHalt = stop.stationCode === nextHalt?.stationCode;
                    const isDeparted = stop.status === "departed";
                    const isUpcoming = stop.status === "upcoming";
                    const isLast = idx === groups.length - 1;
                    const isFirst = idx === 0;

                    return (
                        <div
                            key={stop.stationCode + idx}
                            ref={isCurrent ? currentStopRef : null}
                            className={`rrStop ${isCurrent ? "rrStopCurrent" : ""} ${isDeparted ? "rrStopDeparted" : ""}`}
                        >
                            <div className="rrStopLeft">
                                {isFirst ? <span className="rrTableSrc">SRC</span> : <TimeCell value={stop.arrival} align="left" />}
                            </div>

                            <div className="rrTrackCol">
                                {!isFirst && (
                                    <div className={`rrTrackLine rrTrackTop ${isDeparted ? "rrTrackDone" : isCurrent ? "rrTrackActive" : "rrTrackPending"}`}></div>
                                )}
                                <div className={`rrDot ${isCurrent ? "rrDotActive" : isDeparted ? "rrDotDone" : "rrDotPending"}`}>
                                    {isCurrent && <i className="fa-solid fa-location-dot rrDotIcon"></i>}
                                </div>
                                {!isLast && (
                                    <div className={`rrTrackLine rrTrackBottom ${isDeparted ? "rrTrackDone" : isUpcoming ? "rrTrackPending" : "rrTrackActive"}`}></div>
                                )}
                            </div>

                            <div className="rrStopInfo">
                                <div className="rrStopNameRow">
                                    <span className={`rrStopName ${isCurrent ? "rrCyan" : ""}`}>
                                        {stop.stationName}
                                    </span>
                                    {isCurrent && (
                                        <span className="rrCurrentBadge">
                                            <span className="rrLiveDot"></span>
                                            {getBadgeText(stop.status)}
                                        </span>
                                    )}
                                    {!isCurrent && isNextHalt && (
                                        <span className="rrCurrentBadge">
                                            <span className="rrLiveDot"></span>
                                            UPCOMING
                                        </span>
                                    )}
                                </div>
                                <div className="rrStopMeta">
                                    {stop.distance != null && <span className="rrStopDist">{stop.distance} km</span>}
                                    {stop.platform && (
                                        <span className="rrStopPf">
                                            PF {stop.platform} <i className="fa-solid fa-pen rrPfEdit"></i>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="rrStopRight">
                                {isLast ? <span className="rrTableSrc">DST</span> : <TimeCell value={stop.departure} align="right" />}
                            </div>
                        </div>
                    );
                }

                // Intermediate group
                const isExpanded = expandedGroups[idx];
                const allDeparted = group.stops.every((s) => s.status === "departed");

                return (
                    <div key={`int-${idx}`} className="rrIntGroup">
                        <div className="rrIntTrackCol">
                            <div className={`rrTrackLine rrTrackFull ${allDeparted ? "rrTrackDone" : "rrTrackPending"}`}></div>
                        </div>
                        <button className="rrIntToggle" onClick={() => toggle(idx)}>
                            <i className={`fa-solid ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                            {isExpanded ? "Hide" : `${group.stops.length} intermediate station${group.stops.length > 1 ? "s" : ""}`}
                        </button>

                        {isExpanded && (
                            <div className="rrIntList">
                                {group.stops.map((s) => {
                                    const isCurrent = s.stationCode === currentLocation?.stationCode;
                                    return (
                                        <div
                                            key={s.stationCode}
                                            ref={isCurrent ? currentStopRef : null}
                                            className={`rrIntStop ${s.status === "departed" ? "rrIntDeparted" : ""} ${isCurrent ? "rrIntCurrent" : ""}`}
                                        >
                                            <div className="rrIntLeft">
                                                <TimeCell value={s.arrival} align="left" />
                                            </div>
                                            <div className="rrTrackCol rrTrackColSm">
                                                <div className={`rrTrackLine rrTrackTop ${s.status === "departed" ? "rrTrackDone" : "rrTrackPending"}`}></div>
                                                {isCurrent ? (
                                                    <div className="rrDot rrDotActive rrDotActiveSm">
                                                        <i className="fa-solid fa-location-dot rrDotIcon rrDotIconSm"></i>
                                                    </div>
                                                ) : (
                                                    <div className={`rrDotSm ${s.status === "departed" ? "rrDotSmDone" : ""}`}></div>
                                                )}
                                                <div className={`rrTrackLine rrTrackBottom ${s.status === "departed" ? "rrTrackDone" : "rrTrackPending"}`}></div>
                                            </div>
                                            <div className="rrIntInfo">
                                                <span className={`rrIntName ${isCurrent ? "rrCyan" : ""}`}>{s.stationName}</span>
                                                {isCurrent && (
                                                    <span className="rrCurrentBadge">
                                                        <span className="rrLiveDot"></span>
                                                        {getBadgeText(s.status)}
                                                    </span>
                                                )}
                                                {s.distance != null && <span className="rrIntDist">{s.distance} km</span>}
                                            </div>
                                            <div className="rrIntRight">
                                                <TimeCell value={s.departure} align="right" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};



// ── Main Component ────────────────────────────────────────────
const TrainDetails = () => {
    const location = useLocation();
    
    const { tdContextState, setTdContextState } = useContext(SearchContext);
    
    const query = tdContextState.trainNo;
    const setQuery = (val) => setTdContextState(prev => ({ ...prev, trainNo: val }));
    
    const result = tdContextState.liveData;
    const setResult = (val) => setTdContextState(prev => ({ ...prev, liveData: val }));
    
    const selectedDate = tdContextState.date === null ? "" : tdContextState.date;
    const setSelectedDate = (val) => setTdContextState(prev => ({ ...prev, date: val }));

    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState(null);
    const [activeTab, setActiveTab] = useState("tracker");
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [filteredTrains, setFilteredTrains] = useState([]);
    const [showTrainList, setShowTrainList] = useState(false);

    const shouldScrollRef = useRef(false);

    useEffect(() => {
        if (location.state?.trainNumber) {
            const tn = location.state.trainNumber;
            setQuery(tn);
            fetchTrainDetails(selectedDate, tn);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state?.trainNumber]);

    const handleStopMount = useCallback((node) => {
        if (node && shouldScrollRef.current) {
            shouldScrollRef.current = false;
            setTimeout(() => {
                node.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 300);
        }
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && query.trim()) {
            setShowTrainList(false);
            fetchTrainDetails();
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

    const handleBlur = () => setTimeout(() => setShowTrainList(false), 150);

    const handleSelect = (train) => {
        setQuery(train.number);
        setShowTrainList(false);
    };

    const fetchTrainDetails = async (overrideDate = selectedDate, overrideQuery = query) => {
        let actualQuery = typeof overrideQuery === 'string' ? overrideQuery.trim() : query.trim();
        let actualDate = typeof overrideDate === 'string' ? overrideDate : selectedDate;
        if (!actualDate) {
            const d = new Date();
            actualDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        if (!actualQuery) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const dateQuery = `?date=${actualDate}`;
            const response = await fetch(
                `https://api.railradar.in/v1/trains/${actualQuery}/live${dateQuery}`,
                { headers: { Authorization: `Bearer ${import.meta.env.VITE_RAILRADAR_KEY}` } }
            );
            const json = await response.json();
            if (json.success) {
                setResult(json.data);
                shouldScrollRef.current = true;
                console.log(json.data);
                console.log(json.data.train.coachPosition)
            } else {
                setError("No train found. Try a different number or name.");
            }
        } catch {
            setError("API call failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => { setResult(null); setQuery(""); setError(null); setSelectedDate(""); };

    const train       = result?.train;
    const rawRoute    = result?.route ?? [];
    const route       = rawRoute.map((stop) => ({
        ...stop,
        arrival: (stop.scheduledArrival || stop.actualArrival) ? {
            scheduled: formatTime(stop.scheduledArrival),
            actual: formatTime(stop.actualArrival),
            delayed: checkDelayed(stop.scheduledArrival, stop.actualArrival, stop.delayArrival)
        } : null,
        departure: (stop.scheduledDeparture || stop.actualDeparture) ? {
            scheduled: formatTime(stop.scheduledDeparture),
            actual: formatTime(stop.actualDeparture),
            delayed: checkDelayed(stop.scheduledDeparture, stop.actualDeparture, stop.delayDeparture)
        } : null,
    }));
    const source        = route[0];
    const dest           = route[route.length - 1];
    const delay           = result ? formatDelay(result.delayMinutes) : null;
    const haltStops         = route.filter((s) => s.isHalt);
    const haltCount           = train?.totalHalts ?? haltStops.length;
    const dateLabel            = result?.startDate ?? "Today";

    const currCode = result?.currentLocation?.stationCode;
    const currentStation = currCode ? route.find(s => s.stationCode === currCode) : null;
    const currentStationName = currentStation?.stationName ?? result?.currentLocation?.stationName ?? "—";
    
    // The API might populate actualArrival with future predictions, so we rely on the stop's status 
    // to determine if it has physically reached the destination.
    const isArrived = ['at-station', 'arrived', 'departed'].includes(dest?.status) || 
                      ['arrived', 'completed'].includes(result?.status);

    const getStatusText = () => {
        if (isArrived) return `Arrived at ${currentStationName}`;
        if (!result?.currentLocation?.status) return `At ${currentStationName}`;
        
        let st = result.currentLocation.status;
        if (st === 'at-station') st = 'At';
        else if (st === 'departed') st = 'Departed';
        else st = st.charAt(0).toUpperCase() + st.slice(1);
        
        return `${st} ${currentStationName}`;
    };

    // sequence numbers across the full stop list (halts + intermediates),
    // used for the "#" column of the schedule table
    const seqByCode = {};
    route.forEach((s, i) => { seqByCode[s.stationCode] = i + 1; });

    return (
        <div className="rrApp">
            <div className="rrPage">
                
                <h1 className="rrPageHeading">LIVE TRAIN STATUS</h1>

                {/* Search (shown until a train is loaded) */}
                {!result && (
                    <div className="rrSearchCard">
                        <div className="rrInputBlock" style={{ position: "relative" }}>
                            <p className="rrLabel">TRAIN NUMBER / NAME</p>
                            <div className="rrInputRow">
                                <i className="fa-solid fa-train rrInputIcon"></i>
                                <input
                                    className="rrInput"
                                    type="text"
                                    placeholder="e.g. 12301 or Rajdhani"
                                    value={query}
                                    onChange={(e) => handleQueryChange(e.target.value)}
                                    onBlur={handleBlur}
                                    onFocus={() => query.length >= 1 && setShowTrainList(true)}
                                    onKeyDown={handleKeyDown}
                                    autoComplete="off"
                                />
                                {query && (
                                    <button className="rrClearBtn" onClick={() => setQuery("")} onMouseDown={() => setQuery("")}>
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                )}
                            </div>
                            {showTrainList && filteredTrains.length > 0 && (
                                <div className="rrDropdown">
                                    {filteredTrains.map((t) => (
                                        <div
                                            key={t.number}
                                            className="rrDropdownItem"
                                            onMouseDown={() => handleSelect(t)}
                                        >
                                            <span className="rrDropdownCode">{t.number}</span>
                                            <span className="rrDropdownName">{t.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button className="rrSearchBtn" onClick={() => { setShowTrainList(false); fetchTrainDetails(); }}>
                            <i className="fa-solid fa-satellite-dish"></i>
                            TRACK TRAIN
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="rrStatus">
                        <i className="fa-solid fa-satellite-dish rrStatusIcon rrSpin"></i>
                        <p>Acquiring signal…</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="rrStatus">
                        <i className="fa-solid fa-triangle-exclamation rrStatusIcon rrError"></i>
                        <p>{error}</p>
                    </div>
                )}

                {result && (
                    <>
                        {/* Page header */}
                        <div className="rrPageHead">
                            <button className="rrBackBtn" onClick={reset} aria-label="Back to search">
                                <i className="fa-solid fa-arrow-left"></i>
                            </button>
                            <div className="rrPageHeadTitle">
                                <p className="rrPageHeadNum">{train?.number ?? result.trainNumber}</p>
                                <p className="rrPageHeadName">{train?.name ?? result.trainName}</p>
                            </div>
                            <div>
                                <button className="rrDatePill" onClick={() => setShowDatePicker(true)}>
                                    <i className="fa-regular fa-calendar"></i>
                                    <span>
                                        <span className="rrDatePillLabel">DATE</span>
                                        <span className="rrDatePillValue">{selectedDate || dateLabel}</span>
                                    </span>
                                    <i className="fa-solid fa-chevron-down rrDatePillChevron"></i>
                                </button>
                                
                                {showDatePicker && (
                                    <CustomDatePicker
                                        selectedDate={selectedDate}
                                        runDays={train?.runDays}
                                        onClose={() => setShowDatePicker(false)}
                                        onSelect={(newDate) => {
                                            setSelectedDate(newDate);
                                            setShowDatePicker(false);
                                            fetchTrainDetails(newDate);
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="rrTabs">
                            <button className={`rrTab ${activeTab === "tracker" ? "rrTabActive" : ""}`} onClick={() => setActiveTab("tracker")}>
                                <i className="fa-solid fa-train"></i> Tracker
                            </button>
                            <button className={`rrTab ${activeTab === "coach" ? "rrTabActive" : ""}`} onClick={() => setActiveTab("coach")}>
                                <i className="fa-solid fa-table-cells"></i> Coach
                            </button>
                        </div>

                        {activeTab === "coach" ? (
                            <div className="rrStatus rrCoachEmpty">
                                <i className="fa-solid fa-chair rrStatusIcon"></i>
                                <p>{result.train.coachPosition}</p>
                            </div>
                        ) : (
                            <>
                                {/* Tracker card */}
                                <div className="rrTrackerCard">
                                    <div className="rrTrackerBanner">
                                        <span>ARRIVAL</span>
                                        <span className="rrTrackerBannerDate">Day 1 - {dateLabel}</span>
                                        <span>DEPARTURE</span>
                                    </div>

                                    <div className="rrTrackerBody">
                                        {/* Train info */}
                                        <div className="rrInfoHeader">
                                            <div className="rrInfoIdBlock">
                                                <span className="rrTrainNumber">{train?.number ?? result.trainNumber}</span>
                                                <span className="rrTypePill">{train?.type ?? "Express"}</span>
                                            </div>
                                            <h2 className="rrTrainName">{train?.name ?? result.trainName}</h2>
                                        </div>

                                        {train?.runDays && (
                                            <div className="rrRunDaysBlock">
                                                <p className="rrRunDaysLabel">RUNS ON</p>
                                                <div className="rrRunDays">
                                                    {DAY_LABELS.map((d, i) => (
                                                        <span key={d} className={`rrDay ${train.runDays[i] ? "rrDayActive" : ""}`}>{d}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="rrStatsGrid">
                                            <div className="rrStatCell">
                                                <p className="rrStatLabel"><i className="fa-solid fa-ruler"></i> DISTANCE</p>
                                                <p className="rrStatValue">{train?.distance ?? dest?.distance ?? "—"} km</p>
                                            </div>
                                            <div className="rrStatCell">
                                                <p className="rrStatLabel"><i className="fa-regular fa-clock"></i> DURATION</p>
                                                <p className="rrStatValue">{train?.duration ? formatDuration(train.duration) : "—"}</p>
                                            </div>
                                            <div className="rrStatCell">
                                                <p className="rrStatLabel"><i className="fa-solid fa-flag-checkered"></i> HALTS</p>
                                                <p className="rrStatValue">{haltCount}</p>
                                            </div>
                                            <div className="rrStatCell">
                                                <p className="rrStatLabel"><i className="fa-solid fa-gauge"></i> AVG SPEED</p>
                                                <p className="rrStatValue">{train?.avgSpeed ?? "—"} km/h</p>
                                            </div>
                                            <div className="rrStatCell">
                                                <p className="rrStatLabel"><i className="fa-solid fa-bolt"></i> MAX SPEED</p>
                                                <p className="rrStatValue">{train?.maxSpeed ?? "—"} km/h</p>
                                            </div>
                                            <div className="rrStatCell">
                                                <p className="rrStatLabel"><i className="fa-solid fa-right-left"></i> RETURN</p>
                                                <p className="rrStatValue">{train?.returnTrain ?? "—"}</p>
                                            </div>
                                        </div>

                                        <div className="rrDivider"></div>

                                        {/* Timeline column headers */}
                                        <div className="rrColHeaders">
                                            <span>ARRIVAL</span>
                                            <span></span>
                                            <span>Day 1 - {dateLabel}</span>
                                            <span>DEPARTURE</span>
                                        </div>

                                        <RouteTimeline
                                            route={route}
                                            currentLocation={result.currentLocation}
                                            nextHalt={result.nextHalt}
                                            currentStopRef={handleStopMount}
                                        />

                                        <div className="rrInTrainRow">
                                            <button className="rrInTrainBtn">
                                                <i className="fa-solid fa-location-crosshairs"></i> In Train?
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sticky status bar */}
                                    <div className="rrStickyBar">
                                        <div className="rrStickyLeft">
                                            <p className="rrStickyAt">{getStatusText()}</p>
                                            <div className="rrStickyMeta">
                                                {isArrived ? (
                                                    <span className="rrStickyDelay" style={{backgroundColor: 'var(--rr-blue)', color: 'white'}}>ARRIVED</span>
                                                ) : (
                                                    <span className={`rrStickyDelay ${delay.cls}`}>{delay.text}</span>
                                                )}
                                                <span className="rrStickyUpdated">Updated {formatLastUpdated(result.lastUpdatedAt)}</span>
                                            </div>
                                        </div>
                                        <button className="rrRefreshBtn" onClick={fetchTrainDetails} aria-label="Refresh">
                                            <i className="fa-solid fa-arrows-rotate"></i>
                                        </button>
                                    </div>
                                </div>

                                <TrainMap
                                    route={result.route}
                                    currentLocation={result.currentLocation}
                                    trainName={train?.name ?? result.trainName}
                                />

                                {/* Description */}
                                {result.description && (
                                    <div className="rrDescCard">
                                        <p>{result.description}</p>
                                    </div>
                                )}

                                {/* Schedule table */}
                                <div className="rrScheduleCard">
                                    <div className="rrScheduleHead">
                                        <p>{train?.number ?? result.trainNumber} SCHEDULE — {haltCount} STOPS</p>
                                        <span className="rrScheduleTz">IST</span>
                                    </div>
                                    <div className="rrTable">
                                        <div className="rrTableRow rrTableHeadRow">
                                            <span>#</span>
                                            <span>Station</span>
                                            <span>Arr</span>
                                            <span>Dep</span>
                                            <span>Day</span>
                                            <span>Pf</span>
                                        </div>
                                        {haltStops.map((s, i) => (
                                            <div className="rrTableRow" key={s.stationCode + i}>
                                                <span className="rrTableNum">{seqByCode[s.stationCode] ?? i + 1}</span>
                                                <span className="rrTableStation">
                                                    {s.stationName} <span className="rrTableCode">{s.stationCode}</span>
                                                </span>
                                                <span className={i === 0 ? "rrTableSrc" : ""}>{i === 0 ? "SRC" : (typeof s.arrival === "string" ? s.arrival : s.arrival?.scheduled ?? "—")}</span>
                                                <span className={i === haltStops.length - 1 ? "rrTableSrc" : ""}>{i === haltStops.length - 1 ? "DST" : (typeof s.departure === "string" ? s.departure : s.departure?.scheduled ?? "—")}</span>
                                                <span>{s.dayOffset ?? 1}</span>
                                                <span>{s.platform ?? "—"}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Other trains */}
                                {result.otherTrains?.length > 0 && (
                                    <div className="rrOtherCard">
                                        <p className="rrOtherHead">
                                            OTHER TRAINS — {source?.stationCode} → {dest?.stationCode}
                                        </p>
                                        {result.otherTrains.map((t) => (
                                            <div className="rrOtherRow" key={t.number}>
                                                <p><span className="rrOtherNum">{t.number}</span> {t.name}</p>
                                                <p className="rrOtherRoute">
                                                    {t.sourceCode} ({t.sourceTime}) → {t.destCode} ({t.destTime})
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* FAQ */}
                                {result.faqs?.length > 0 && (
                                    <div className="rrFaqCard">
                                        <p className="rrFaqHead">
                                            FREQUENTLY ASKED QUESTIONS — {train?.number ?? result.trainNumber} {train?.name ?? result.trainName}
                                        </p>
                                        {result.faqs.map((f, i) => (
                                            <div className="rrFaqItem" key={i}>
                                                <p className="rrFaqQ">{f.q}</p>
                                                <p className="rrFaqA">{f.a}</p>
                                            </div>
                                        ))}
                                        <p className="rrFaqDisclaimer">
                                            <strong>Disclaimer:</strong> RailRadar is a private crowdsourced platform. We are not officially connected to Indian Railways or IRCTC. Please verify platform numbers and schedules at the station.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TrainDetails;
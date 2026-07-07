import "./style.css";
import { useState, useRef, useMemo } from "react";
import stationsJson from "../../data/stations.json";

const stations = stationsJson.data;

// "NDLS - New Delhi" → "NDLS"
const getCode = (val) => val.split(" - ")[0].trim();

// 344 minutes → "5h 44m"
const formatDuration = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

// today as YYYY-MM-DD
const getToday = () => new Date().toISOString().split("T")[0];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── StationInput ──────────────────────────────────────────────
const StationInput = ({ label, value, onChange }) => {
  const [filtered, setFiltered] = useState([]);
  const [showList, setShowList] = useState(false);
  const inputRef = useRef(null);

  const handleInput = (e) => {
    const val = e.target.value;
    onChange(val);
    if (val.length >= 1) {
      const query = val.toLowerCase();
      const results = stations
        .filter(
          (s) =>
            s.code.toLowerCase().startsWith(query) ||
            s.name.toLowerCase().includes(query),
        )
        .slice(0, 8);
      setFiltered(results);
      setShowList(true);
    } else {
      setShowList(false);
    }
  };

  const handleSelect = (station) => {
    onChange(`${station.code} - ${station.name}`);
    setShowList(false);
  };

  const handleBlur = () => {
    setTimeout(() => setShowList(false), 150);
  };

  return (
    <div className="tibInputBlock">
      <p className="tibLabel">{label}</p>
      <input
        ref={inputRef}
        className="tibInput"
        type="text"
        placeholder="Enter station code or name"
        value={value}
        onChange={handleInput}
        onBlur={handleBlur}
        onFocus={() => value.length >= 1 && setShowList(true)}
        autoComplete="off"
      />
      {value && (
        <button className="tibClearBtn" onMouseDown={() => onChange("")}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      )}
      {showList && filtered.length > 0 && (
        <div className="tibDropdown">
          {filtered.map((s) => (
            <div
              key={s.code}
              className="tibDropdownItem"
              onMouseDown={() => handleSelect(s)}
            >
              <span className="tibStationCode">{s.code}</span>
              <span className="tibStationName">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── TrainCard ─────────────────────────────────────────────────
const TrainCard = ({ item }) => {
  const { train, from, to, duration, distance, totalHaltsBetween } = item;

  const journeyDate = new Date()
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();

  return (
    <div className="tibTrainCard">
      <div className="tibCardHeader">
        <p className="tibTrainNumber">{train.number}</p>
        <p className="tibTrainType">{train.type}</p>
      </div>
      <h3 className="tibTrainName">{train.name}</h3>

      <div className="tibDivider"></div>

      <div className="tibJourneyRow">
        <div className="tibStation left">
          <h4 className="tibStationCodeLg">{from.code}</h4>
          <p className="tibStationNameSm">{from.city}</p>
          <p className="tibTime">{from.departure}</p>
        </div>

        <div className="tibMiddle">
          <div className="tibTrainIconWrap">
            <i className="fa-solid fa-train"></i>
          </div>
          <div className="tibDashedLine"></div>
          <p className="tibDuration">{formatDuration(duration)}</p>
        </div>

        <div className="tibStation right">
          <h4 className="tibStationCodeLg">{to.code}</h4>
          <p className="tibStationNameSm">{to.city}</p>
          <p className="tibTime">{to.arrival}</p>
        </div>
      </div>

      <div className="tibTrainMeta">
        <span className="tibMetaItem">
          <i className="fa-solid fa-road"></i>
          {distance} km
        </span>
        <span className="tibMetaDot">·</span>
        <span className="tibMetaItem">
          <i className="fa-solid fa-map-pin"></i>
          {totalHaltsBetween} halts
        </span>
        <span className="tibMetaDot">·</span>
        <span className="tibRunDays">
          {DAY_LABELS.map((d, i) => (
            <span
              key={d}
              className={`tibDay ${train.runDays[i] ? "tibDayActive" : ""}`}
            >
              {d}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
const TrainInBetween = () => {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const handleSwap = () => {
    setSource(destination);
    setDestination(source);
  };

  const handleSearch = async () => {
    const sourceCode = getCode(source);
    const destCode = getCode(destination);

    if (!sourceCode || !destCode) {
      setError("Please select both stations first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setActiveFilter("all");

    try {
      const response = await fetch(
        `https://api.railradar.in/v1/trains/between/${sourceCode}/${destCode}?date=${getToday()}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_RAILRADAR_KEY}`,
          },
        },
      );
      const json = await response.json();

      if (json.success) {
        setResults(json.data);
      } else {
        setError("No trains found for this route.");
      }
    } catch (err) {
      setError("API call failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Build filter pills from whatever train.type values are actually present
  const categories = useMemo(() => {
    if (!results) return [];
    const counts = {};
    results.trains.forEach((item) => {
      const type = item.train.type || "Other";
      counts[type] = (counts[type] || 0) + 1;
    });
    return [
      { key: "all", label: "All Trains", count: results.trains.length },
      ...Object.entries(counts).map(([type, count]) => ({
        key: type,
        label: type,
        count,
      })),
    ];
  }, [results]);

  const visibleTrains = useMemo(() => {
    if (!results) return [];
    if (activeFilter === "all") return results.trains;
    return results.trains.filter(
      (item) => (item.train.type || "Other") === activeFilter,
    );
  }, [results, activeFilter]);

  return (
    <div className="tibPage">
      <h1>TRAINS BETWEEN STATIONS</h1>
      <div className="tibCard">
        <div className="tibInputRow">
          <StationInput
            label="SOURCE STATION"
            value={source}
            onChange={setSource}
          />
          <button className="tibSwapBtn" onClick={handleSwap}>
            <i className="fa-solid fa-right-left"></i>
          </button>
          <StationInput
            label="DESTINATION STATION"
            value={destination}
            onChange={setDestination}
          />
        </div>
        <button className="tibSearchBtn" onClick={handleSearch}>
          <i className="fa-solid fa-magnifying-glass"></i>
          SEARCH TRAINS
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="tibStatus">
          <i className="fa-solid fa-satellite-dish tibStatusIcon tibSpinIcon"></i>
          <p>SCANNING ROUTES...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="tibStatus">
          <i className="fa-solid fa-triangle-exclamation tibStatusIcon tibErrorIcon"></i>
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="tibResults">
          <div className="tibResultsHeader">
            <div className="tibResultsTitleBlock">
              <div className="tibResultsRoute">
                <span>{results.from.name}</span>
                <i className="fa-solid fa-right-left tibRouteSwapIcon"></i>
                <span>{results.to.name}</span>
              </div>
              <p className="tibResultsMeta">
                {results.count} trains found · Today
              </p>
            </div>

            <div className="tibFilterPills">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  className={`tibFilterPill ${
                    activeFilter === cat.key ? "tibFilterPillActive" : ""
                  }`}
                  onClick={() => setActiveFilter(cat.key)}
                >
                  {cat.label}
                  <span className="tibFilterCount">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tibResultsList">
            {visibleTrains.map((item) => (
              <TrainCard key={item.train.number} item={item} />
            ))}
          </div>

          <p className="tibFooterNote">
            <i className="fa-solid fa-satellite-dish"></i>
            Timings subject to change. Tap a train for live GPS status.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrainInBetween;

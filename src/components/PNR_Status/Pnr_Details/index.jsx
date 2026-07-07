import "./style.css";

// helper: "Aug 5, 2026 10:25:00 AM" → "10:25"
const extractTime = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
};

// helper: "Aug 5, 2026 10:25:00 AM" → "05 AUG 2026"
const extractDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
};

// helper: calculate duration between two date strings → "Xh Ym"
const calcDuration = (start, end) => {
  if (!start || !end) return "N/A";
  const diff = new Date(end) - new Date(start);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
};

const PnrDetails = ({ data }) => {
  if (!data) return null;

  const passenger = data.passengerList?.[0];

  return (
    <>
      <div className="pnrDetailsPage">
        <div className="pnrDetailsCenter">
          <div className="mainContainer">

            <div className="trainDetails">
              <div className="trainHeader">
                <div className="trainIdBlock">
                  <p className="trainNumber">{data.trainNumber}</p>
                  <h2 className="trainName">{data.trainName}</h2>
                </div>
                <div className="datePill">
                  <i className="fa-regular fa-calendar"></i>
                  <span>{extractDate(data.dateOfJourney)}</span>
                </div>
              </div>

              <div className="divider"></div>

              <div className="journeyRow">
                <div className="stationBlock">
                  <h3 className="stationCode">{data.sourceStation}</h3>
                  <p className="stationName">{data.boardingPoint}</p>
                  <p className="stationTime">{extractTime(data.dateOfJourney)}</p>
                </div>

                <div className="journeyMiddle">
                  <div className="trainIconWrap">
                    <i className="fa-solid fa-train"></i>
                  </div>
                  <div className="dashedLine"></div>
                  <p className="duration">{calcDuration(data.dateOfJourney, data.arrivalDate)}</p>
                </div>

                <div className="stationBlock right">
                  <h3 className="stationCode">{data.destinationStation}</h3>
                  <p className="stationName">{data.reservationUpto}</p>
                  <p className="stationTime">{extractTime(data.arrivalDate)}</p>
                </div>
              </div>
            </div>

            <div className="coachAndConfirmDetails">
              <div className="confirmOrNot">
                <p>CURRENT STATUS</p>
                <div className="stats">
                  <h1>{passenger?.currentStatus ?? passenger?.bookingStatus ?? "N/A"}</h1>
                </div>
              </div>
              <div className="berthNCoach">
                <div className="infoHalf">
                  <p>COACH</p>
                  <h3>{passenger?.bookingCoachId ?? "N/A"}</h3>
                </div>
                <div className="verticalDivider"></div>
                <div className="infoHalf">
                  <p>SEAT / BERTH</p>
                  <h3>
                    {passenger?.bookingBerthNo ?? "N/A"}
                    {passenger?.bookingBerthCode && (
                      <span className="unit"> {passenger.bookingBerthCode}</span>
                    )}
                  </h3>
                </div>
              </div>
            </div>

            <div className="chartPrepared">
              <div className="chartLeft">
                <i className="fa-regular fa-clipboard"></i>
                <span>Chart Preparation Status</span>
              </div>
              <div className="chartRight">
                <i className="fa-solid fa-circle dot"></i>
                <span>{data.chartStatus}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default PnrDetails;
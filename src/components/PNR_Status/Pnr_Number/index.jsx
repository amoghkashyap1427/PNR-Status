import "./style.css";
import { useState } from "react";

const PnrNumber = ({ setPnrData }) => {

  const [pnr, setPnr] = useState("");

  const pnrNum = (e) => {
    setPnr(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && pnr.length === 10) {
      fetchPnrDetails();
    }
  };

  const fetchPnrDetails = async () => {
    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_RAPIDAPI_KEY,
        "x-rapidapi-host": import.meta.env.VITE_RAPIDAPI_HOST,
        "Content-Type": "application/json",
      },
    };

    try {
      const response = await fetch(
        `https://irctc-indian-railway-pnr-status.p.rapidapi.com/getPNRStatus/${pnr}`,
        options
      );
      const json = await response.json();

      if (json.success === true) {
        setPnrData(json.data);
      } else {
        console.log("API error:", json);
      }

    } catch (error) {
      console.error("API call failed:", error);
    }
  };

  return (
    <>
      <div className="pnrNumberPage">
        <div className="pnrNumberCenter">
          <h1>Train Inquiry</h1>
          <div className="pnrContainer">
            <p className="pnrHeading">
              <i
                className="fa-solid fa-qrcode"
                style={{ color: "rgb(223, 228, 237)" }}
              ></i>
              <strong>PNR SEQUENCE</strong>
            </p>
            <input
              className="pnrInputBox"
              type="text"
              placeholder="00000 00000"
              maxLength={10}
              value={pnr}
              onChange={pnrNum}
              onKeyDown={handleKeyDown}
            />
            <div className="btnContainer">
              <button className="pnrScanBtn" onClick={fetchPnrDetails}>
                🌐 I N I T I A T E - S C A N
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PnrNumber;
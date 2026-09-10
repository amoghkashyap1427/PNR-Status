import "./style.css";
import { useContext, useRef } from "react";
import { SearchContext } from "../../../context/SearchContext";

const PnrNumber = ({ setPnrData }) => {

  const { pnrContextState, setPnrContextState } = useContext(SearchContext);
  const { pnrArray: pnr } = pnrContextState;

  const setPnr = (newPnr) => {
    setPnrContextState((prev) => ({ ...prev, pnrArray: newPnr }));
  };
  const inputRefs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, ''); 
    if (!val) return;
    
    const newPnr = [...pnr];
    newPnr[index] = val.charAt(val.length - 1).toUpperCase();
    setPnr(newPnr);

    if (index < 9 && val) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!pnr[index] && index > 0) {
        inputRefs.current[index - 1].focus();
      } else {
        const newPnr = [...pnr];
        newPnr[index] = "";
        setPnr(newPnr);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < 9) {
      inputRefs.current[index + 1].focus();
    } else if (e.key === "Enter") {
      const fullPnr = pnr.join("");
      if (fullPnr.length === 10) {
        fetchPnrDetails(fullPnr);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
    if (!pastedData) return;
    const newPnr = [...pnr];
    for (let i = 0; i < pastedData.length; i++) {
      newPnr[i] = pastedData[i];
    }
    setPnr(newPnr);
    const nextIndex = Math.min(pastedData.length, 9);
    inputRefs.current[nextIndex].focus();
  };

  const fetchPnrDetails = async (overridePnr) => {
    const actualPnr = typeof overridePnr === 'string' ? overridePnr : pnr.join("");
    if (actualPnr.length !== 10) return;
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
        `https://irctc-indian-railway-pnr-status.p.rapidapi.com/getPNRStatus/${actualPnr}`,
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
          <h1>PNR STATUS</h1>
          <div className="pnrContainer">
            <p className="pnrHeading">
              <i
                className="fa-solid fa-qrcode"
                style={{ color: "rgb(223, 228, 237)" }}
              ></i>
              <strong>PNR SEQUENCE</strong>
            </p>
            <div className="pnrCubesContainer">
              {pnr.map((val, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  className="pnrCube"
                  type="text"
                  placeholder="0"
                  maxLength={2}
                  value={val}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                />
              ))}
            </div>
            <div className="btnContainer">
              <button className="pnrScanBtn" onClick={() => fetchPnrDetails()}>
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
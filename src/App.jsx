import { useState } from "react";
import "./App.css";
import PnrNumber from "./components/PNR_Status/Pnr_Number";
import PnrDetails from "./components/PNR_Status/Pnr_Details";

function App() {
  const [pnrData, setPnrData] = useState(null);

  return (
    <div className="appShell">
      <PnrNumber setPnrData={setPnrData} />
      {pnrData && (
        <>
          <div className="signalDivider">
            <span className="dividerLine"></span>
            <span className="dividerText">Signal Acquired</span>
            <span className="dividerLine"></span>
          </div>
          <PnrDetails data={pnrData} />
        </>
      )}
    </div>
  );
}

export default App;
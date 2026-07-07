import { useState } from "react";
import PnrNumber from "../Pnr_Number";
import PnrDetails from "../Pnr_Details"

const PnrStatus = () => {
  const [pnrData, setPnrData] = useState(null);

  return (
    <>
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
    </>
  );
};

export default PnrStatus;
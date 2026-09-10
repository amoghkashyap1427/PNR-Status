import { useContext } from "react";
import PnrNumber from "../Pnr_Number";
import PnrDetails from "../Pnr_Details";
import { SearchContext } from "../../../context/SearchContext";

const PnrStatus = () => {
  const { pnrContextState, setPnrContextState } = useContext(SearchContext);
  const { pnrData } = pnrContextState;

  const setPnrData = (data) => {
    setPnrContextState((prev) => ({ ...prev, pnrData: data }));
  };

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
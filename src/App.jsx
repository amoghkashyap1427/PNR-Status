import { useState } from "react";
import "./App.css";
import PnrStatus from "./components/PNR_Status/PnrStatus";
import Sidebar from "./components/Sidebar";
import ComingSoon from "./components/Comming_Soon";
import TrainInBetween from "./components/Train_Between_Station";
const PAGES = {
  "Introduction":            <ComingSoon feature="Introduction"            />,
  "PNR Status":              <PnrStatus />,
  "Get Train Details":       <ComingSoon feature="Get Train Details"       />,
  "Live Train Status":       <ComingSoon feature="Live Train Status"       />,
  "Train Route":             <ComingSoon feature="Train Route"             />,
  "Trains Between Stations":  <TrainInBetween/>,
  "Station Board":           <ComingSoon feature="Station Board"           />,
  "Station Live Board":      <ComingSoon feature="Station Live Board"      />,
};

function App() {
  const [activeItem, setActiveItem] = useState("PNR Status");

  return (
    <div className="appLayout">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <main className="appMain">
        <div className="appShell">
          {PAGES[activeItem] ?? <ComingSoon feature={activeItem} />}
        </div>
      </main>
    </div>
  );
}

export default App;
import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import PnrStatus from './components/PNR_Status/PnrStatus'
import TrainInBetween from './components/TrainInBetween'
import TrainDetails from './components/TrainDetails'
import TrainMap from './components/TrainMap'
import ComingSoon from './components/Coming_Soon'

function App() {
  const [activeItem, setActiveItem] = useState("PNR Status");

  return (
    <div className="appLayout">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <main className="appMain">
        <div className="appShell">
          <Routes>
            <Route path="/"                       element={<Navigate to="/pnr-status" replace />} />
            <Route path="/pnr-status"             element={<PnrStatus />} />
            <Route path="/trains-between"         element={<TrainInBetween />} />
            <Route path="/live-train-status"      element={<TrainDetails/>} />
            <Route path="/train-route"            element={<ComingSoon feature="Train Route" />} />
            <Route path="/station-board"          element={<ComingSoon feature="Station Board" />} />
            <Route path="/station-live-board"     element={<ComingSoon feature="Station Live Board" />} />
            <Route path="/introduction"           element={<ComingSoon feature="Introduction" />} />
            <Route path="/live-train-map"         element={<TrainMap/>} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
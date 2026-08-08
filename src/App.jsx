import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import APCurriculumMap from './pages/APCurriculumMap'
import IBCurriculumMap from './pages/IBCurriculumMap'
import SimulationPage from './pages/SimulationPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/ap" element={<APCurriculumMap />} />
        <Route path="/ib" element={<IBCurriculumMap />} />
        <Route path="/sim/momentum" element={<SimulationPage />} />
        {/* a mistyped URL should land somewhere real rather than on a blank page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

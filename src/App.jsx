import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import APCurriculumMap from './pages/APCurriculumMap'
import IBCurriculumMap from './pages/IBCurriculumMap'
import SimulationPage from './pages/SimulationPage'
import TopicFolder from './pages/TopicFolder'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/ap" element={<APCurriculumMap />} />
        <Route path="/ib" element={<IBCurriculumMap />} />
        {/* One route for every simulation — the slug is looked up in src/simulations/registry.js,
            and an unknown one redirects home from inside the page. */}
        <Route path="/sim/:topic" element={<SimulationPage />} />
        {/* DEMO — the A.2 topic folder. Hard-coded rather than /topic/:code because one folder
            exists; a param would imply a lookup table that does not. */}
        <Route path="/topic/a2" element={<TopicFolder />} />
        {/* a mistyped URL should land somewhere real rather than on a blank page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

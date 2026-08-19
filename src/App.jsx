import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import APCurriculumMap from './pages/APCurriculumMap'
import IBCurriculumMap from './pages/IBCurriculumMap'
import SimulationPage from './pages/SimulationPage'
import TopicFolder from './pages/TopicFolder'
import TaughtItemPage from './pages/TaughtItemPage'

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
        {/* One route for every topic folder — the code is looked up in
            src/topics/topicRegistry.js, and an unknown one redirects home from inside the page.
            /topic/a2 still resolves; it is now a registry key rather than a hard-coded path. */}
        <Route path="/topic/:code" element={<TopicFolder />} />
        {/* One taught section inside a folder. Same lookup, one level deeper — an item that is
            not taught content, or has no data file yet, redirects home from inside the page. */}
        <Route path="/topic/:code/:itemId" element={<TaughtItemPage />} />
        {/* a mistyped URL should land somewhere real rather than on a blank page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

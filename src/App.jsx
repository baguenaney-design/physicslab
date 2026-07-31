import { useState } from 'react'
import MomentumCanvas from './simulations/momentum/MomentumCanvas'
import Controls from './simulations/momentum/Controls'

function App() {
  const [simState, setSimState] = useState({
    massA: 2,
    velocityA: 3,
    massB: 3,
    velocityB: -1,
    mode: 'elastic',
  })

  const handleControlsChange = (partial) => {
    setSimState((prev) => ({ ...prev, ...partial }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh' }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <MomentumCanvas {...simState} />
      </div>
      <Controls {...simState} onChange={handleControlsChange} />
    </div>
  )
}

export default App

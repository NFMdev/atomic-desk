import { useState } from 'react'
import './App.css'
import { SpaceGrid } from './components/space-grid'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <SpaceGrid />
    </>
  )
}

export default App

import { useState } from 'react'
import InputPage from './pages/InputPage.jsx'
import ResultPage from './pages/ResultPage.jsx'

export default function App() {
  const [page, setPage] = useState('input')
  const [sajuData, setSajuData] = useState(null)

  function handleComplete(data) {
    setSajuData(data)
    setPage('result')
  }

  function handleRestart() {
    setSajuData(null)
    setPage('input')
  }

  if (page === 'result') return <ResultPage data={sajuData} onRestart={handleRestart} />
  return <InputPage onComplete={handleComplete} />
}

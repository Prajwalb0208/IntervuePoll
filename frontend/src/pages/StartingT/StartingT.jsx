import React, { useEffect, useState, useRef } from 'react'
import getSocket, { registerUser } from '../../socket'
import ChatBox from '../../components/ChatBox/ChatBox'
import { useNavigate } from 'react-router-dom'
import './StartingT.css'

const socket = getSocket()

export default function StartingT() {
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [duration, setDuration] = useState(60)
  const [correctIndex, setCorrectIndex] = useState(null)
  const [state, setState] = useState(null)
  const [results, setResults] = useState(null)
  const [history, setHistory] = useState([])
  const navigate = useNavigate()
  const questionInputRef = useRef(null)

  useEffect(() => {
    registerUser('Teacher', 'teacher')
    socket.emit('fetch_history')
    const onStarted = (q) => { setState(q); setResults(null) }
    const onClosed = (p) => { setResults(p); setHistory((h)=>[...h, p]) }
    const onHistory = (h) => setHistory(h)
    const onLive = (payload) => { if (state && payload.id === state.id) setResults((prev)=>({ ...(prev||{}), results: payload.results, options: state.options, text: state.text, correctIndex: state.correctIndex })) }
    socket.on('question_started', onStarted)
    socket.on('question_closed', onClosed)
    socket.on('history', onHistory)
    socket.on('live_results', onLive)
    return () => { socket.off('question_started', onStarted); socket.off('question_closed', onClosed); socket.off('history', onHistory); socket.off('live_results', onLive) }
  }, [state])

  function setOpt(i, v) {
    const next = [...options]
    next[i] = v
    setOptions(next)
  }

  function addOption() { setOptions((o) => [...o, '']) }

  function ask() {
    const withIdx = options.map((o, i) => ({ text: o, i })).filter(x => x.text.trim() !== '')
    const filteredOptions = withIdx.map(x => x.text)
    const ci = withIdx.findIndex(x => x.i === correctIndex)
    socket.emit('ask_question', { text: questionText, options: filteredOptions, durationSec: duration, correctIndex: ci >= 0 ? ci : null })
    setQuestionText('')
    setOptions(['',''])
    setCorrectIndex(null)
  }

  function focusCreate() {
    if (questionInputRef.current) {
      questionInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      questionInputRef.current.focus()
    }
  }

  function endNow() {
    socket.emit('end_question')
  }

  const renderOption = (option, index, percentage, isCorrect) => (
    <div key={index} className={`option-item ${isCorrect ? 'correct' : ''}`}>
      <div className="option-number">{index + 1}</div>
      <div className="option-content">
        <div className="option-text">{option}</div>
        {percentage !== undefined && (
          <div className="option-bar">
            <div className="bar-bg">
              <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
            </div>
            <div className="percentage">{percentage}%</div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="teacher-container">
      <div className="teacher-main">
        <h3 className="teacher-title">Question</h3>
        <div className="create-section">
          <h2>Create Question</h2>
          <textarea 
            ref={questionInputRef}
            value={questionText} 
            onChange={e => setQuestionText(e.target.value)} 
            rows={3} 
            placeholder="Enter your question"
            className="question-input"
          />
          <div className="options-section">
            <h3>Edit Options</h3>
            {options.map((o, i) => (
              <div key={i} className="option-row">
                <div className="option-number">{i+1}</div>
                <input 
                  value={o} 
                  onChange={e => setOpt(i, e.target.value)} 
                  placeholder={`Option ${i+1}`}
                  className="option-input"
                />
                <div className="correct-section">
                  <span>Is it Correct?</span>
                  <label>
                    <input type="radio" name="correct" checked={correctIndex===i} onChange={()=>setCorrectIndex(i)} /> Yes
                  </label>
                  <label>
                    <input type="radio" name="correct" checked={correctIndex!==i} onChange={()=>setCorrectIndex(null)} /> No
                  </label>
                </div>
              </div>
            ))}
            <button onClick={addOption} className="add-option-btn">+ Add More option</button>
          </div>
          <div className="duration-section">
            <label>Duration: </label>
            <select value={duration} onChange={e => setDuration(parseInt(e.target.value))}>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
              <option value={90}>90 seconds</option>
              <option value={120}>120 seconds</option>
            </select>
          </div>
          <button onClick={ask} className="ask-btn">Ask Question</button>
          {state && <button onClick={endNow} className="end-btn">End Question</button>}
        </div>

        {state && (
          <div className="current-question">
            <div className="question-item current">
              <div className="question-header">
                <span>{results ? 'Question' : `Question ${history.length + 1} (Live)`}</span>
              </div>
              <div className="question-card">
                <div className="question-text">{state.text}</div>
              </div>
              <div className="options-container">
                {state.options.map((option, index) => {
                  const percentage = results?.results?.percentages?.[index] || 0;
                  const isCorrect = results && state.correctIndex === index;
                  return renderOption(option, index, percentage, isCorrect);
                })}
              </div>
              {results && (
                <div className="no-question">
                  <button onClick={() => { setState(null); setResults(null); }} className="ask-new-btn">+ Ask a new question</button>
                </div>
              )}
            </div>
          </div>
        )}

        {!state && (
          <div className="no-question">
            <button onClick={ask} className="ask-new-btn">+ Ask a new question</button>
          </div>
        )}
      </div>

      <div className="history-section">
        <button 
          className="history-btn" 
          onClick={() => navigate('/history')}
        >
          View Poll history
        </button>
      </div>

      <div style={{position:'fixed',left:0,right:0,bottom:22,display:'flex',justifyContent:'center'}}>
        <button onClick={focusCreate} className="ask-new-btn">+ Ask a new question</button>
      </div>

      <ChatBox role="teacher" me="Teacher" />
    </div>
  )
}

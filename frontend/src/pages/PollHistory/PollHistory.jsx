import React, { useEffect, useState } from 'react'
import getSocket from '../../socket'
import { useNavigate } from 'react-router-dom'
import './PollHistory.css'

const socket = getSocket()

export default function PollHistory() {
  const [history, setHistory] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    socket.emit('fetch_history')
    const onHistory = (h) => setHistory(h)
    socket.on('history', onHistory)
    return () => { socket.off('history', onHistory) }
  }, [])

  const renderOption = (option, index, percentage, isCorrect) => (
    <div key={index} className={`option-item ${isCorrect ? 'correct' : ''}`}>
      <div className="option-number">{index + 1}</div>
      <div className="option-content">
        <div className="option-text">{option}</div>
        <div className="option-bar">
          <div className="bar-bg">
            <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
          </div>
          <div className="percentage">{percentage}%</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="poll-history">
      <div className="history-header">
        <button className="back-btn" onClick={() => navigate('/teacher')}>
          ← Back to Teacher
        </button>
        <h1>Poll History</h1>
      </div>
      
      <div className="history-container">
        {history.length === 0 ? (
          <div className="no-history">
            <p>No poll history available yet.</p>
          </div>
        ) : (
          history.map((h, idx) => (
            <div key={h.id} className="history-item">
              <div className="history-header">
                <h3>Question {idx + 1}</h3>
                <span className="date">{new Date(h.askedAt).toLocaleString()}</span>
              </div>
              <div className="question-card">
                <div className="question-text">{h.text}</div>
              </div>
              <div className="options-container">
                {h.options.map((option, index) => {
                  const percentage = h.results.percentages[index];
                  const isCorrect = h.correctIndex === index;
                  return renderOption(option, index, percentage, isCorrect);
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}



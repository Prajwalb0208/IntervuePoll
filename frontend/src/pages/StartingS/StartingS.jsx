import React, { useEffect, useState } from 'react';
import { assets } from '../../assets/assets';
import './StartingS.css';
import getSocket, { registerUser } from '../../socket'
import ChatBox from '../../components/ChatBox/ChatBox'
import KickOut from '../KickOut/KickOut'

const socket = getSocket()

const StartingS = () => {
  const [name, setName] = useState('')
  const [registered, setRegistered] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selected, setSelected] = useState(null)
  const [kicked, setKicked] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [allQuestions, setAllQuestions] = useState([])
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const onStarted = (q) => { 
      setCurrentQuestion(q); 
      setSelected(null); 
      setSubmitted(false);
    }
    const onState = (q) => { 
      setCurrentQuestion(q);
    }
    const onClosed = (p) => { 
      if (currentQuestion && currentQuestion.id === p.id) {
        setCurrentQuestion(null);
        setSelected(null);
        setSubmitted(false);
      }
    }
    const onLive = (payload) => { 
      if (currentQuestion && currentQuestion.id === payload.id) {
        setCurrentQuestion(prev => ({
          ...prev,
          liveResults: payload.results
        }));
      }
    }
    const onKicked = () => setKicked(true)
    socket.on('question_started', onStarted)
    socket.on('question_state', onState)
    socket.on('question_closed', onClosed)
    socket.on('live_results', onLive)
    socket.on('kicked', onKicked)
    return () => { 
      socket.off('question_started', onStarted); 
      socket.off('question_state', onState); 
      socket.off('question_closed', onClosed); 
      socket.off('live_results', onLive); 
      socket.off('kicked', onKicked) 
    }
  }, [currentQuestion])
  useEffect(() => {
    if (currentQuestion && !currentQuestion.closed) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.floor((currentQuestion.deadlineTs - Date.now()) / 1000));
        setTimeLeft(remaining);
        
        if (remaining > 0) {
          setTimeout(updateTimer, 1000);
        }
      };
      updateTimer();
    }
  }, [currentQuestion])

  function register() {
    if (!name.trim()) return
    registerUser(name, 'student')
    setRegistered(true)
    socket.emit('fetch_history')
  }

  function submit() {
    if (selected == null || !currentQuestion) return
    socket.emit('submit_answer', { optionIndex: selected })
    setSubmitted(true)
  }

  function submitForQuestion(questionId) {
    if (selected == null) return
    socket.emit('submit_answer', { optionIndex: selected, questionId })
    setSubmitted(true)
    setCurrentQuestion(null);
    setSelected(null);
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const renderOption = (option, index, percentage, isCorrect, isSelected, isClickable = false) => (
    <div 
      key={index} 
      className={`option-item ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isClickable ? 'clickable' : ''}`}
      onClick={isClickable && !submitted ? () => setSelected(index) : undefined}
    >
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

  const renderQuestion = (q) => {
    const isActive = !q.closed && q.deadlineTs > Date.now();
    const questionTimeLeft = Math.max(0, Math.floor((q.deadlineTs - Date.now()) / 1000));
    const isClickable = isActive && !submitted;
    
    return (
      <div key={q.id} className={`question-item current ${isActive ? 'active' : 'closed'}`}>
        <div className="question-header">
          <span>Current Question</span>
          {isActive && (
            <span className="timer">⏰ {formatTime(questionTimeLeft)}</span>
          )}
          {q.closed && (
            <span className="status">Closed</span>
          )}
          {submitted && (
            <span className="status submitted">Submitted</span>
          )}
        </div>
        <div className="question-card">
          <div className="question-text">{q.text}</div>
        </div>
        <div className="options-container">
          {q.options.map((option, index) => {
            const percentage = q.liveResults?.percentages?.[index] || 0;
            const isCorrect = q.correctIndex === index;
            const isSelected = selected === index;
            return renderOption(option, index, percentage, isCorrect, isSelected, isClickable);
          })}
        </div>
        {isActive && !submitted && (
          <div className="submit-section">
            <button className="submit-btn" onClick={() => submitForQuestion(q.id)} disabled={selected === null}>
              Submit
            </button>
          </div>
        )}
        {submitted && (
          <div className="submitted-message">Answer Submitted!</div>
        )}
      </div>
    );
  }

  if (kicked) {
    return <KickOut />
  }
  return (
    <div className="startings">
      <div className="startings__container">
        <img src={assets.logo} alt="Logo" className="startings__logo" />
        {!registered ? (
          <>
            <h1 className="startings__title">Let's <span>Get Started</span></h1>
            <div className="startings__subtitle">
              If you’re a student, you’ll be able to <span className="startings__subtitle-bold">submit your answers</span>, participate in live polls, and see how your responses compare with your classmates
            </div>
            <div className="startings__form">
              <label htmlFor="student-name" className="startings__label">Enter your Name</label>
              <input 
                id="student-name" 
                className="startings__input" 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
            </div>
            <button className="landingpage__continue-btn" onClick={register}>Continue</button>
          </>
        ) : (
          <div className="questions-container">
            {currentQuestion && renderQuestion(currentQuestion)}
            {!currentQuestion && (
              <div className="wait-message">
                <div className="spinner"></div>
                Wait for the teacher to ask questions..
              </div>
            )}
          </div>
        )}
        <ChatBox role="student" me={name || 'User'} />
      </div>
    </div>
  );
};

export default StartingS;
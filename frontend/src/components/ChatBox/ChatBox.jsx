import React, { useEffect, useMemo, useRef, useState } from 'react'
import getSocket from '../../socket'
import './ChatBox.css'

const socket = getSocket()

export default function ChatBox({ role = 'student', me = 'User' }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('chat') // chat | participants
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [participants, setParticipants] = useState([])
  const endRef = useRef(null)

  useEffect(() => {
    const onMsg = (m) => setMessages((prev) => [...prev, m])
    const onParticipants = (list) => setParticipants(list)
    socket.on('chat_message', onMsg)
    socket.on('participants', onParticipants)
    return () => { socket.off('chat_message', onMsg); socket.off('participants', onParticipants) }
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open])

  function send() {
    if (!text.trim()) return
    socket.emit('chat_message', { text })
    setText('')
  }

  function kick(id) {
    socket.emit('kick', { userId: id })
  }

  return (
    <>
      <div className="chatfab" onClick={() => setOpen((v)=>!v)}>💬</div>
      {open && (
        <div className="chatpanel">
          <div className="chatpanel__tabs">
            <div className={`chatpanel__tab ${tab==='chat'?'chatpanel__tab--active':''}`} onClick={()=>setTab('chat')}>Chat</div>
            <div className={`chatpanel__tab ${tab==='participants'?'chatpanel__tab--active':''}`} onClick={()=>setTab('participants')}>Participants</div>
          </div>
          {tab === 'chat' ? (
            <>
              <div className="chatpanel__body">
                {messages.map(m => (
                  <div key={m.id} className="chat__item">
                    <div className="chat__name">{m.name}</div>
                    <div className={`chat__bubble ${m.name===me?'chat__bubble--me':''}`}>{m.text}</div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="chatpanel__input">
                <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message" onKeyDown={(e)=> e.key==='Enter' && send()} />
                <button onClick={send}>Send</button>
              </div>
            </>
          ) : (
            <div className="chatpanel__body">
              {participants.map(p => (
                <div key={p.id} className="participants__row">
                  <span>{p.name}</span>
                  {role==='teacher' && p.role !== 'teacher' && (
                    <button className="participants__kick" onClick={()=>kick(p.id)}>Kick out</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

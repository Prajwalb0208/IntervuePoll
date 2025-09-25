import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';
import './LandingPage.css';

const LandingPage = () => {
  const [role, setRole] = useState('student');
  const navigate = useNavigate();
  const onContinue = () => {
    if (role === 'teacher') navigate('/teacher');
    else navigate('/student');
  };
  return (
    <div className="landingpage">
      <div className="landingpage__container">
        <img src={assets.logo} alt="Logo" className="landingpage__logo" />
        <h1 className="landingpage__title">
          Welcome to the <span>Live Polling System</span>
        </h1>
        <p className="landingpage__subtitle">
          Please select the role that best describes you to begin using the live polling system
        </p>
        <div className="landingpage__roles">
          <div
            className={`landingpage__role ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
            tabIndex={0}
          >
            <span>I’m a Student</span>
            <div>Lorem Ipsum is simply dummy text of the printing and typesetting industry</div>
          </div>
          <div
            className={`landingpage__role ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => setRole('teacher')}
            tabIndex={0}
          >
            <span>I’m a Teacher</span>
            <div>Submit answers and view live poll results in real-time.</div>
          </div>
        </div>
        <button className="landingpage__continue-btn" onClick={onContinue}>Continue</button>
      </div>
    </div>
  );
};

export default LandingPage;

import React from 'react';
import { assets } from '../../assets/assets';
import './KickOut.css';

const KickOut = () => {
  return (
    <div className="kickout">
      <div className="kickout__container">
        <img src={assets.logo} alt="Intervue Poll" className="kickout__logo" />
        <h1 className="kickout__title">You’ve been Kicked out !</h1>
        <div className="kickout__subtitle">
          Looks like the teacher had removed you from the poll system. Please try again sometime.
        </div>
      </div>
    </div>
  );
};

export default KickOut;

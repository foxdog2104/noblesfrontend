import React from 'react';
import MainLayout from '../layouts/MainLayout';
import rene from '../assets/images/Rene.png';
import line from '../assets/images/Line 8.svg';
import './TestModelPage.css';

const mockModel = {
  name: 'Rene',
  agency: 'Currently none',
  location: 'Calgary',
  height: "5'9",
  bust: '32',
  waist: '24',
  hips: '35',
  hair: 'Black',
  eyes: 'Brown',
  shoe: '8',
  bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
};

const TestModelPage = () => {
  return (
    <MainLayout scrollTarget=".scrolling-text-wrapper">
      <div className="fullWrapper">

        <div className="headerContainer">
          <p className="headerAgency">Agencies: {mockModel.agency}</p>
          <p className="headerName">{mockModel.name}</p>
          <p className="headerLocation">Based in {mockModel.location}</p>
        </div>

        <img src={line} alt="" />

        <div className="headerContainer">
          <div className="modelInfo">
            <p className="infoWrapper">Height {mockModel.height}</p>
            <p className="infoWrapper">Bust {mockModel.bust}</p>
            <p className="infoWrapper">Waist {mockModel.waist}</p>
            <p className="infoWrapper">Hips {mockModel.hips}</p>
            <p className="infoWrapper">Hair {mockModel.hair}</p>
            <p className="infoWrapper">Eyes {mockModel.eyes}</p>
            <p className="infoWrapper">Shoe {mockModel.shoe}</p>
          </div>
          <div className="modelPhoto">
            <img src={rene} alt={mockModel.name} />
          </div>
          <div className="modelBio">
            <h3 className="infoReal">About</h3>
            <p>{mockModel.bio}</p>
          </div>
        </div>

        <div>
          <h2>Photography</h2>
        </div>

      </div>
    </MainLayout>
  );
};

export default TestModelPage;

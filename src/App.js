import React, { useState } from 'react'
import * as tf from '@tensorflow/tfjs'
import logo from './fitness_logo.png'
import './App.css'

const handleRunTraining = (event) => {
  // console.log('Run training');
  tf.tensor([[1, 2, 3], [4, 5, 6], [2, 3]]).print();
}

function WelcomeMessage({ children }){
  return <p>{children}</p>
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <WelcomeMessage children={'Welcome to the Virtual Fitness Assistant!'} />
        <a
          className="App-link"
          href="https://www.manning.com/bundles/pose-estimation-with-TensorFlowjs-ser"
          target="_blank"
          rel="noopener noreferrer"
        >
          Human Pose Estimation with TensorFlow.js and React
        </a>
        <br />
        <button onClick={handleRunTraining} > Run training </button>

      </header>
    </div>
  );
}

export default App;

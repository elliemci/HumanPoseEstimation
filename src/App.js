import React, { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';

import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';
import * as webgl from '@tensorflow/tfjs-backend-webgl';

import logo from './fitness_logo.png'
import './App.css'
import { tSExternalModuleReference } from '@babel/types'
import { scalePoses } from '@tensorflow-models/posenet/dist/util';


function WelcomeMessage({ children }) {
  return <p>{children}</p>
  }


function App() {
  /* define a variable model with the useState hook to stores the PoseNet model*/
  const [model, setModel] = useState(null);
  const webcamRef = useRef(null)

   /* tell React what to do when the component is flushed,
    with a function which performs the effect */
  useEffect(() => {
    loadPosenet();
  }, [])

  // useRef hook allows a direct reference to the DOM element in the functional component
  useRef (() => {

  })

  /* Load the PoseNet model */
  const loadPosenet = async () => {
    // variables defined with let can be re-assigned
    let posenetModel = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 800, height: 600},
      multiplier: 0.75
    });

    setModel(posenetModel)
    console.log("Posenet Model Loaded!")
  };

  return (
    <div className="App">
      <header className="App-header">
        
        <img src={logo} className="App-logo" alt="logo" />

        <Webcam ref={webcamRef} 
                style={{
                  position: "absolute",
                  marginLeft: "auto",
                  marginRight: "auto",
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  zindex: 9,
                  width: 800,  //800
                  height: 600, //600
                }}
        />

        <WelcomeMessage children={'Welcome to the Virtual Fitness Assistant!'} />
        <a
          className="App-link"
          href="https://www.manning.com/bundles/pose-estimation-with-TensorFlowjs-ser"
          target="_blank"
          rel="noopener noreferrer"
        >
          Human Pose Estimation with TensorFlow.js and React
        </a>
      </header>
    </div>
  );
}

export default App;

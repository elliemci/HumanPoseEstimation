import React, { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { drawKeypoints, drawSkeleton, drawBoundingBox } from "./utilities";

import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';
import * as webgl from '@tensorflow/tfjs-backend-webgl';

import logo from './fitness_logo.png'
import './App.css'
import { tSExternalModuleReference } from '@babel/types'
import { scalePoses } from '@tensorflow-models/posenet/dist/util';



function App() {
  /* define a variable model with the useState hook to stores the PoseNet model */
  const [model, setModel] = useState(null);
  // variable with useState hook
  const [isPoseEstimation, setIsPoseEstimation] = useState(false)
  // useRef hook stores reference to the DOM element so that interacting with itbypasses the usua React state-to_UI flow
  const webcamRef = useRef(null);
  const poseEstimationLoop = useRef(null);
  const canvasRef = useRef(null)


  function WelcomeMessage({ children }) {
    return <p>{children}</p>
    };

   // tell React what to do when the component is flushed, with a function which performs the effect
  useEffect(() => {
    loadPosenet();
  }, [])

  // useRef hook allows a direct reference to the DOM element in the functional component
  useRef (() => {

  });

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

  const startPoseEstimation = () => {
    if ( // check for undefined property
        typeof webcamRef.current !== "undefined" &&
               webcamRef.current !== null &&
               webcamRef.current.video.readyState === 4 
        ) {
          // to run the pose estimation define infinite loop executing each 100 miliseconds
        poseEstimationLoop.current = setInterval(() => {
         // get video properties from webcamRef
         const video = webcamRef.current.video;
         const videoWidth = webcamRef.current.video.videoWidth;
         const videoHeight = webcamRef.current.video.videoHeight;
         // set the width and height properties of webcamRef from the video width and height
         webcamRef.current.video.width = videoWidth;
         webcamRef.current.video.height = videoHeight;
         // get the current time
         var tic = new Date().getTime()
         
         // do pose estimation from the loaded PoseNet model, passing the webcamRef
         model.estimateSinglePose(video, { flipHorizontal : false }).then(pose => {
          // in the promise of the estimateSinglePose method, log the end time and TensorFlow.js backend and the pose information
          var toc = new Date().getTime();

          console.log(toc - tic, " ms");
          console.log(tf.getBackend());
          console.log(pose);

          drawCanvas(pose, videoWidth, videoHeight, canvasRef);
         });
        }, 100);
    }
  };

  const stopPoseEstimation = () => clearInterval(poseEstimationLoop.current);

  const handlePoseEstimation = () => {
    /* check if pose estimation is running, then stop it, otherwise start pose estimation; 
       set the setIsPoseEstimation variable to update with current state */
    if (isPoseEstimation) {
      stopPoseEstimation();
    } else {
      startPoseEstimation();
    }

    setIsPoseEstimation(current => !current)

  };

  const drawCanvas = (pose, videoWidth, videaoHeight, canvas) => {
  
    const context = canvas.current.getContext("2d");

    canvas.current.width = videoWidth;
    canvas.current.height = videaoHeight;

    drawKeypoints(pose["keypoints"], 0.5, context);
    drawSkeleton(pose["keypoints"], 0.5, context);
    // drawBoundingBox(pose["keypoints"], context);
  };

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
      
        <Webcam ref={webcamRef} //ref stores the state so that updating the state doesn’t cause the component to re-render.
                style={{
                  position: "absolute",
                  marginLeft: "auto",
                  marginRight: "auto",
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  zindex: 9,
                  width: 800,  
                  height: 600, 
                }}
        />

        <canvas ref={canvasRef}
                style={{
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                right: 0,
                textAlign: "center",
                zindex: 9,
                width: 800,  
                height: 600, 
              }}
        />

        <button style={{
          height: "50px",
          width: "100px",
          position: "relative",
          marginLeft: "auto",
          marginRight: "auto",
          top: 125,
          left: 0,
          right: 0,
          textAlign: "center",
          zindex: 9}} 
          onClick = {handlePoseEstimation}>
          {isPoseEstimation ? "Stop" : "Start"}
        </button>

        
      </header>
    </div>
  );
}

export default App;

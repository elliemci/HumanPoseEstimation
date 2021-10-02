import React, { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { drawKeypoints, drawSkeleton, drawBoundingBox } from "./utilities";

import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';
import * as webgl from '@tensorflow/tfjs-backend-webgl';

import logo from './fitness_logo.png'
import './App.css'
import { tSExternalModuleReference } from '@babel/types';
import { scalePoses } from '@tensorflow-models/posenet/dist/util';
import { Grid, AppBar, Toolbar, Typography, Button, Card, CardContent, CardActions, FormControl, InputLabel, NativeSelect, FormHelperText } from '@material-ui/core';
import { TheneProvider, createMuiTheme, makeStyles, mergeClasses } from '@material-ui/core/styles';

const theme = createMuiTheme();
/* usestyles() wraping the makeStyles function from material-ui/core,
   for creating an object of properties which will be access and inserted
   into the JSX; makeStyles access the returned useStyle that accepts one 
   argument: the properties to be used for interpolation in the JSX;
   assigning that function to a variable commonly called classes; the styles
   can be inserted into JSX with className={classes.key}, give the element a 
   class that corresponds to a set of styles created with makeStyles */
const useStyles = makeStyles((theme) => ({

    backgroundAppBar : { 
                        background: '#1875d2' 
                      },
    title : { 
              flexGrow : 1,
              textAlign : 'left' 
            },
    statsCard : { 
                  width : '250px',
                  margin: '10px'
                },
    singleLine : {
                    display :  'flex',
                    alignItems : 'center',
                    justifyContent :  'center'
                  },
    formControl : {
                    margin : theme.spacing(1),
                    minWidth : 120
                  }
   
    }));

function App() {
  // useRef hook stores reference to the DOM element so that interacting with itbypasses the usua React state-to_UI flow
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  /* define a variable model with the useState hook to stores the PoseNet model */
  const [model, setModel] = useState(null);
  const poseEstimationLoop = useRef(null);
  // variable with useState hook
  const [isPoseEstimation, setIsPoseEstimation] = useState(false);
  const [workoutState, setWorkoutState] = useState({ 
                                                    workout: '',
                                                    name: 'hai'
                                                    });
  const classes = useStyles();

  function WelcomeMessage({ children }) {
    return <p>{children}</p>
    };

  // useRef hook allows a direct reference to the DOM element in the functional component
  useRef (() => {
  });
  
  // tell React what to do when the component is flushed, with a function which performs the effect  
  useEffect(() => {
    loadPosenet();
  }, [])

  // Load the PoseNet model, which runs on JavaScript API Web Graphics Library WebGL for rendering 2d
  const loadPosenet = async () => {
    // variables defined with let can be re-assigned
    let posenetModel = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 800, height: 600},
      multiplier: 0.75
    });

    setModel(posenetModel)
    console.log("Posenet Model Loaded..")
  };

  const startPoseEstimation = () => {
    if (
      typeof webcamRef.current !== "undefined" && // check for undefined property
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // to run the pose estimation define infinite loop executing each 100 miliseconds
      poseEstimationLoop.current = setInterval(() => {
        // get video Properties from webcampRef
        const video = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        // set the width and height properties of webcamRef from the video width and height
        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        // get the current time
        var tic = new Date().getTime()
        // do pose estimation from the loaded PoseNet model, passing the webcamRef
        model.estimateSinglePose(video, { flipHorizontal: false }).then(pose => {
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

  const handleWorkoutSelect = (event) => {
    const name = event.target.name;
    setWorkoutState({
      ...workoutState,
      [name]: event.target.value,
    });

  };

  // Pose estimation is calculated and displayed on the canvas over the webcam view
  const drawCanvas = (pose, videoWidth, videaoHeight, canvas) => {
  
    const context = canvas.current.getContext("2d");

    canvas.current.width = videoWidth;
    canvas.current.height = videaoHeight;

    drawKeypoints(pose["keypoints"], 0.5, context);
    drawSkeleton(pose["keypoints"], 0.5, context);
    // drawBoundingBox(pose["keypoints"], context);
  };

  //? <img src={logo} className="App-logo" alt="logo" /> prevents the Webcam working ?
  return (
    <div className="App">

  {/*<img src={logo} className="App-logo" alt="logo" />
       <WelcomeMessage children={'Welcome to the Virtual Fitness Assistant!'} />
       <a
        className="App-link"
        href="https://www.manning.com/bundles/pose-estimation-with-TensorFlowjs-ser"
        target="_blank"
        rel="noopener noreferrer"
       > 
         Human Pose Estimation with TensorFlow.js and React
      </a>
  */}

<Grid container spacing={3}>
        <Grid item xs={12}>
          <AppBar position="static" className={classes.backgroundAppBar}>
            <Toolbar variant="dense">
              <Typography variant="h6" color="inherit" className={classes.title}>
                Fitness Assistant
              </Typography>
              <Button color="inherit">Start Workout</Button>
              <Button color="inherit">History</Button>
              <Button color="inherit">Reset</Button>
            </Toolbar>
          </AppBar>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Webcam
                ref={webcamRef}
                style={{
                  marginTop: "10px",
                  marginBottom: "10px",
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
              <canvas
                ref={canvasRef}
                style={{
                  marginTop: "10px",
                  marginBottom: "10px",
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
            </CardContent>
            <CardActions style={{ justifyContent: 'center' }}>
              <Grid container spacing={0}>
                <Grid item xs={12}>
                  <Toolbar style={{ justifyContent: 'center' }}>
                    <Card className={classes.statsCard}>
                      <CardContent>
                        <Typography className={classes.title} color="textSecondary" gutterBottom>
                          Jumping Jacks
                          </Typography>
                        <Typography variant="h2" component="h2" color="secondary">
                          75
                          </Typography>
                      </CardContent>
                    </Card>
                    <Card className={classes.statsCard}>
                      <CardContent>
                        <Typography className={classes.title} color="textSecondary" gutterBottom>
                          Wall-Sit
                        </Typography>
                        <Typography variant="h2" component="h2" color="secondary">
                          200
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card className={classes.statsCard}>
                      <CardContent>
                        <Typography className={classes.title} color="textSecondary" gutterBottom>
                          Lunges
                        </Typography>
                        <Typography variant="h2" component="h2" color="secondary">
                          25
                        </Typography>
                      </CardContent>
                    </Card>
                  </Toolbar>
                </Grid>
              </Grid>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12} className={classes.singleLine}>
          <FormControl  required='true' className={classes.formControl} >
            <InputLabel htmlFor='age-native-helper'>
              Workout
            </InputLabel>
            <NativeSelect value={workoutState.workout} 
                          onChange={handleWorkoutSelect()}
                          inputProps={{ name : 'workout', 
                                        id : 'native-helper'}}>
              <option>None</option>
              <option>Jumping Jacks</option>
              <option>Wall-Sit</option>
              <option>Lunges</option>
            </NativeSelect>
            <FormHelperText>Select training data type</FormHelperText>
          </FormControl>
          <Toolbar>
            <Typography style={{marginRight: 16}}>
              <Button variant='contained'>Collect Data</Button>
              <Button variant='contained>'>Train Model</Button>
            </Typography>
          </Toolbar>
        </Grid>
      </Grid>
   </div>
  );
}

export default App;
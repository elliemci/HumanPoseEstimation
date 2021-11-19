import React, { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";

import * as tf from '@tensorflow/tfjs';
import * as posenet from "@tensorflow-models/posenet";
import '@tensorflow/tfjs-backend-webgl';

import { drawKeypoints, drawSkeleton } from "./utilities";
import { Grid, AppBar, Toolbar, Typography, Button, Card, CardContent, CardActions, CircularProgress } from '@material-ui/core';
import { FormControl, InputLabel, NativeSelect, FormHelperText, Snackbar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import MuiAlert from '@material-ui/lab/Alert';

import { Dialog } from '@material-ui/core';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

// import logo from './fitness_logo.png'
import './App.css';

import '@tensorflow/tfjs-backend-webgl';

import { processData } from "./dataProcessing";
import { runTraining } from "./modelTraining";
import { runInference } from "./modelInference";

// code from the Material-UI Dialog component documentation
const styles = (theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(2),
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
});

const DialogTitle = withStyles(styles)((props) => {
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

const DialogContent = withStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);

const DialogActions = withStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1),
  },
}))(MuiDialogActions);

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

/* usestyles() wraping the makeStyles function from material-ui/core,
   for creating an object of properties which will be access and inserted
   into the JSX; makeStyles access the returned useStyle that accepts one 
   argument: the properties to be used for interpolation in the JSX;
   assigning that function to a variable commonly called classes; the styles
   can be inserted into JSX with className={classes.key}, give the element a 
   class that corresponds to a set of styles created with makeStyles */
const useStyles = makeStyles((theme) => ({
  backgroundAppBar: {
    background: '#1875d2'
  },
  title: {
    flexGrow: 1,
    textAlign: 'left'
  },
  statsCard: {
    width: '250px',
    margin: '10px',
  },
  singleLine: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  }
}));

// helper function for delay functionality of inference on pose data
const delay = (time) => {
  return new Promise((resolve, reject) => {
    if (isNaN(time)) {
      reject(new Error('delay requires a valid number.'));
    } else {
      setTimeout(resolve, time);
    }
  });
}

function App() {

  // hooks that stores references to the DOM elements bypassesing the usual React state-to_UI flow
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  // define a variable model with the useState hook to stores the PoseNet model
  const [model, setModel] = useState(null);
  // define trainModel variable using React hook useState 
  const [trainModel, setTrainModel] = useState(false);
  const poseEstimationLoop = useRef(null);

  const [isPoseEstimation, setIsPoseEstimation] = useState(false)
  const [opCollectData, setOpCollectData] = useState('inactive');
  const [workoutState, setWorkoutState] = useState({
    workout: '',
    name: 'hai'
  });

  const [snackbarDataColl, setSnackbarDataColl] = useState(false);
  const [snackbarDataNotColl, setSnackbarDataNotColl] = useState(false);
  const [snackbarWorkoutError, setSnackbarWorkoutError] = useState(false);

  const [rawData, setRawData] = useState([]);
  const [dataCollect, setDataCollect] = useState(false);
  const [isPoseEstimationWorkout, setIsPoseEstimationWorkout] = useState(false);

  const classes = useStyles();

  const windowWidth = 800;
  const windowHeight = 600;

  // define global variables with function scope
  let state = 'waiting';
  let runningWorkout = false;
  let modelWorkout = null;
  let workoutCallDelay = false;
  let workoutDelayStart = 0;

  // variables for the UI cards
  const [jumpingJackCount, setJumpingJackCount] = useState(0);
  let jjCount = 0;
  const [wallSitCount, setWallSitCount] = useState(0);
  let wsCount = 0;
  const [lungesCount, setLungesCount] = useState(0);
  let lCount = 0;

  const [jumpingJackCountTotal, setJumpingJackCountTotal] = useState(0);
  const [wallSitCountTotal, setWallSitCountTotal] = useState(0);
  const [lungesCountTotal, setLungesCountTotal] = useState(0);

  const [historyDialog, setHistoryDialog] = useState(false);

  const openHistoryDialog = () => {
    setHistoryDialog(true);
  }

  const closeHistoryDialog = () => {
    setHistoryDialog(false);
  }

  const openSnackbarDataColl = () => {
    setSnackbarDataColl(true);
  };

  const closeSnackbarDataColl = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarDataColl(false);
  };

  const openSnackbarDataNotColl = () => {
    setSnackbarDataNotColl(true);
  };

  const closeSnackbarDataNotColl = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarDataNotColl(false);
  };

  /*function WelcomeMessage({ children }) {
    return <p>{children}</p>
  }*/

  // Define snackbarTrainingError
  const [snackbarTrainingError, setSnackbarTrainingError] = useState(false);

  // two methods to include a notification when there is no training data
  const openSnackbarTrainingError = () => {
    setSnackbarTrainingError(true);
  };

  const closeSnackbarTrainingError = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarTrainingError(false);
  };

  // snackbar componets displaying an error if no saved model is found
  const openSnackbarWorkoutError = () => {
    setSnackbarWorkoutError(true);
  }

  const closeSnackbarWorkoutError = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarWorkoutError(false);
  }
  // tell React what to do when the component is flushed with a function which performs the effect
  useEffect(() => {
    loadPosenet();
  }, []);

  const collectData = async () => {

    setOpCollectData("active");
    await delay(10000); // add 10 seconds delay
    // Open Material-UI component snackbar and display information
    openSnackbarDataColl();
    console.log("collecting");
    state = "collecting";

    await delay(30000); //30 seconds data collection

    openSnackbarDataNotColl();
    console.log("not collecting");
    state = "waiting";

    setOpCollectData("inactive");
  };

  // update local storage for workout type and increment counter for current workout type
  const updateStats = (workoutType) => {
    //console.log("Workout type: ", workoutType);
    let workoutCount = localStorage.getItem(workoutType);
    //console.log("Workout count: ", workoutCount)
    if (workoutCount === null) {
      localStorage.setItem(workoutType, 1);
    } else {
      console.log("Increase counter")
      localStorage.setItem(workoutType, parseInt(workoutCount) + 1);
    }
  };

  // Load the PoseNet model, which runs on JavaScript API Web Graphics Library WebGL for rendering 2d
  const loadPosenet = async () => {
    // variables defined with let, so that can be re-assigned
    let loadedModel = await posenet.load({
      architecture: 'MobileNetV1', // ResNet has higher accuracy, but longer load and inferance time
      outputStride: 16, // how much we’re scaling down the output relative to the input image size, the higher the value the faster the performance the lower the accuracy
      inputResolution: { width: 800, height: 600 },
      multiplier: 0.75 // image scale factor
    });

    setModel(loadedModel)
    console.log("Posenet Model Loaded..")
  };

  const startPoseEstimation = () => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Run pose estimation with infinite loop executing every 100 milliseconds
      poseEstimationLoop.current = setInterval(() => {

        // Get Video Properties from webcampRef
        const video = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        // set the width and height properties of webcamRef from the video width and height
        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        // get current time
        var tic = new Date().getTime()
        // do pose estimation from the loaded PoseNet model, passing the webcamRef
        model.estimateSinglePose(video, {
          flipHorizontal: false // an input to posnet, if the pose should be flipped/ mirrored horizontally
        }).then(pose => {
          var toc = new Date().getTime();
          //each pose returned by the PoseNet model comes with 17 data points with coordinates (x,y) and a score 
          let inputs = [];
          // a loop to iterate through the pose key data points
          for (let i = 0; i < pose.keypoints.length; i++) {
            // for keypoints with score higher than 0.1 normalize to [-1,1] using video dims
            let x = pose.keypoints[i].position.x;
            let y = pose.keypoints[i].position.y;
            // noisy data removal based on low scores
            if (pose.keypoints[i].score < 0.1) {
              x = 0;
              y = 0;
            } else {
              // data normalization 
              x = (x / (windowWidth / 2)) - 1;
              y = (y / (windowHeight / 2)) - 1;
            }
            // save the x and y coordiantes into a flatten/ single array
            inputs.push(x);
            inputs.push(y);
          }

          //console.log("STATE->" + state);

          if (state === "collecting") {
            console.log(toc - tic, " ms");
            console.log(tf.getBackend());
            console.log(pose);
            console.log(workoutState.workout);

            // features in xs, training targets in ys
            const rawDataRow = { xs: inputs, ys: workoutState.workout }

            rawData.push(rawDataRow);
            setRawData(rawData); // update raw data

          }
          // code to process the inference results; run inference with a delay after a successful classification
          // NB: Make a delay time configurable as a UI input to hable inference sensitivity
          if (runningWorkout === true) {
            if (workoutCallDelay === false) {

              // variable to hold the data for inference
              const rawDataRow = { xs: inputs };
              const result = runInference(modelWorkout, rawDataRow);

              // process the result and count the workout type
              if (result !== null) {
                if (result === 'JUMPING_JACKS') {
                  jjCount += 1;
                  setJumpingJackCount(jjCount);
                  updateStats('JUMPING_JACKS');
                } else if (result === 'WALL_SIT') {
                  wsCount += 1;
                  setWallSitCount(wsCount);
                  updateStats('WALL_SIT');
                } else if (result === 'LUNGES') {
                  lCount += 1;
                  setLungesCount(lCount);
                  updateStats('LUNGES');
                }
                workoutCallDelay = true;
                workoutDelayStart = new Date().getTime();
              }
            } else {
              // inference with a delay, pause of 1.5 seconds before allow the next inference call
              const workoutTimeDiff = new Date().getTime() - workoutDelayStart;
              if (workoutTimeDiff > 1500) { // inference time can't be that long as it will skip an expercise being done
                workoutDelayStart = 0;
                workoutCallDelay = false;
              }
            }
          }

          drawCanvas(pose, videoWidth, videoHeight, canvasRef);
        });
      }, 100);
    }
  };

  const drawCanvas = (pose, videoWidth, videoHeight, canvas) => {

    const context = canvas.current.getContext("2d");

    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;

    drawKeypoints(pose["keypoints"], 0.5, context);
    drawSkeleton(pose["keypoints"], 0.5, context);
  };

  const stopPoseEstimation = () => clearInterval(poseEstimationLoop.current);

  const handlePoseEstimation = async (input) => {
    // check the mode
    if (input === "START_WORKOUT") {
      if (isPoseEstimationWorkout) {
        // stop the workout and execute code when Stop button is pressed
        runningWorkout = false;
        setIsPoseEstimationWorkout(false);
        stopPoseEstimation();
      } else {
        runningWorkout = true;
        try {// load the saved model
          modelWorkout = await tf.loadLayersModel('indexeddb://fitness-assistant-model');
          setIsPoseEstimationWorkout(true);
          startPoseEstimation();
        } catch (err) {// display an error if no saved model was found
          openSnackbarWorkoutError();
        }
      }
    }

    if (input === 'COLLECT_DATA') {
      if (isPoseEstimation) {
        if (opCollectData === 'inactive') {
          setIsPoseEstimation(current => !current);
          stopPoseEstimation();
          state = 'waiting';
          setDataCollect(false);
        }
      } else {
        if (workoutState.workout.length > 0) {
          setIsPoseEstimation(current => !current);
          startPoseEstimation();
          collectData();
          setDataCollect(true);
        }
      }
    }
  };

  const handleWorkoutSelect = (event) => {
    const name = event.target.name;
    setWorkoutState({
      ...workoutState,
      [name]: event.target.value,
    });
  };

  const handleTrainModel = async () => {

    if (rawData.length > 0) {
      // print collected data size info
      console.log('Data size: ' + rawData.length);
      // use setTrainModel to set the trainModel variable to true before training
      setTrainModel(true);
      // call the data processing helper function which returns three variables
      const [numOfFeatures, convertedDatasetTraining, convertedDatasetValidation] = processData(rawData);
      // call the function runTraining from modelTraining.js, called with await since asynchrous, passing the result from the processData
      await runTraining(convertedDatasetTraining, convertedDatasetValidation, numOfFeatures);
      // after training the set the trainModel variable to false
      setTrainModel(false);
    } else {
      openSnackbarTrainingError();
    }
  }

  const showWorkoutHistory = () => {
    // read the workout information from local storage
    let jjWorkoutCount = localStorage.getItem("JUMPING_JACKS") === null ? 0 : localStorage.getItem("JUMPING_JACKS");
    let wsWorkoutCount = localStorage.getItem("WALL_SIT") === null ? 0 : localStorage.getItem("WALL_SIT");
    let lWorkoutCount = localStorage.getItem("LUNGES") === null ? 0 : localStorage.getItem("LUNGES");
    // assign each workout count variable to the corresponding useState global variable
    setJumpingJackCountTotal(jjWorkoutCount);
    setWallSitCountTotal(wsWorkoutCount);
    setLungesCountTotal(lWorkoutCount);

    openHistoryDialog();
  }

  // After this function call, training data and model training need to be done from the start
  const resetAll = async () => {
    setRawData([]);

    setJumpingJackCount(0);
    setWallSitCount(0);
    setLungesCount(0);

    indexedDB.deleteDatabase('tensorflowjs');
  }

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
              <Button color="inherit"
                onClick={() => handlePoseEstimation("START_WORKOUT")}
                disabled={dataCollect || trainModel}>
                {isPoseEstimationWorkout ? "Stop" : "Start Workout"}
              </Button>
              <Button color="inherit"
                onClick={() => showWorkoutHistory()}
                disabled={dataCollect || trainModel}>
                History
              </Button>
              <Button color="inherit"
                onClick={() => resetAll()}
                disabled={dataCollect || trainModel || isPoseEstimationWorkout}>
                Reset
              </Button>
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
                          {jumpingJackCount}
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card className={classes.statsCard}>
                      <CardContent>
                        <Typography className={classes.title} color="textSecondary" gutterBottom>
                          Wall-Sit
                        </Typography>
                        <Typography variant="h2" component="h2" color="secondary">
                          {wallSitCount}
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card className={classes.statsCard}>
                      <CardContent>
                        <Typography className={classes.title} color="textSecondary" gutterBottom>
                          Lunges
                        </Typography>
                        <Typography variant="h2" component="h2" color="secondary">
                          {lungesCount}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Toolbar>
                </Grid>
                <Grid item xs={12} className={classes.singleLine}>
                  <FormControl className={classes.formControl} required>
                    <InputLabel htmlFor="age-native-helper">Workout</InputLabel>
                    <NativeSelect
                      value={workoutState.workout}
                      onChange={handleWorkoutSelect}
                      inputProps={{
                        name: 'workout',
                        id: 'age-native-helper',
                      }}>
                      <option aria-label='None' value="" />
                      <option value={'JUMPING_JACKS'}>Jumping Jacks</option>
                      <option value={'WALL_SIT'}>Wall-Sit</option>
                      <option value={'LUNGES'}>Lunges</option>
                    </NativeSelect>
                    <FormHelperText>Select training data type</FormHelperText>
                  </FormControl>
                  <Toolbar>
                    <Typography style={{ marginRight: 16 }}>
                      {/* Button with text and color property, onClick event handler calls the handle PoseEstimation method
                        and passes COLLECT_DATA as argument. The button text and color property change when data has being collected 
                        When training is running, the Collect Data button should stay disabled. */}
                      <Button variant="contained"
                        onClick={() => handlePoseEstimation('COLLECT_DATA')}
                        color={isPoseEstimation ? 'secondary' : 'default'}
                        // When training is running, the Collect Data button should stay disabled.
                        disabled={trainModel || isPoseEstimationWorkout}>
                        {isPoseEstimation ? "Stop" : "Collect Data"}
                      </Button>
                    </ Typography>
                    <Typography style={{ marginRight: 16 }}>
                      <Button variant="contained"
                        onClick={() => handleTrainModel()}
                        disabled={dataCollect || isPoseEstimationWorkout}>
                        Train Model
                      </Button>
                    </Typography>
                    {/* CircularProgress component indicating when the raining process is running */}
                    {trainModel ? <CircularProgress color="secondary" /> : null}
                  </Toolbar>
                </Grid>
              </Grid>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      <Dialog onClose={closeHistoryDialog} aria-labelledby="customized-dialog-title" open={historyDialog} maxWidth="md">
        <DialogTitle id="customized-dialog-title" onClose={closeHistoryDialog}>
          Workout History
        </DialogTitle>
        <DialogContent>
          <Toolbar>
            <Card className={classes.statsCard}>
              <CardContent>
                <Typography className={classes.title} color="textSecondary" gutterBottom>
                  Jumping Jacks
                </Typography>
                <Typography variant="h2" component="h2" color="secondary">
                  {jumpingJackCountTotal}
                </Typography>
              </CardContent>
            </Card>
            <Card className={classes.statsCard}>
              <CardContent>
                <Typography className={classes.title} color="textSecondary" gutterBottom>
                  Wall-Sit
                </Typography>
                <Typography variant="h2" component="h2" color="secondary">
                  {wallSitCountTotal}
                </Typography>
              </CardContent>
            </Card>
            <Card className={classes.statsCard}>
              <CardContent>
                <Typography className={classes.title} color="textSecondary" gutterBottom>
                  Lunges
                </Typography>
                <Typography variant="h2" component="h2" color="secondary">
                  {lungesCountTotal}
                </Typography>
              </CardContent>
            </Card>
          </Toolbar>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={closeHistoryDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbarDataColl} autoHideDuration={2000} onClose={closeSnackbarDataColl}>
        <Alert onClose={closeSnackbarDataColl} severity="info">
          Started collecting pose data!
        </Alert>
      </Snackbar>
      <Snackbar open={snackbarDataNotColl} autoHideDuration={2000} onClose={closeSnackbarDataNotColl}>
        <Alert onClose={closeSnackbarDataNotColl} severity="success">
          Completed collecting pose data!
        </Alert>
      </Snackbar>
      <Snackbar open={snackbarTrainingError} autoHideDuration={2000} onclose={closeSnackbarTrainingError}>
        <Alert onClose={closeSnackbarTrainingError} severity="error">
          Training data is not available!
        </Alert>
      </Snackbar>
      <Snackbar open={snackbarWorkoutError} autoHideDuration={2000} onClose={closeSnackbarWorkoutError}>
        <Alert onClose={closeSnackbarWorkoutError} severity="error">
          Model is not avilable!
        </Alert>
      </Snackbar>
    </div>
  );
}

export default App;

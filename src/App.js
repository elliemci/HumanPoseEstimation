import React, { useEffect, useState } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as posenet from '@tensorflow-models/posenet'

import * as webgl from '@tensorflow/tfjs-backend-webgl'
import logo from './fitness_logo.png'
import './App.css'
import { tSExternalModuleReference } from '@babel/types'


/*const handleRunTraining = (event) => {

  // define a one-layer sequential model handled by the listener
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

   // compile the model with SGD optimizer and meanSquareError loss
  model.compile({ optimizer: tf.train.sgd(0.1), loss: 'meanSquaredError' });
  model.summary();

   // define input data based on the equation y = 2x - 1
  const xs = tf.tensor2d([-1.0, 0.0, 1.0, 2.0, 3.0, 4.0], [6, 1]);
  const ys = tf.tensor2d([-3.0, -1.0, 2.0, 3.0, 5.0, 7.0], [6, 1]);

   // pass the input and target attributes into the training function;
   // when doTraining call is done, predict function is called on 10
  doTraining(model, xs, ys).then(() => {
    // call the model to predict for unseeen data point
    const prediction = model.predict(tf.tensor2d([10], [1, 1]));
    var res = prediction.dataSync()[0];
    prediction.dispose();
    // print the prediction result
    console.log('Result: ' + res);
   });
 }*/

function WelcomeMessage({ children }) {
  return <p>{children}</p>
  }

/*async function doTraining(model, xs, ys) {
  const history =
    await model.fit(xs, ys,
      {
        epochs: 200,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            // log the training statistics
            console.log("Epoch:"
              + epoch
              + " Loss:"
              + logs.loss);

          }
        }
      });
  console.log(history.params);
}*/

function App() {
  /* define a variable model with the useState hook to stores the PoseNet model*/
  const [model, setModel] = useState(null);

   /* tell React what to do when the component is flushed,
    with a function which performs the effect */
  useEffect(() => {
    loadPosenet();
  }, [])

  /* Load the PoseNet model */
  const loadPosenet = async () => {
    const posenetModel = await posenet.load({
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
        <WelcomeMessage children={'Welcome to the Virtual Fitness Assistant!'} />
        <a
          className="App-link"
          href="https://www.manning.com/bundles/pose-estimation-with-TensorFlowjs-ser"
          target="_blank"
          rel="noopener noreferrer"
        >
          Human Pose Estimation with TensorFlow.js and React
        </a>
        <h4>{ console.log({ model })}</h4>
      </header>
    </div>
  );
}

export default App;

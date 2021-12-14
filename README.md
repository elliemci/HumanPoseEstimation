# Getting Started with Fitness Assistant

Fitness Assistant is a React Web App using TensorFlow.js single-person PoseNet model which tracks human poses and classifies them. The React Material-UI libraries are used to implement the UI grid layout and logicto handle the user input. React component captures the live Webcam video stream, in which the human pose is detected.
The PoseNet model returns 17 keypoints. Each keypoint position is represented by a x and y coordinates and a score ranging from 0 to 1, representing model's confidence of the keypoint. The detected pose is displayed on top of the webcam view.

The TensorFlow.js model is trained to classify workout exercises by type - Jumping Jacks, Wall-Sit and Lunges. It classifies a pose as one of the specified types when the return probability is above set streshold.

In the project directory run:

### `yarn install`

to set up the dependencies

### `yarn start`

to start the application

### Collect Data

Click the Reset button to clear the cached training data and the model. Select Jumping Jacks workout and click Collect Data, have 10 seconds before the 30 seconds recording of the data starts. Make sure your whole body is visible on the webcam. Once the blue snackbar notification is visible, stand up in the Jumping Jacks position and move your body slightly, to capture variations. Press the Stop button after you see the green snckbar notification, when the data capture is complete. The browser concole log gives information about logged data.Repeat the above steps with Wall Sits and Lunges workout types.

### Train the Model

Click Train Model button; 100 epochs is plenty. The train model saves in the browser's local DB and can be reused.

### Use the Model

Click the Start Workout button and start doing exercises. The model will classify them and you will see the counter numbers increasing.

The History button will display the statistics counted from previous workout sessions.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

### App Deployment on GitHubPages

The app is published at
[deployment]https://elliemci.github.io/react-tensorflowjs-app/

import * as tf from '@tensorflow/tfjs';

export function runInference(model, data) {

    console.log(data)
    
    // 2d tensor to hold the array of 17 data points x and y coordinates ordered sequentially returned by the PoseNet
    const pose = tf.tensor2d(data.xs, [1, data.xs.length]);
    // call tensorlow.js predict method
    const prediction = model.predict(pose);
    // get an index of top scores from the prediction(along an axis) result, containing 3 values and their probability scores
    const pIndex = tf.argMax(prediction, 1).dataSync();
    // tf.dataSync() downloads the values from the tensor synchronously, while tf.data() downloads the values from the tf.tensor() asynchronously and returns a promise
    const probability = prediction.dataSync()[pIndex];
    // variable to hold the workout class name
    const result = null;

    console.log(pose);
    console.log(prediction) // typeof prediction

    // consider only classifications with probabilities higher than 99%
    if (probability > 0.99) {
        const classNames = ["JUMPING_JACK", "WALL_SIT", "LUNGES"];
        console.log(classNames[pIndex] + ", probability: " + probability);
        result = classNames[pIndex];
    }

    // dispose allocated resources for the variable holding the prediction result
    prediction.dispose();

    return result;
}
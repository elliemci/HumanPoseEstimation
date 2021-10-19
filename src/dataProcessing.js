import * as tf from '@tensorflow/tfjs';


export function processData(rawData) {
    // get the training size data to be 80%
    const training_size = Math.round((rawData.length * 80) / 100);

    /* There are two ways to train TensorFlow.js model: by using the ‘fit’ method or 
       the ‘fitDataset’ method, which offers better performance with streamed data. 
       To be able to use ‘fitDataset’ need to convert data arrays into a TensorFlow.js 
       Dataset object. */

    // Convert the array into tfjs data using TensorFlow.js Dataset API function, shuffling with window of 10 rows
    const rawDatasetShuffled = tf.data.array(rawData).shuffle(10)

    // split the data using tfjs dataset api helper functions take() and skip()
    const rawDatasetTraining = rawDatasetShuffled.take(training_size);
    const rawDatasetValidation = rawDatasetShuffled.skip(training_size);

    // One-hot encoding of the categorical target data, mapping the training and validation datasets
    // Setting the dataset batch size to 30 for feed of 30 records at a time to the training loop
    const convertedDatasetTraining =
        rawDatasetTraining.map(({ xs, ys }) => {
            const labels = [
                /* implicit check for the type of exercises, value of 1, and 0 if not true
                   and converting the target into array 1, 0, 0 = JUMPING_JACKS */
                ys = "JUMPING_JACKS" ? 1 : 0,
                ys = "WALL_SIT" ? 1 : 0,
                ys = "LUNGES" ? 1 : 0
            ]
            return { xs: Object.values(xs), ys: Object.values(labels) };
        }).batch(30)


    const convertedDatasetValidation =
        rawDatasetValidation.map(({ xs, ys }) => {
            const labels = [
                /* implicit check for the type of exercises, value of 1, and 0 if not true
                   and converting the target into array 1, 0, 0 = JUMPING_JACKS */
                ys = "JUMPING_JACKS" ? 1 : 0,
                ys = "WALL_SIT" ? 1 : 0,
                ys = "LUNGES" ? 1 : 0
            ]
            return { xs: Object.values(xs), ys: Object.values(labels) };
        }).batch(30)

    // PoseNet returns 17 keypoints, flatten into 2 values each thus 34 features 
    const numOfFeatures = 34;

    return [numOfFeatures, convertedDatasetTraining, convertedDatasetValidation];


};
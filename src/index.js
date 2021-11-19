import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

//ReactDOM.render(
//  <React.StrictMode>
//    <App />
//  </React.StrictMode>,
//  document.getElementById('root')
//);

ReactDOM.render(<App />, document.getElementById('root'));

// To measure performance in your app, pass a function to log results
// reportWebVitals(console.log))
// or send to an analytics endpoint check out https://bit.ly/CRA-vitals
reportWebVitals();

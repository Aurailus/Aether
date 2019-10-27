import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './app.scss';

import { App } from './components/App';

const mainElement = document.createElement('div');
document.body.appendChild(mainElement);

ReactDOM.render(<App />, mainElement);

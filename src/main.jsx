import React from 'react';
import { createRoot } from 'react-dom/client';

/* Self-hosted variable fonts. Bundled rather than fetched from Google so there
   is no third-party request on first paint, no layout shift while a webfont
   arrives, and nothing for a school network to block. */
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import '@fontsource-variable/inter/wght.css';

import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<App />);

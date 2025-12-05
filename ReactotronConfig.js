// ReactotronConfig.js
import Reactotron from 'reactotron-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const reactotron = Reactotron
  .setAsyncStorageHandler(AsyncStorage)
  .configure({
    name: 'Lyfari',
  })
  .useReactNative({
    networking: {
      ignoreUrls: /symbolicate/, // Don't log React Native internals
    },
  })
  .connect();

// ✅ Intercept ALL network requests (fetch + XMLHttpRequest)
const originalFetch = global.fetch;
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

// Intercept fetch (for API calls)
global.fetch = async (...args) => {
  const [url, options] = args;
  const startTime = Date.now();
  
  Reactotron.display({
    name: '🚀 FETCH REQUEST',
    preview: `${options?.method || 'GET'} ${url}`,
    value: {
      url: url.toString(),
      method: options?.method || 'GET',
      headers: options?.headers,
      body: options?.body,
    },
  });

  try {
    const response = await originalFetch(...args);
    const duration = Date.now() - startTime;
    
    // Clone response to read body
    const clone = response.clone();
    let responseBody;
    try {
      responseBody = await clone.json();
    } catch {
      responseBody = await clone.text();
    }

    Reactotron.display({
      name: '✅ FETCH RESPONSE',
      preview: `${response.status} ${url}`,
      value: {
        url: url.toString(),
        status: response.status,
        duration: `${duration}ms`,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
      },
      important: response.status >= 400,
    });

    return response;
  } catch (error) {
    Reactotron.error({
      name: '❌ FETCH ERROR',
      preview: url.toString(),
      value: error,
    });
    throw error;
  }
};

// ✅ Intercept XMLHttpRequest (for images, media, other resources)
XMLHttpRequest.prototype.open = function(method, url, ...rest) {
  this._method = method;
  this._url = url;
  this._startTime = Date.now();
  
  Reactotron.display({
    name: '📡 XHR REQUEST',
    preview: `${method} ${url}`,
    value: {
      method,
      url: url.toString(),
      type: 'XMLHttpRequest',
    },
  });
  
  return originalXHROpen.call(this, method, url, ...rest);
};

XMLHttpRequest.prototype.send = function(...args) {
  this.addEventListener('load', function() {
    const duration = Date.now() - this._startTime;
    
    Reactotron.display({
      name: '✅ XHR RESPONSE',
      preview: `${this.status} ${this._url}`,
      value: {
        method: this._method,
        url: this._url,
        status: this.status,
        statusText: this.statusText,
        duration: `${duration}ms`,
        responseType: this.responseType,
        contentType: this.getResponseHeader('content-type'),
      },
      important: this.status >= 400,
    });
  });

  this.addEventListener('error', function() {
    Reactotron.error({
      name: '❌ XHR ERROR',
      preview: this._url,
      value: {
        method: this._method,
        url: this._url,
      },
    });
  });

  return originalXHRSend.apply(this, args);
};

console.log('✅ Network interceptors enabled - All requests will be logged');

export default reactotron;

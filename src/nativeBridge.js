    // Attach onNativeEvent to window
    // window.onNativeEvent = function(eventType, data) {
    //     alert("onNativeEvent"+ " " + eventType + " " + data);
    // };
    
    // Optional: signal JS is ready
    window.isNativeBridgeReady = true;
    window._nativeEventQueue = [];
    window._nativeEventQueue.forEach(e => window.onNativeEvent(e.type, e.data));
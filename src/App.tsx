import SearchPage from './screens/SearchPage'

function App() {
  console.log("navigator?.userAgentData", navigator?.userAgentData)
  if (navigator?.userAgentData) {
    const uaData = navigator?.userAgentData;
  
    uaData?.getHighEntropyValues([
      'platform',
      'platformVersion',
      'model',
      'fullVersionList'
    ]).then(data => {
      console.log("JSON.stringify(data)", JSON.stringify(data))
      window.alert(JSON.stringify(data))
    });
  }
  return (<SearchPage />)
}

export default App

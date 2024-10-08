import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
// import { eitherTest } from 'tests/either-test';
import { eitherTaskTest } from 'tests/either-task-test';

function App() {
  const handleClick = () => {
    // eitherTest();
    eitherTaskTest();
  };

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <button onClick={handleClick}>Run Test</button>
    </>
  );
}

export default App;

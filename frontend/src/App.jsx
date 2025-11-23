import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TrainingPlan from './components/TrainingPlan';
import ExerciseDetail from './components/ExerciseDetail';
import Layout from './components/Layout';
import WelcomeScreen from './components/WelcomeScreen';
import './App.css';

function App() {
  const [showWelcome, setShowWelcome] = useState(false); // Disabled for development

  return (
    <Router>
      <div className="App">
        {showWelcome && <WelcomeScreen onComplete={() => setShowWelcome(false)} />}
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<TrainingPlan />} />
            <Route path="/exercise/:id" element={<ExerciseDetail />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;

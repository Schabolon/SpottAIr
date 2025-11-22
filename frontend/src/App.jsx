import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TrainingPlan from './components/TrainingPlan';
import ExerciseDetail from './components/ExerciseDetail';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<TrainingPlan />} />
          <Route path="/exercise/:id" element={<ExerciseDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

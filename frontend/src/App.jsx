import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TrainingPlan from './components/TrainingPlan';
import ExerciseDetail from './components/ExerciseDetail';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
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

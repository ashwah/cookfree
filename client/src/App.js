// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CookingMethods from './pages/CookingMethods';
import ShoppingList from './pages/ShoppingList';
import SearchForm from './pages/SearchForm';
import ProjectInfo from './pages/ProjectInfo';

const App = () => {
  
  return (
    <div>
      <h1>App</h1>
      <Router>
        <div>
          <nav>
            <ul>
              <li>
                <Link to="/">Search</Link>
              </li>
              <li>
                <Link to="/project-info">Project info</Link>
              </li>
            </ul>
          </nav>

          <Routes>
            <Route path="/" element={<SearchForm />} />
            <Route path="/project-info" element={<ProjectInfo />} />
            <Route path="/:uuid/cook" element={<CookingMethods />} />
            <Route path="/:uuid/shopping-list" element={<ShoppingList />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
};

export default App;

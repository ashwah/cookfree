import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SearchForm = () => {
  const [searchString, setSearchString] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentRecipes, setRecentRecipes] = useState([]);
  const navigate = useNavigate();

  const host = process.env.REACT_APP_HOST;
  const node_port = process.env.REACT_APP_NODE_PORT;

  useEffect(() => {
    // Fetch recent recipes when the component mounts
    const fetchRecentRecipes = async () => {
      try {
        const response = await axios.get(`http://${host}:${node_port}/recent-recipes`);
        setRecentRecipes(response.data);
      } catch (error) {
        console.error('Error fetching recent recipes:', error.message);
      }
    };

    fetchRecentRecipes();
  }, []); // Empty dependency array to fetch data only once on mount

  const handleSearch = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);

      // Make API call to generate UUID
      const response = await axios.post(`http://${host}:${node_port}/generate-uuid`, { searchString });

      const { uuid } = response.data;

      navigate({
        pathname: `/${uuid}/shopping-list`,
      });
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Recipe Search</h2>
      <form onSubmit={handleSearch}>
        <label htmlFor="recipeSearch">What would you like to make today?</label>
        <input
          type="text"
          id="recipeSearch"
          value={searchString}
          onChange={(e) => setSearchString(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          Search
        </button>

        {loading && <p>Generating your tailored recipe...</p>}

        {/* Display recent recipes as links */}
        <div>
          <h3>Recent Recipes:</h3>
          <ul>
            {recentRecipes.map((recipe) => (
              <li key={recipe.fileName}>
                <a href={`/${recipe.fileName.split('.')[0]}/shopping-list`}>{recipe.recipeName}</a>
              </li>
            ))}
          </ul>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;

// SearchForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SearchForm = () => {
  const [searchString, setSearchString] = useState('');
  const navigate = useNavigate();

  const host = process.env.REACT_APP_HOST;
  const node_port = process.env.REACT_APP_NODE_PORT;

  const handleSearch = async (event) => {
    event.preventDefault();

    try {
      // Make API call to generate UUID
      const response = await axios.post(`http://${host}:${node_port}/generate-uuid`, { searchString });

      // Extract UUID from the response
      const { uuid } = response.data;

      // Redirect to the shopping list page with the UUID
      navigate({
        pathname: `/${uuid}/shopping-list`,
      });
    } catch (error) {
      console.error('Error:', error.message);
      // Handle error if necessary
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
        />
        <button type="submit">Search</button>
      </form>
    </div>
  );
};

export default SearchForm;

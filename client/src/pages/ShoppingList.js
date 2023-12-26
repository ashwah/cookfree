// ShoppingList.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';


const ShoppingList = () => {
  const [recipe, setRecipe] = useState(null);
  const { uuid } = useParams();

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/recipes/${uuid}`);
        setRecipe(response.data);
      } catch (error) {
        console.error('Error fetching recipe:', error.message);
      }
    };

    fetchRecipe();
  }, [uuid]);

  if (!recipe) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Shopping List for {recipe.recipe}</h1>
      <h2>Ingredients</h2>
      <ul>
        {recipe.ingredients.map((ingredient, index) => (
          <li key={index}>
            {`${ingredient.quantity} ${ingredient.unit} of ${ingredient.ingredient}`}
            {ingredient.notes && ` (${ingredient.notes})`}
          </li>
        ))}
      </ul>
      <h2>Equipment</h2>
      <ul>
        {recipe.equipment.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <Link to={`/${uuid}/cook`}>
        <button>Get cooking!</button>
      </Link>
    </div>
  );
};

export default ShoppingList;

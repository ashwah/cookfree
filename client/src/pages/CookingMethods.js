// CookingMethods.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const CookingMethods = ({ match }) => {
  const [recipe, setRecipe] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const { uuid } = useParams();

  const host = process.env.REACT_APP_HOST;
  const node_port = process.env.REACT_APP_NODE_PORT;

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await axios.get(`http://${host}:${node_port}/recipes/${uuid}`);
        setRecipe(response.data);
      } catch (error) {
        console.error('Error fetching recipe:', error.message);
      }
    };

    fetchRecipe();
  }, [uuid]);

  const goToNextStep = () => {
    setCurrentStep((prevStep) => Math.min(prevStep + 1, recipe.steps.length - 1));
  };

  const goToPreviousStep = () => {
    setCurrentStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  if (!recipe) {
    return <div>Loading...</div>;
  }

  const currentStepData = recipe.steps[currentStep];

  return (
    <div>
      <h1>Cooking Methods for {recipe.recipe}</h1>
      <div>
        <h2>Step {currentStep + 1}</h2>
        <p><strong>Action:</strong> {currentStepData.action}</p>
        <p><strong>Description:</strong> {currentStepData.description}</p>
        <p><strong>Inputs:</strong> {currentStepData.inputs.join(', ')}</p>
        <p><strong>Output:</strong> {currentStepData.output.join(', ')}</p>
        <p><strong>Container:</strong> {currentStepData.container}</p>
      </div>
      <div>
        <button onClick={goToPreviousStep} disabled={currentStep === 0}>
          Previous
        </button>
        <button onClick={goToNextStep} disabled={currentStep === recipe.steps.length - 1}>
          Next
        </button>
      </div>
      <div>
        <Link to={`/${uuid}/shopping-list`}>
          <button>Go to Ingredients</button>
        </Link>
      </div>
    </div>
  );
};

export default CookingMethods;
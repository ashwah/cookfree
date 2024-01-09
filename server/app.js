// server/app.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

const apiKey = process.env.OPENAI_API_KEY;

// Function to read a recipe file and parse JSON
const readRecipeFile = async (fileName) => {
  const filePath = path.join(__dirname, 'recipes', fileName);
  try {
    const recipeData = await fs.readFile(filePath, 'utf8');
    return JSON.parse(recipeData);
  } catch (error) {
    throw error;
  }
};

// Function to get the name of a recipe from its JSON structure
const getRecipeName = (recipe) => {
  return recipe && recipe.recipe ? recipe.recipe : 'Unnamed Recipe';
};

// Middleware to append recipe request to the prompt
const appendRecipeRequest = async (req, res, next) => {
  try {
    const promptFilePath = path.join(__dirname, 'prompt.txt');
    let prompt = await fs.readFile(promptFilePath, 'utf8');
    prompt += ` Noting all the above, give a JSON representation for ${req.body.searchString}`;
    req.prompt = prompt;
    next();
  } catch (error) {
    console.error('Error reading prompt file:', error.message);
    res.status(500).json({ error: 'Error reading prompt file' });
  }
};

// Route to generate a UUID and save the associated recipe.
app.post('/generate-uuid', appendRecipeRequest, async (req, res) => {
  try {
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo-1106',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: req.prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const jsonResponse = openaiResponse.data.choices[0].message.content;
    const startIndex = jsonResponse.indexOf('```json');
    const endIndex = jsonResponse.indexOf('```', startIndex + 1);

    if (startIndex !== -1 && endIndex !== -1) {
      const jsonString = jsonResponse.substring(startIndex + 7, endIndex).trim();
      const uuid = uuidv4();
      const fileName = path.join(__dirname, 'recipes', `recipe_${uuid}.json`);
      await fs.writeFile(fileName, jsonString);
      res.json({ uuid });
    } else {
      console.log('No JSON found in the input string.');
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route to retrieve a recipe by UUID.
app.get('/recipes/:uuid', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const filePath = path.join(__dirname, 'recipes', `recipe_${uuid}.json`);
    
    try {
      await fs.access(filePath);
    } catch (error) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    const recipeData = await fs.readFile(filePath, 'utf8');
    const parsedRecipe = JSON.parse(recipeData);

    res.json(parsedRecipe);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route to retrieve the 25 most recent recipes.
app.get('/recent-recipes', async (req, res) => {
  try {
    const recipesFolder = path.join(__dirname, 'recipes');
    const files = await fs.readdir(recipesFolder);
    
    const sortedFiles = (await Promise.all(
      files.map(async (fileName) => {
        const stat = await fs.stat(path.join(recipesFolder, fileName));
        return { fileName, mtime: stat.mtimeMs };
      })
    )).sort((a, b) => b.mtime - a.mtime).slice(0, 25);

    const recentRecipes = await Promise.all(
      sortedFiles.map(async ({ fileName }) => {
        try {
          const recipe = await readRecipeFile(fileName);

          if (recipe === null) {
            throw new Error('Invalid recipe');
          }

          return {
            fileName,
            recipeName: getRecipeName(recipe),
          };
        } catch (error) {
          console.error(`Error processing file ${fileName}: ${error.message}`);
          return null;
        }
      })
    );

    res.json(recentRecipes.filter(recipe => recipe !== null));
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Server initialization.
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
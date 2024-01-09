const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 3001;
const path  = require('path');
require('dotenv').config();

app.use(cors());
app.use(bodyParser.json());

// OpenAI API key
const apiKey = process.env.OPENAI_API_KEY;

app.post('/generate-uuid', async (req, res) => {
  try {
    const { searchString } = req.body;

    // Load the entire contents of the "prompt.txt" file
    const promptFilePath = 'server/prompt.txt';
    
    let prompt;
    try {
      prompt = await fs.promises.readFile(promptFilePath, 'utf8');
      
      // Add a request for a specific recipe to the prompt.
      prompt += ' Noting all the above, give a JSON representation for ' + searchString;
      console.log(prompt);
    } catch (readError) {
      console.error('Error reading prompt file:', readError.message);
      throw new Error('Error reading prompt file');
    }
    
    // Call OpenAI Chat Completion API with the correct URL
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo-1106",
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract JSON from OpenAI API response
    const jsonResponse = openaiResponse.data.choices[0].message.content;
    console.log(jsonResponse);
    
    // Find the index of "```json" and "```"
    const startIndex = jsonResponse.indexOf('```json');
    const endIndex = jsonResponse.indexOf('```', startIndex + 1);

    // Check if both "```json" and "```" are found
    if (startIndex !== -1 && endIndex !== -1) {
      // Extract the JSON content between "```json" and "```"
      const jsonString = jsonResponse.substring(startIndex + 7, endIndex).trim();
      
      try {
        // Generate a UUID
        const uuid = uuidv4();
    
        // Write JSON to a file in the /recipes folder
        const fileName = `./server/recipes/recipe_${uuid}.json`;
        fs.promises.writeFile(fileName, jsonString);
        
        // Respond with the generated UUID
        res.json({ uuid });
      } catch (error) {
        console.error('Error parsing JSON:', error.message);
      }
    } else {
      console.log('No JSON found in the input string.');
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Serve JSON recipe file for a given UUID
app.get('/recipes/:uuid', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const filePath = path.join(__dirname, 'recipes', `recipe_${uuid}.json`);
    console.log(filePath);

    // Check if the file exists
    try {
      await fs.promises.access(filePath);
      console.log(filePath);
    } catch (error) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    // Read and send the JSON file
    const recipeData = await fs.promises.readFile(filePath, 'utf8');
    const parsedRecipe = JSON.parse(recipeData);

    res.json(parsedRecipe);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});  

// Function to read a recipe file and parse JSON
const readRecipeFile = async (fileName) => {
  const filePath = path.join(__dirname, 'recipes', fileName);
  try {
    const recipeData = await fs.readFileSync(filePath, 'utf8');
    return JSON.parse(recipeData);
  } catch (error) {
    // console.error('Error reading or parsing file:', error.message);
    // You can choose to handle the error or rethrow it
    throw error;
  }
};

// Function to get the name of a recipe from its JSON structure
const getRecipeName = (recipe) => {
  return recipe && recipe.recipe ? recipe.recipe : 'Unnamed Recipe';
};

// Endpoint to get the 25 most recent recipes
app.get('/recent-recipes', async (req, res) => {
  try {
    const recipesFolder = path.join(__dirname, 'recipes');

    // Read all files in the recipes folder
    const files = await fs.promises.readdir(recipesFolder);

    console.log("/n");
    console.log(files);
    // Sort files by modification time in descending order
    const sortedFiles = (await Promise.all(
      files.map(async (fileName) => {
        const stat = await fs.promises.stat(path.join(recipesFolder, fileName));
        console.log("filename: " + fileName);
        return { fileName, mtime: stat.mtimeMs };
      })
    )).sort((a, b) => b.mtime - a.mtime).slice(0, 25);
    console.log("got files ");

    // Read and parse each of the 25 most recent recipes
    const recentRecipes = await Promise.all(
      sortedFiles.map(async ({ fileName }) => {
        try {
          const recipe = await readRecipeFile(fileName);
    
          // Check if the recipe is non-null
          if (recipe === null) {
            throw new Error('Invalid recipe');
          }
    
          return {
            fileName,
            recipeName: getRecipeName(recipe),
          };
        } catch (error) {
          // Handle the error (invalid recipe)
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

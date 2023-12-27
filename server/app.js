const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
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
    
    // Use fs.promises.readFile instead of fs.readFileSync
    let prompt;
    try {
      prompt = await fs.readFile(promptFilePath, 'utf8');
      
      // Add a request for a specific recipe to the prompt.
      prompt += ' Finally, give me the full recipe JSON for a  ' + searchString;
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

    // Find the index of "```json" and "```"
    const startIndex = jsonResponse.indexOf('```json');
    const endIndex = jsonResponse.indexOf('```', startIndex + 1);

    // Check if both "```json" and "```" are found
    if (startIndex !== -1 && endIndex !== -1) {
      // Extract the JSON content between "```json" and "```"
      const jsonString = jsonResponse.substring(startIndex + 7, endIndex).trim();
      
      // console.log(jsonString);
      // const type = typeof jsonString;
      // console.log('Type:', type);

      try {
        // Generate a UUID
        const uuid = uuidv4();
    
        // Write JSON to a file in the /recipes folder
        const fileName = `./server/recipes/recipe_${uuid}.json`;
        fs.writeFile(fileName, jsonString);
        
        // Respond with the generated UUID
        res.json({ uuid });

        // console.log('Parsed JSON:', parsedJson);
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

    // Check if the file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    // Read and send the JSON file
    const recipeData = await fs.readFile(filePath, 'utf8');
    const parsedRecipe = JSON.parse(recipeData);

    res.json(parsedRecipe);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});  


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// chatGptApi.js
const axios = require('axios');
const fs = require('fs');
const TTS = require('../modules/aws-voice.js'); // Adjust the path if necessary
// const { conversationDefaults } = require('./chatDefaults.js');
const { conversationDefaults } = require('./chatDefaults.js');

// Replace 'YOUR_OPENAI_API_KEY' with your actual OpenAI API key
const OPENAI_API_KEY = 'sk-proj-ZP5CvxCBETfm6Y0oFFCET3BlbkFJqsWqH287MQxD4GL76auy';
let conversationHistory = []; 
/**
 * Generates a chat response using the OpenAI GPT-3 API.
 * @param {string} userInput - User input for the chat.
 * @returns {Promise<string>} - Promise resolving to the generated chat response.
 */
async function generateChatResponse(userInput) {
  try {
   




    const updatedMessages = [
      ...conversationDefaults.initialMessages,
      { role: 'user', content: userInput },
    ];

    // Load the conversation history from the file
    const conversationHistory = require('../conversation_history.json');

    // Combine the initial messages with the loaded conversation history
    let finalUpdatedMessages = [
      ...updatedMessages,
      ...conversationHistory
    ];

    // Append the user input to the conversation history
    appendToConversationHistory(userInput, 'user', function() {
      // Load the updated conversation history from the file again
      // const updatedConversationHistory = require('../conversation_history.json');
      
      // Combine the initial messages with the newly loaded conversation history
      finalUpdatedMessages = [
        ...conversationDefaults.initialMessages,
        { role: 'user', content:"#start " + userInput+" #end" },
        ...conversationHistory
      ];
    
      // Update finalUpdatedMessages after the append operation completes
      // const lastUserMessageIndex = finalUpdatedMessages.length - 1;
      // if (finalUpdatedMessages[lastUserMessageIndex].role === 'user') {
      //   finalUpdatedMessages[lastUserMessageIndex].content += ' #response_needed';
      // }
   console.log(finalUpdatedMessages);
      // Now, proceed with generating the chat response
     generateChatResponseHelper(finalUpdatedMessages);
    });

    
  } catch (error) {
    console.error('Error generating chat response:', error.message);
    throw error;
  }
}

async function generateChatResponseHelper(finalUpdatedMessages) {
  try {
    const requestData = {
      model: conversationDefaults.model,
      messages: finalUpdatedMessages,
    };

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const chatContent = response.data.choices[0].message.content;
    if (chatContent.trim()) {
      TTS(chatContent);
    }

    return chatContent;
  } catch (error) {
    console.error('Error generating chat response:', error.message);
    throw error;
  }
}

// Function to append new chat content to conversation history
function appendToConversationHistory(newContent, role, callback) {
  let conversationHistory = [];

  // Read existing conversation history if the file exists
  if (fs.existsSync('conversation_history.json')) {
    const data = fs.readFileSync('conversation_history.json');
    conversationHistory = JSON.parse(data);
  }

  // Append new content to conversation history
  conversationHistory.push({ role: role, content: newContent });

  // Write updated conversation history back to the file
  fs.writeFileSync('conversation_history.json', JSON.stringify(conversationHistory, null, 2));

  // Call the callback to indicate that the operation is complete
  callback();
}

module.exports = { generateChatResponse };

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const TTS = require('../modules/aws-voice.js'); // Adjust the path if necessary
const { conversationDefaults } = require('./chatDefaults.js');

// Replace 'YOUR_OPENAI_API_KEY' with your actual OpenAI API key
const OPENAI_API_KEY = 'sk-proj-ZP5CvxCBETfm6Y0oFFCET3BlbkFJqsWqH287MQxD4GL76auy';

/**
 * Generates a chat response using the OpenAI GPT-3 API.
 * @param {string} userInput - User input for the chat.
 * @returns {Promise<string>} - Promise resolving to the generated chat response.
 */
async function generateChatResponse(userInput) {
  try {
    // Load the conversation history from the file
    const conversationHistory = loadConversationHistory();
    const loadLastBotMessageText = loadLastBotMessage(); // Correctly name the variable

    const updatedMessages = [
      ...conversationDefaults.initialMessages,
      { role: 'user', content: userInput },
      ...conversationHistory
    ];

    // Append the user input to the conversation history and then generate the chat response
    appendToConversationHistory(userInput, 'user', () => {
      // Reload the updated conversation history from the file
      const updatedConversationHistory = loadConversationHistory();
      const loadLastBotMessageText = loadLastBotMessage(); // Call the function here correctly
      const finalUpdatedMessages = [
        ...conversationDefaults.initialMessages,
        { role: 'user', content: "#start " + userInput + " #end" },
        { role: 'assistant', content: "#start_last_bot_message " + loadLastBotMessageText[0]?.content + " #end_last_bot_message" }, // Access the message content correctly
        ...updatedConversationHistory
      ];

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

    const lastContent = [
      {
        "role": "assistant",
        "content": chatContent
      }
    ];

    fs.writeFileSync('last_message_bot.json', JSON.stringify(lastContent, null, 2));
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
  // Read existing conversation history if the file exists
  const conversationHistory = loadConversationHistory();

  // Append new content to conversation history
  conversationHistory.push({ role: role, content: newContent });

  // Write updated conversation history back to the file
  fs.writeFileSync('conversation_history.json', JSON.stringify(conversationHistory, null, 2));

  // Call the callback to indicate that the operation is complete
  callback();
}

// Function to load the conversation history from the file
function loadConversationHistory() {
  const conversationHistoryPath = path.join(__dirname, '../conversation_history.json');
  if (fs.existsSync(conversationHistoryPath)) {
    const data = fs.readFileSync(conversationHistoryPath);
    return JSON.parse(data);
  }
  return [];
}

// Function to load the last bot message from the file
function loadLastBotMessage() {
  const LastMessageBotPath = path.join(__dirname, '../last_message_bot.json');
  if (fs.existsSync(LastMessageBotPath)) {
    const data = fs.readFileSync(LastMessageBotPath);
    return JSON.parse(data);
  }
  return [];
}

module.exports = { generateChatResponse };

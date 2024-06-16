const fs = require('fs');
const path = require('path');

// Path to the conversation history file
const conversationHistoryPath = path.join(__dirname, '../conversation_history.json');

// Function to clear the conversation history
function clearConversationHistory() {
  fs.writeFileSync(conversationHistoryPath, JSON.stringify([]));
  console.log('Conversation history cleared.');
}

// Handle different voice commands
function handleVoiceCommand(command) {
  switch (command.trim().toLowerCase()) {
    case 'reset':
      clearConversationHistory();
      return true;
    // Add more cases for different commands as needed
    default:
      console.log(`Unknown command: ${command}`);
      return false;
  }
}

module.exports = {
  handleVoiceCommand
};

const { spawn } = require('child_process');
const speech = require('@google-cloud/speech');
const path = require('path');
const { handleVoiceCommand } = require('./voiceCommands'); // Import the command handler

// Import the TTS module

const GPT = require('../utils/chatGptApi'); // Adjust the path if necessary


// Create a client for Google Cloud Speech-to-Text
const client = new speech.SpeechClient();

const request = {
  config: {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  },
  interimResults: false,
};

// Variable to store the converted text
let convertedText = '';

// Create a recognize stream
const recognizeStream = client
  .streamingRecognize(request)
  .on('error', (error) => {
    console.error('Error during API call:', error);
  })
  .on('data', (data) => {
    if (data.results[0] && data.results[0].alternatives[0]) {
      const transcription = data.results[0].alternatives[0].transcript;
      console.log(`Transcription: ${transcription}`);
      // Append the transcription to the converted text
      convertedText += transcription + ' ';
      lastUpdateTime = Date.now(); // Update the last update time on new transcription
    } else {
      console.log('Reached transcription time limit, press Ctrl+C');
    }
  })
  .on('end', () => {
    // Log the converted text when the stream ends
    console.log('Converted text:', convertedText);
  });

// Start recording using arecord and pipe the output to the Speech API
const arecord = spawn('arecord', ['-f', 'S16_LE', '-r', '16000', '-c', '1', '-t', 'raw', '-q', '-']);
arecord.stdout.pipe(recognizeStream);

console.log('Listening, press Ctrl+C to stop.');

// Handle Ctrl+C to stop the recording and perform any final actions
process.on('SIGINT', () => {
  console.log('Stopping recording...');
  arecord.kill('SIGINT'); // Stop arecord process
  recognizeStream.end(); // End the recognize stream
  process.exit(); // Exit the process
});

// Check if no transcription is updated for 4 seconds and call TTS function
let lastUpdateTime = Date.now();
recognizeStream.on('data', () => {
  lastUpdateTime = Date.now();
});

setInterval(() => {
  if (Date.now() - lastUpdateTime > 3000 && convertedText.trim()) {
    console.log('Converted text unchanged for 3 seconds. Calling TTS.');

   // Handle the voice command
   const commandHandled = handleVoiceCommand(convertedText);

   // If no command was handled, call TTS
   if (!commandHandled) {
     GPT.generateChatResponse(convertedText);
   }
    convertedText = ''; // Clear convertedText after calling TTS
  }
}, 1000);
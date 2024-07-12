const { spawn } = require('child_process');
const speech = require('@google-cloud/speech');
const { handleVoiceCommand } = require('./voiceCommands'); // Import the command handler
const GPT = require('../utils/chatGptApi'); // Import the TTS module

class VoiceRecognition {
  constructor() {
    this.client = new speech.SpeechClient();
    this.request = {
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
      },
      interimResults: false,
    };
    this.recognizeStream = null;
    this.convertedText = '';
    this.lastUpdateTime = Date.now();
    this.commandQueue = []; // Queue to hold commands
    this.isStoppingRecognition = false; // Add the flag here
  }

  startRecognition() {
    if (this.recognizeStream) {
      console.log('Recognition already started.');
      return;
    }

    this.checkAndUpdateLastUpdateTime();
    this.recognizeStream = this.client
      .streamingRecognize(this.request)
      .on('error', (error) => {
        console.error('Error during API call:', error);
      })
      .on('data', (data) => {
        if (data.results[0] && data.results[0].alternatives[0]) {
          const transcription = data.results[0].alternatives[0].transcript;

          console.log(`Transcription: ${transcription}`);
          this.convertedText += transcription + ' ';
          this.lastUpdateTime = Date.now();
        } else {
          console.log('Reached transcription time limit, press Ctrl+C');
        }
      })
      .on('end', () => {
        console.log('Recognition stream ended.');
        this.isStoppingRecognition = false; // Reset the flag when stream ends
        this.processCommandQueue(); // Process any queued commands
      });

    const arecord = spawn('arecord', ['-f', 'S16_LE', '-r', '16000', '-c', '1', '-t', 'raw', '-q', '-']);
    arecord.stdout.pipe(this.recognizeStream);

    console.log('Listening, press Ctrl+C to stop.');
  }

  stopRecognition() {
    if (this.isStoppingRecognition) {
      console.log('Recognition stop already in progress.');
      return;
    }

    if (this.recognizeStream) {
      this.isStoppingRecognition = true; // Set the flag here
      this.recognizeStream.end();
      this.recognizeStream = null; // Ensure recognizeStream is reset
      console.log('Recognition stream stopped.');
    } else {
      console.log('No recognition stream to stop.');
      this.isStoppingRecognition = false; // Reset the flag if no stream to stop
      this.processCommandQueue(); // Process any queued commands
    }
  }

  handleVoiceCommand() {
    if (this.convertedText.trim()) {
      console.log('Calling handleVoiceCommand...');
      const commandHandled = handleVoiceCommand(this.convertedText);
      if (!commandHandled) {
        console.log('No command handled. Calling TTS...');
        GPT.generateChatResponse(this.convertedText);
      }
      this.convertedText = '';
    } else {
      console.log('No converted text to handle.');
    }
  }

  processCommandQueue() {
    while (this.commandQueue.length > 0) {
      const command = this.commandQueue.shift();
      command();
    }
  }

  checkAndUpdateLastUpdateTime() {
    setInterval(() => {
      if (Date.now() - this.lastUpdateTime > 3000 && this.convertedText.trim()) {
        console.log('Converted text unchanged for 3 seconds. Handling voice command...');
        this.commandQueue.push(() => this.handleVoiceCommand()); // Queue the command
        this.stopRecognition(); // Use the existing instance to stop recognition
      }
    }, 1000);
  }
}

module.exports = VoiceRecognition;

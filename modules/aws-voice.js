const { Polly } = require('@aws-sdk/client-polly');
const fs = require('fs/promises');


const path = require('path');
const player = require('play-sound')(); // Include the play-sound module

// Configure AWS Polly client
const polly = new Polly({
  region: 'ap-southeast-2',
  credentials: {
    accessKeyId: 'AKIA2UC3F4BJA4TRAZMO',
    secretAccessKey: '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',
  }
});

async function TTS(inputText) {
  console.log(inputText);
  const params = {
    Text: inputText,
    OutputFormat: 'mp3',
    VoiceId: 'Kevin', // Choose a voice that sounds like a young boy and is available in Polly
    Engine: 'neural', // Specify the engine, either 'standard' or 'neural'
  };

  try {
    const data = await polly.synthesizeSpeech(params);

    // Write audio stream to file
    await fs.writeFile('./output.mp3', data.AudioStream);

    console.log('The file was saved!');

    const _output = path.resolve('./output.mp3');
    player.play(_output, function (err) {
      if (err) {
        console.log(`Could not play sound: ${err}`);
      } else {
        console.log('Sound finished playing. Starting recognition again.');
        const VoiceRecognition = require('./speech'); // Import the VoiceRecognition class

        // Create an instance of the VoiceRecognition class
        const voiceRecognition = new VoiceRecognition();
        
        // Start recognition
        voiceRecognition.startRecognition();
      }
    });
  } catch (err) {
    console.error(err);
  }
}

module.exports = TTS;

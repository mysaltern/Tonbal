const fs = require('fs');
const OpenAI = require('openai');
const path = require('path');
const player = require('play-sound')(); // Include the play-sound module

const openai = new OpenAI({
  apiKey: 'sk-proj-ZP5CvxCBETfm6Y0oFFCET3BlbkFJqsWqH287MQxD4GL76auy', // Replace with your OpenAI API key
});

const _output = path.resolve('./output2.mp3');

// Function to perform Text-to-Speech and play the sound
async function TTS(inputText) {
  try {
    console.log('Speech synthesis initializing.');
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'onyx',
      input: inputText,
    });

    if (fs.existsSync(_output)) {
      fs.unlinkSync(_output);
    }

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(_output, buffer);
    console.log('Speech synthesis complete.');

    // Play the sound
    player.play(_output, function (err) {
      if (err) console.log(`Could not play sound: ${err}`);
    });
  } catch (error) {
    console.log('Speech synthesis failed.');
    console.error(error);
  }
}

module.exports = TTS;

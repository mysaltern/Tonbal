process.env.GOOGLE_APPLICATION_CREDENTIALS = "./lifemate-417104-5532f4b96dd4.json";
const VoiceRecognition = require('./modules/speech');


// Create an instance of the VoiceRecognition class
const voiceRecognition = new VoiceRecognition();

// Start recognition
voiceRecognition.startRecognition();
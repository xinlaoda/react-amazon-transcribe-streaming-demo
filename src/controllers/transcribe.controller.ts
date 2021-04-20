import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
  StartStreamTranscriptionCommandOutput,
} from '@aws-sdk/client-transcribe-streaming';
import { 
    TranslateClient, 
    TranslateTextCommand,
    TranslateTextCommandOutput,
} from '@aws-sdk/client-translate';
import {
    PollyClient,
} from '@aws-sdk/client-polly';
import { getSynthesizeSpeechUrl } from '@aws-sdk/polly-request-presigner';
import MicrophoneStream from 'microphone-stream';
import { PassThrough } from 'stream';
import { EventEmitter } from 'events';

import transcribeConstants from '../constants/transcribe.constants';
import { streamAsyncIterator } from '../utils/helpers';
import logger from '../utils/logger';
import EncodePcmStream from './streams/EncodePcmStream';

class TranscribeController extends EventEmitter {
  private audioStream: MicrophoneStream | null;

  private rawMediaStream: MediaStream | null;

  private audioPayloadStream: PassThrough | null;

  private transcribeConfig?: typeof transcribeConstants;

  private client?: TranscribeStreamingClient;

  private started: boolean;

  private clientTranslate?: TranslateClient;

  private clientPolly?: PollyClient;

  constructor() {
    super();

    this.audioStream = null;
    this.rawMediaStream = null;
    this.audioPayloadStream = null;
    this.started = false;
  }

  hasConfig() {
    return !!this.transcribeConfig;
  }

  setConfig(transcribeConfig: typeof transcribeConstants) {
    this.transcribeConfig = transcribeConfig;
  }

  validateConfig() {
    if (
      !this.transcribeConfig?.accessKey ||
      !this.transcribeConfig.secretAccessKey
    ) {
      throw new Error(
        'missing required config: access key and secret access key are required',
      );
    }
  }

  async init() {
    this.started = true;
    if (!this.transcribeConfig) {
      throw new Error('transcribe config is not set');
    }

    logger.info('transcribe config', this.transcribeConfig);
    this.validateConfig();

    // setting up microphone stream
    logger.info('setting up microphone stream');
    this.audioStream = new MicrophoneStream();

    this.rawMediaStream = await window.navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
        sampleRate: this.transcribeConfig.sampleRate,
      },
    });
    await this.audioStream.setStream(this.rawMediaStream);

    // create and pipe the streams
    logger.info('setting up streams');
    this.audioPayloadStream = this.audioStream
      .pipe(new EncodePcmStream())
      .pipe(new PassThrough({ highWaterMark: 1 * 1024 }));

    // creating and setting up transcribe client
    const config = {
      region: this.transcribeConfig.region,
      credentials: {
        accessKeyId: this.transcribeConfig.accessKey,
        secretAccessKey: this.transcribeConfig.secretAccessKey,
      },
    };
    logger.info('setting up transcribe client with config', config);
    this.client = new TranscribeStreamingClient(config);

    const command = new StartStreamTranscriptionCommand({
      // The language code for the input audio. Valid values are en-GB, en-US, es-US, fr-CA, and fr-FR
      LanguageCode: this.transcribeConfig.language,
      // The encoding used for the input audio. The only valid value is pcm.
      MediaEncoding: 'pcm',
      // The sample rate of the input audio in Hertz. We suggest that you use 8000 Hz for low-quality audio and 16000 Hz for
      // high-quality audio. The sample rate must match the sample rate in the audio file.
      MediaSampleRateHertz: this.transcribeConfig.sampleRate,
      AudioStream: this.audioGenerator.bind(this)(),
    });

    const response = await this.client.send(command);
    this.onStart(response);
  }

  async onStart(response: StartStreamTranscriptionCommandOutput) {
    logger.info('recognition started', response);

    if (response.TranscriptResultStream) {
      for await (const event of response.TranscriptResultStream) {
        // Get multiple possible results
        const results = event.TranscriptEvent?.Transcript?.Results;
        // Print all the possible transcripts
        if (results && results.length > 0) {
          const [result] = results;
          const final = !result.IsPartial;
          const alternatives = result.Alternatives;

          if (alternatives && alternatives.length > 0) {
            const [alternative] = alternatives;
            const text = alternative.Transcript;

            this.emit('recognized', { text, final });
          }
        }
      }
    }
  }

  async stop() {
    this.started = false;

    // request to stop recognition
    this.audioStream?.stop();
    this.audioStream = null;
    this.rawMediaStream = null;

    this.audioPayloadStream?.removeAllListeners();
    this.audioPayloadStream?.destroy();
    this.audioPayloadStream = null;

    this.client?.destroy();
    this.client = undefined;
  }

  async *audioGenerator() {
    if (!this.audioPayloadStream) {
      throw new Error('payload stream not created');
    }

    for await (const chunk of streamAsyncIterator(this.audioPayloadStream)) {
      if (this.started) {
        yield { AudioEvent: { AudioChunk: chunk } };
      } else {
        break;
      }
    }
  }

  async translate(text: string[]) {
    logger.info('translate started ...', text);
    const willTranslate = text.join(' ');
    logger.info('translate : ', willTranslate);

    if (!this.transcribeConfig) {
      throw new Error('translate config is not set');
    }

    // setup TranslateClient
    // creating and setting up transcribe client
    const config = {
        region: this.transcribeConfig.region,
        credentials: {
            accessKeyId: this.transcribeConfig.accessKey,
            secretAccessKey: this.transcribeConfig.secretAccessKey,
        },
    };
    logger.info('setting up translate client with config', config);
    this.clientTranslate = new TranslateClient(config);

    const params = {
        SourceLanguageCode: 'auto',
        TargetLanguageCode: 'en',
        Text: willTranslate,
        TerminologyNames: [],
    };
    const command = new TranslateTextCommand(params);

    const response = await this.clientTranslate.send(command);
    this.onTranslate(response);

  }

  async onTranslate(reponse: TranslateTextCommandOutput) {
      if (reponse.TranslatedText) {
        this.emit('translated', reponse.TranslatedText);
      }
    
  }

  async polly_voice(text: string) {
      logger.info('Start Polly ...');

        if (!this.transcribeConfig) {
        throw new Error('translate config is not set');
        }

        // setup TranslateClient
        // creating and setting up transcribe client
        const config = {
            region: this.transcribeConfig.region,
            credentials: {
                accessKeyId: this.transcribeConfig.accessKey,
                secretAccessKey: this.transcribeConfig.secretAccessKey,
            },
        };
        logger.info('setup polly configure.');
        this.clientPolly = new PollyClient(config);

        const synthesizeSpeechParams = {
            Engine: 'neural',
            OutputFormat: 'mp3',
            Text: text,
            VoiceId: 'Kevin',
        };
        const audioURL = await getSynthesizeSpeechUrl({
            client: this.clientPolly,
            params: synthesizeSpeechParams,
        });
        logger.info('polly audio url', audioURL);

        this.emit('pollyed', audioURL);

  }  
 

}

export default TranscribeController;

import React, { useEffect, useMemo, useState } from 'react';
import Button from './helpers/Button';
import TextBox from './helpers/TextBox';

import TranscribeController from '../../controllers/transcribe.controller';
import logger from '../../utils/logger';
import useTranscribeConfig from '../../hooks/use-transcribe-config';

const StreamingView: React.FC<{
  componentName: 'StreamingView';
}> = () => {
  const [transcribeConfig] = useTranscribeConfig();
  const [recognizedTextArray, setRecognizedTextArray] = useState<string[]>([]);
  const [recognizingText, setRecognizingText] = useState<string>('');
  const [started, setStarted] = useState(false);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [startTranslated, setStartTranslated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const transcribeController = useMemo(() => new TranscribeController(), []);

  useEffect(() => {
    transcribeController.setConfig(transcribeConfig);

    // if config is being updated, then stop the transcription
    setStarted(false);
  }, [transcribeConfig, transcribeController]);

  useEffect(() => {
    const display = ({ text, final }: { text: string; final: boolean }) => {
      logger.info({ text, final });
      if (final) {
        setRecognizingText('');
        setRecognizedTextArray((prevTextArray) => [...prevTextArray, text]);
      } else {
        setRecognizingText(text);
      }
    };

    transcribeController.on('recognized', display);

    return () => {
      transcribeController.removeListener('recognized', display);
    };
  }, [transcribeController]);

  useEffect(() => {
    (async () => {
      if (started) {
        logger.info('attempting to start transcription');

        // reset state
        setRecognizedTextArray([]);
        setRecognizingText('');

        await transcribeController.init().catch((error: Error) => {
          logger.error(error);
          setStarted(false);
        });
      } else {
        logger.info('stopping transcription');
        await transcribeController.stop();
      }
    })();
  }, [started, transcribeController]);

  useEffect(() => {
      (async () => {
          if (startTranslated) {
              logger.info('attempting to translate.');
              await transcribeController.translate(recognizedTextArray);
              setStartTranslated(false);
          }
      })();
  }, [startTranslated, transcribeController, recognizedTextArray]);

  useEffect(() => {
      const displayTransletedText = (text: string) => {
          logger.info(text);
          setTranslatedText(text);
      };

      transcribeController.on('translated', displayTransletedText);

      return () => {
          transcribeController.removeListener('translated', displayTransletedText);
      };
  }, [transcribeController]);

  useEffect(() => {
      (async () => {
          if (isPlaying) {
              logger.info('start polly playing.');
              await transcribeController.polly_voice(translatedText);
          }
      })();
  }, [isPlaying, transcribeController, translatedText]);

  useEffect(() => {
      const playAudio = (playURL: string) => {
          logger.info('play text');
          
          const audio = new Audio(playURL);
          audio.load();
          audio.play();
          setIsPlaying(false);
      };

      transcribeController.on('pollyed', playAudio);

      return () => {
          transcribeController.removeListener('pollyed', playAudio);
      };
  }, [transcribeController]);

  return (
    <div className="flex-grow flex flex-col">
      <div className="flex-grow flex flex-row justify-center">
        <TextBox
          name="streaming-result"
          placeholder="Your text will show up here"
          value={[...recognizedTextArray, recognizingText].join(' ')}
        />

        <TextBox
          name="translate-result"
          placeholder="Your translated text will show up here"
          value={translatedText}
        />
      </div>
      <div className="flex-grow flex flex-row justify-center">
        <Button
          text="Start"
          color="green"
          disabled={started}
          onClick={() => setStarted(true)}
        />
        <Button
          text="Stop"
          color="red"
          disabled={!started}
          onClick={() => setStarted(false)}
        />
        <Button
          text="Translate"
          color="blue"
          disabled={started && [...recognizedTextArray, recognizingText].join(' ').length > 0}
          onClick={() => setStartTranslated(true)}
        />
        <Button
          text="Voice"
          color="yellow"
          disabled={translatedText.length === 0}
          onClick={() => setIsPlaying(true)}
        />
      </div>

    </div>
  );
};

export default StreamingView;

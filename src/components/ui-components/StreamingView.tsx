import React, { useEffect, useMemo, useState } from 'react';
import Button from './helpers/Button';
import TextBox from './helpers/TextBox';

import TranscribeController from '../../controllers/transcribe.controller';
import logger from '../../utils/logger';
import useTranscribeConfig from '../../hooks/use-transcribe-config';
import useTranslateConfig from '../../hooks/use-translate-config';

const StreamingView: React.FC<{
  componentName: 'StreamingView';
}> = () => {
  const [transcribeConfig] = useTranscribeConfig();
  const [translateConfig] = useTranslateConfig();
  const [recognizedTextArray, setRecognizedTextArray] = useState<string[]>([]);
  const [recognizingText, setRecognizingText] = useState<string>('');
  const [started, setStarted] = useState(false);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [startTranslated, setStartTranslated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cleared, setCleared] = useState(false);

  const transcribeController = useMemo(() => new TranscribeController(), []);

  useEffect(() => {
    transcribeController.setConfig(transcribeConfig, translateConfig);

    // if config is being updated, then stop the transcription
    setStarted(false);
  }, [transcribeConfig, transcribeController, translateConfig]);

  useEffect(() => {
    const display = ({ text, final }: { text: string; final: boolean }) => {
      logger.info({ text, final });
      if (final) {
        setRecognizingText('');
        setRecognizedTextArray((prevTextArray) => [...prevTextArray, text]);
        setStartTranslated(true);
      } else {
        setRecognizingText(text);
        setStartTranslated(false);
      }
    };

    transcribeController.on('recognized', display);

    return () => {
      transcribeController.removeListener('recognized', display);
    };
  }, [transcribeController, recognizedTextArray, recognizingText]);

  useEffect(() => {
    (async () => {
      if (started) {
        logger.info('attempting to start transcription');

        // reset state
        // setRecognizedTextArray([]);
        // setRecognizingText('');
        // setTranslatedText('');

        await transcribeController.init().catch((error: Error) => {
          logger.error(error);
          setStarted(false);
          // setTranslatedText('');
        });
      } else {
        logger.info('stopping transcription');
        await transcribeController.stop();
        (async () => {       
          if (translatedText) {
            logger.info('start polly playing.');
            await transcribeController.polly_voice(translatedText);  
          }                     
        })();
      }
    })();
  }, [started]);

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

  useEffect(() => {
      (async () => {
          if (cleared) {
              logger.info('clear text');
              // reset state
              setRecognizedTextArray([]);
              setRecognizingText('');
              setTranslatedText('');
              setCleared(false);
          }
      })();
  }, [translatedText, recognizingText, recognizedTextArray, cleared]);

  return (
    <div className="flex-grow flex flex-col">
      <div className="flex-grow flex flex-row justify-center">
        <TextBox
          name="streaming-result"
          placeholder="您的音译将显示在这里"
          value={[...recognizedTextArray, recognizingText].join(' ')}
        />

        <TextBox
          name="translate-result"
          placeholder="您的翻译将显示在这里"
          value={translatedText}
        />
      </div>
      <div className="flex-grow flex flex-row justify-center">
        <Button
          text="开始"
          color="green"
          disabled={started}
          onClick={() => setStarted(true)}
        />
        <Button
          text="结束&朗读"
          color="red"
          disabled={!started}
          onClick={() => setStarted(false)}
        />        
        <Button
          text="朗读"
          color="blue"
          disabled={translatedText.length === 0}
          onClick={() => setIsPlaying(true)}
        />
        <Button
          text="清除"
          color="yellow"
          disabled={started}
          onClick={() => setCleared(true)}
        />
      </div>

    </div>
  );
};

export default StreamingView;

import React from 'react';
import TranscribeConfigProvider from './transcribe-config';
import SiteConfigProvider from './site-config';
import PollyConfigProvider from './polly-config';
import TranslateConfigProvider from './translate-config';

export const StoreProviders: React.FC = (props) => {
  const { children } = props;
  return (
    <SiteConfigProvider>
      <PollyConfigProvider>
        <TranslateConfigProvider>
          <TranscribeConfigProvider>{children}</TranscribeConfigProvider>
        </TranslateConfigProvider>
      </PollyConfigProvider>      
    </SiteConfigProvider>
  );
};

export default StoreProviders;

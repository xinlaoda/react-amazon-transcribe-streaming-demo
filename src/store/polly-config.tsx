/* eslint-disable @typescript-eslint/indent */
import * as React from 'react';
import pollyConfig from '../constants/transcribe.constants';

type PollyContext = [
  typeof pollyConfig,
  React.Dispatch<React.SetStateAction<typeof pollyConfig>> | (() => {}),
];

export const PollyConfigContext = React.createContext<PollyContext>([
  pollyConfig,
  () => {},
]);

const PollyConfigProvider: React.FC<{}> = ({ children }) => {
  const pollyConfigHook = React.useState(pollyConfig);

  return (
    <PollyConfigContext.Provider value={pollyConfigHook}>
      {children}
    </PollyConfigContext.Provider>
  );
};

export default PollyConfigProvider;

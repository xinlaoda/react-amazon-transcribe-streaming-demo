/* eslint-disable @typescript-eslint/indent */
import * as React from 'react';
import translateConfig from '../constants/translate.constants';

type TranslateContext = [
  typeof translateConfig,
  React.Dispatch<React.SetStateAction<typeof translateConfig>> | (() => {}),
];

export const TranslateConfigContext = React.createContext<TranslateContext>([
  translateConfig,
  () => {},
]);

const TranslateConfigProvider: React.FC<{}> = ({ children }) => {
  const translateConfigHook = React.useState(translateConfig);

  return (
    <TranslateConfigContext.Provider value={translateConfigHook}>
      {children}
    </TranslateConfigContext.Provider>
  );
};

export default TranslateConfigProvider;

import * as React from 'react';

import { TranslateConfigContext } from '../store/translate-config';

const useTranslateConfig = () => {
  return React.useContext(TranslateConfigContext);
};

export default useTranslateConfig;

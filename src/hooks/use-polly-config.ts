import * as React from 'react';

import { PollyConfigContext } from '../store/polly-config';

const usePollyConfig = () => {
  return React.useContext(PollyConfigContext);
};

export default usePollyConfig;

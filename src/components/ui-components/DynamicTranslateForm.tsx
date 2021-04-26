import React from 'react';
import FormSelect from './helpers/FormSelect';
import useTranslateConfig from '../../hooks/use-translate-config';
import logger from '../../utils/logger';

const DynamicTranslateForm: React.FC<{
  componentName: 'DynamicTranslateForm';
  fields: string[];
}> = ({ fields }) => {
  const [translateConfig, setTranslateConfig] = useTranslateConfig();

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.persist();
    if (typeof setTranslateConfig === 'function') {
      setTranslateConfig({
        ...translateConfig,
        'selectedTarget': event.target.value,
      });
      logger.info('target value: ', event.target.value);
    }
  };

  return (
    <form className="flex flex-col my-5 border-black border-2 text-center w-1/3 px-3 py-4 text-white mx-auto rounded">
      {fields.map((field) => (
        <FormSelect
          key={field}
          type='select'
          name={field}
          context={translateConfig as { [key: string]: string | number | {} }}
          onInputChange={onChange}
        />
      ))}
    </form>
  );
};

export default DynamicTranslateForm;

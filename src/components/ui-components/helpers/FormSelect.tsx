/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import camelCase from 'camelcase';

type Fn = (
  ...args: any[]
) =>
  | void
  | (() => void)
  | ((event: React.ChangeEvent<HTMLSelectElement>) => void);

const FormSelect: React.FC<{
  name: string;
  type: 'select';
  context: { [key: string]: string | number | {} };
  onInputChange: Fn;
}> = ({ name, context, onInputChange, type }) => {
  const formattedName = camelCase(name);
  const trOptions = context.translateTarget as any;

  return (
    <div className="flex flex-col text-white items-start">
      <label className="capitalize font-bold" htmlFor={formattedName}>
        {name}
      </label>

      <select
        id={formattedName}
        name={formattedName}
        placeholder={name}
        className="w-full mx-auto bg-gray-200 text-sm py-2 px-3 rounded mb-2 text-black border-black border-b-2"
        onChange={onInputChange}
      >
        {Object.keys(trOptions).map((v, i) => (
          <option value={trOptions[v]} key={v}>{v}</option>
        ))}
      </select>
    </div>
  );
};

export default FormSelect;

import React from 'react';

const FormInput = React.memo(({
  type = "text",
  id,
  name,
  value,
  onChange,
  placeholder,
  label,
  required = false,
  error = null,
  success = null,
  helpText = null,
  className = "",
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
          error
            ? "border-red-300 focus:ring-red-500"
            : "border-gray-300 focus:ring-primary-500"
        }`}
        required={required}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600 mt-1">
          {success}
        </p>
      )}
      {helpText && !error && !success && (
        <p className="text-sm text-gray-500 mt-1">
          {helpText}
        </p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;

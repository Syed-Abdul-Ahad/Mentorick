import React, { useState } from 'react';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';

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
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

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
      <div className="relative">
        <input
          type={inputType}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
            isPassword ? 'pr-10' : ''
          } ${
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-primary-500"
          }`}
          required={required}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <HiOutlineEyeSlash className="h-5 w-5" />
            ) : (
              <HiOutlineEye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
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

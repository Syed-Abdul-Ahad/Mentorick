import React from 'react';

const AuthFormLayout = React.memo(({
  title,
  subtitle,
  children,
  error = null
}) => {
  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {children}
        </div>
      </div>
    </div>
  );
});

AuthFormLayout.displayName = 'AuthFormLayout';

export default AuthFormLayout;

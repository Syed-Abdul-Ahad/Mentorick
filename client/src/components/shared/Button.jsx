
import React from 'react';

const baseClasses = 'font-medium rounded-lg transition-colors duration-200 focus:outline-none';

const variantClasses = {
  solid: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white disabled:bg-primary-300',
  outline: 'border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white disabled:border-primary-300 disabled:text-primary-300',
  ghost: 'text-primary-500 hover:bg-primary-50 active:bg-primary-100 disabled:text-primary-300',
  link: 'text-primary-500 hover:text-primary-600 underline-offset-4 hover:underline disabled:text-primary-300'
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl'
};

const Button = React.memo(({ 
  children, 
  variant = 'solid', 
  size = 'md', 
  onClick, 
  disabled = false, 
  type = 'button',
  className = '',
  ...props 
}) => {
  
  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;

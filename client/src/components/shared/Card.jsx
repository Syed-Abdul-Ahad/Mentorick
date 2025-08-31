import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = true, 
  delay = 0, 
  direction = 'up' 
}) => {
  const directions = {
    up: { y: 50, opacity: 0 },
    down: { y: -50, opacity: 0 },
    left: { x: 50, opacity: 0 },
    right: { x: -50, opacity: 0 }
  };

  return (
    <motion.div
      initial={directions[direction]}
      whileInView={{ x: 0, y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.6,
        delay: delay,
        ease: "easeOut"
      }}
      whileHover={hover ? { y: -5, scale: 1.02 } : {}}
      className={`
        bg-white rounded-xl shadow-sm border border-gray-100
        p-6 transition-all duration-300
        ${hover ? 'hover:shadow-lg hover:border-primary-200' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default Card;

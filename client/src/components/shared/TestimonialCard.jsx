import React from 'react';

const TestimonialCard = React.memo(({ avatar, name, role, feedback }) => {
  return (
    <div className="bg-[#f8fafc] bg-opacity-20 backdrop-blur-sm rounded-lg p-4 h-[7rem]">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <img 
              src={avatar} 
              alt={name}
              className="w-12 h-12 rounded-full object-cover"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex space-x-2">
            <h4 className="text-[#121212] font-medium text-sm">{name}</h4>
          </div>
          <p className="text-start text-[#121212] text-opacity-80 text-xs mb-2">{role}</p>
          <p className="text-start text-[#121212] text-opacity-90 text-sm leading-relaxed">
            {feedback}
          </p>
        </div>
      </div>
    </div>
  );
});

TestimonialCard.displayName = 'TestimonialCard';

export default TestimonialCard;

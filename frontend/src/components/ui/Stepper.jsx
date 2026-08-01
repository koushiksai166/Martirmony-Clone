import React from 'react';

const Stepper = ({ currentStep, steps }) => {
  const totalSteps = steps.length;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 mb-8">
      <h2 className="text-2xl font-bold text-center mb-8 text-gray-700">
        Complete Your Profile
      </h2>
      <div className="relative">
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200" style={{ transform: 'translateY(-50%)' }}></div>
        <div
          className="absolute left-0 top-1/2 h-0.5 bg-blue-600 transition-all duration-500"
          style={{
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            transform: 'translateY(-50%)'
          }}
        ></div>
        <div className="flex items-center justify-between relative">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <div key={step} className="flex flex-col items-center z-10">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold
                    transition-all duration-500
                    ${isCompleted ? 'bg-blue-600 text-white' : ''}
                    ${isActive ? 'bg-white border-2 border-blue-600 text-blue-600 scale-110' : ''}
                    ${!isCompleted && !isActive ? 'bg-gray-200 text-gray-500' : ''}
                  `}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>
                <p
                  className={`
                    mt-2 text-sm text-center
                    ${isActive ? 'font-bold text-blue-600' : 'text-gray-500'}
                  `}
                >
                  {step}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Stepper;
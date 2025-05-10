
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  const handleStart = () => {
    setIsAnimating(true);
    // Delay navigation to show animation
    setTimeout(() => {
      navigate('/admin/login');
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-jeopardy-navy to-jeopardy-dark p-4">
      <div className={`text-center ${isAnimating ? 'animate-card-flip' : ''}`}>
        <h1 className="text-6xl md:text-8xl font-jeopardy text-jeopardy-gold mb-8 tracking-wider shadow-text">
          JEOPARDY RELOADED
        </h1>
        <Button 
          onClick={handleStart}
          className="jeopardy-btn text-2xl md:text-3xl px-8 py-4"
        >
          START
        </Button>
      </div>
    </div>
  );
};

export default Index;

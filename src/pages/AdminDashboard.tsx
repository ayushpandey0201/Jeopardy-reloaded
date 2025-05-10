import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Grid2X2, Play } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Question {
  id: string;
  text: string;
  difficulty: string;
  visited: boolean;
}

interface Category {
  id: string;
  name: string;
  questions: Question[];
}

interface Game {
  _id: string;
  userId: string;
  categories: Category[];
  createdAt: string;
  updatedAt: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlayGameModalOpen, setIsPlayGameModalOpen] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        });
        navigate('/admin/login');
        return;
      }

      const response = await fetch('http://localhost:3000/api/games', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setGames(data.games);
      } else {
        throw new Error(data.message || 'Failed to load games');
      }
    } catch (error) {
      console.error('Error loading games:', error);
      toast({
        title: "Error",
        description: "Failed to load games. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-jeopardy-navy to-jeopardy-dark p-8">
      <h1 className="text-5xl md:text-6xl font-jeopardy text-jeopardy-gold mb-12">
        ADMIN DASHBOARD
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Card className="bg-jeopardy-blue border-4 border-jeopardy-gold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-8 flex flex-col items-center">
            <Grid2X2 size={80} className="text-jeopardy-gold mb-6" />
            <h2 className="text-3xl font-jeopardy text-jeopardy-gold mb-4">Create Game</h2>
            <p className="text-white text-center mb-6">
              Create categories and add questions with varying difficulty levels
            </p>
            <Button 
              onClick={() => navigate('/admin/create')}
              className="jeopardy-btn w-full text-xl"
            >
              CREATE GAME
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-jeopardy-blue border-4 border-jeopardy-gold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-8 flex flex-col items-center">
            <Play size={80} className="text-jeopardy-gold mb-6" />
            <h2 className="text-3xl font-jeopardy text-jeopardy-gold mb-4">Play Game</h2>
            <p className="text-white text-center mb-6">
              Start playing with your created categories and questions
            </p>
            <Button 
              onClick={() => setIsPlayGameModalOpen(true)}
              className="jeopardy-btn w-full text-xl"
            >
              PLAY GAME
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Play Game Modal */}
      <Dialog open={isPlayGameModalOpen} onOpenChange={setIsPlayGameModalOpen}>
        <DialogContent className="bg-jeopardy-blue text-white border-2 border-jeopardy-gold max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-jeopardy-gold font-jeopardy text-2xl">Select a Game to Play</DialogTitle>
            <DialogDescription className="text-white/80">
              Choose from your saved games or create a new one
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {loading ? (
              <p className="text-white text-center">Loading games...</p>
            ) : games.length === 0 ? (
              <div className="text-center">
                <p className="text-white mb-4">No games created yet. Create your first game!</p>
                <Button 
                  onClick={() => {
                    setIsPlayGameModalOpen(false);
                    navigate('/admin/create');
                  }}
                  className="jeopardy-btn"
                >
                  Create Game
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {games.map((game) => (
                  <div key={game._id} className="bg-jeopardy-blue/50 border-2 border-jeopardy-gold rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-jeopardy text-jeopardy-gold mb-2">
                          Game created on {new Date(game.createdAt).toLocaleDateString()}
                        </h3>
                        <p className="text-white">
                          {game.categories.length} categories with {game.categories.reduce((acc, cat) => acc + cat.questions.length, 0)} questions
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setIsPlayGameModalOpen(false);
                          navigate('/admin/play', { state: { game } });
                        }}
                        className="jeopardy-btn"
                      >
                        Play
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Button 
        onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
        }}
        className="mt-12 bg-transparent border-2 border-white text-white hover:bg-white/10"
      >
        Logout
      </Button>
    </div>
  );
};

export default AdminDashboard;

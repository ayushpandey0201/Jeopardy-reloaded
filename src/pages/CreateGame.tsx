import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

// Define our data structure types
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

const CreateGame = () => {
  const [step, setStep] = useState(1);
  const [categoryName, setCategoryName] = useState('');
  const [questionsPerDifficulty, setQuestionsPerDifficulty] = useState(5);
  const [currentQuestions, setCurrentQuestions] = useState<Record<string, string>>({});
  const [currentDifficulty, setCurrentDifficulty] = useState('easy');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoriesToDelete, setCategoriesToDelete] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [gameName, setGameName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get existing categories or initialize empty array
  const getCategories = (): Category[] => {
    const stored = localStorage.getItem('jeopardy_categories');
    return stored ? JSON.parse(stored) : [];
  };

  // Save a category to localStorage
  const saveCategory = (category: Category) => {
    const categories = getCategories();
    const existingIndex = categories.findIndex(c => c.id === category.id);
    
    if (existingIndex >= 0) {
      categories[existingIndex] = category;
    } else {
      categories.push(category);
    }
    
    localStorage.setItem('jeopardy_categories', JSON.stringify(categories));
  };

  // Delete a category from localStorage
  const deleteCategory = (categoryId: string) => {
    const categories = getCategories();
    const updatedCategories = categories.filter(c => c.id !== categoryId);
    localStorage.setItem('jeopardy_categories', JSON.stringify(updatedCategories));
    
    toast({
      title: "Category Deleted",
      description: "The category has been successfully deleted.",
    });
  };

  const handleOpenDeleteDialog = () => {
    setCategoriesToDelete(getCategories());
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCategory = () => {
    if (selectedCategoryId) {
      deleteCategory(selectedCategoryId);
      setIsDeleteDialogOpen(false);
      setSelectedCategoryId('');
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!categoryName.trim()) {
        toast({
          title: "Category Required",
          description: "Please enter a category name",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (questionsPerDifficulty < 1 || questionsPerDifficulty > 10) {
        toast({
          title: "Invalid Number",
          description: "Please enter a number between 1 and 10",
          variant: "destructive",
        });
        return;
      }
      // Initialize the questions map with empty strings
      const initialQuestions: Record<string, string> = {};
      for (let i = 0; i < questionsPerDifficulty; i++) {
        initialQuestions[`easy_${i}`] = '';
        initialQuestions[`medium_${i}`] = '';
        initialQuestions[`hard_${i}`] = '';
      }
      setCurrentQuestions(initialQuestions);
      setStep(3);
    }
  };

  const handleQuestionChange = (difficulty: string, index: number, value: string) => {
    const key = `${difficulty}_${index}`;
    setCurrentQuestions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleQuestionNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'next') {
      if (currentQuestionIndex < questionsPerDifficulty - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else if (currentDifficulty === 'easy') {
        setCurrentDifficulty('medium');
        setCurrentQuestionIndex(0);
      } else if (currentDifficulty === 'medium') {
        setCurrentDifficulty('hard');
        setCurrentQuestionIndex(0);
      } else {
        // We're done with all questions, save everything
        saveAllQuestions();
      }
    } else {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      } else if (currentDifficulty === 'hard') {
        setCurrentDifficulty('medium');
        setCurrentQuestionIndex(questionsPerDifficulty - 1);
      } else if (currentDifficulty === 'medium') {
        setCurrentDifficulty('easy');
        setCurrentQuestionIndex(questionsPerDifficulty - 1);
      }
    }
  };

  const saveAllQuestions = async () => {
    // Check if all questions are filled
    const hasEmptyQuestions = Object.values(currentQuestions).some(q => !q.trim());
    if (hasEmptyQuestions) {
      toast({
        title: "Empty Questions",
        description: "Please fill in all questions before saving",
        variant: "destructive",
      });
      return;
    }

    // Create category and questions
    const newCategory: Category = {
      id: Date.now().toString(),
      name: categoryName,
      questions: []
    };
    ['easy', 'medium', 'hard'].forEach(difficulty => {
      for (let i = 0; i < questionsPerDifficulty; i++) {
        const key = `${difficulty}_${i}`;
        newCategory.questions.push({
          id: `${newCategory.id}_${key}`,
          text: currentQuestions[key],
          difficulty: difficulty,
          visited: false
        });
      }
    });

    // Add the new category to the categories array
    setCategories(prev => [...prev, newCategory]);
    setCategoryName('');
    setCurrentQuestions({});
    setCurrentDifficulty('easy');
    setCurrentQuestionIndex(0);
    setStep(1); // Go back to step 1 to add another category

    toast({
      title: "Category Added",
      description: `Category "${newCategory.name}" added. (${categories.length + 1}/5)`
    });
  };

  const handleSaveGame = async () => {
    if (!gameName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your game",
        variant: "destructive"
      });
      return;
    }
    if (categories.length !== 5) {
      toast({
        title: "Error",
        description: "You must add exactly 5 categories to save the game.",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch('http://localhost:3000/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: gameName,
          categories
        })
      });
      if (!response.ok) {
        throw new Error('Failed to save game');
      }
      toast({
        title: "Success",
        description: "Game saved successfully",
      });
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error saving game:', error);
      toast({
        title: "Error",
        description: "Failed to save game",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-jeopardy-navy to-jeopardy-dark p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl md:text-5xl font-jeopardy text-jeopardy-gold text-center">
            CREATE GAME
          </h1>
          <Button 
            onClick={handleOpenDeleteDialog} 
            variant="destructive" 
            className="flex items-center gap-2"
          >
            <Trash2 size={18} /> Delete Category
          </Button>
        </div>
        
        {step === 1 && (
          <Card className="bg-jeopardy-blue border-4 border-jeopardy-gold shadow-2xl animate-fade-in">
            <CardHeader>
              <CardTitle className="text-2xl text-jeopardy-gold font-jeopardy">
                Step 1: Enter Category Name
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="categoryName" className="block text-white font-semibold mb-2">
                  Category Name
                </label>
                <Input
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="jeopardy-input"
                  placeholder="e.g. Sports, Science, History..."
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button 
                  onClick={() => navigate('/admin/dashboard')}
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button onClick={handleNextStep} className="jeopardy-btn">
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {step === 2 && (
          <Card className="bg-jeopardy-blue border-4 border-jeopardy-gold shadow-2xl animate-fade-in">
            <CardHeader>
              <CardTitle className="text-2xl text-jeopardy-gold font-jeopardy">
                Step 2: Questions Per Difficulty Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="questionsPerLevel" className="block text-white font-semibold mb-2">
                  How many questions per difficulty level?
                </label>
                <Input
                  id="questionsPerLevel"
                  type="number"
                  min={1}
                  max={10}
                  value={questionsPerDifficulty}
                  onChange={(e) => setQuestionsPerDifficulty(parseInt(e.target.value) || 1)}
                  className="jeopardy-input"
                />
                <p className="text-white/70 text-sm mt-2">
                  You'll create {questionsPerDifficulty} questions for each difficulty level (Easy, Medium, Hard).
                </p>
              </div>
              <div className="flex justify-between pt-4">
                <Button 
                  onClick={() => setStep(1)}
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button onClick={handleNextStep} className="jeopardy-btn">
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {step === 3 && (
          <Card className="bg-jeopardy-blue border-4 border-jeopardy-gold shadow-2xl animate-fade-in">
            <CardHeader>
              <CardTitle className="text-2xl text-jeopardy-gold font-jeopardy">
                Step 3: Enter Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center bg-jeopardy-gold/20 rounded-lg p-3 mb-2">
                <p className="text-white font-semibold">
                  Category: <span className="text-jeopardy-gold">{categoryName}</span>
                </p>
                <p className="text-white">
                  Difficulty: <span className="text-jeopardy-gold capitalize">{currentDifficulty}</span> • 
                  Question {currentQuestionIndex + 1} of {questionsPerDifficulty}
                </p>
              </div>
              
              <div>
                <label htmlFor="question" className="block text-white font-semibold mb-2">
                  Question Text
                </label>
                <Textarea
                  id="question"
                  value={currentQuestions[`${currentDifficulty}_${currentQuestionIndex}`] || ''}
                  onChange={(e) => handleQuestionChange(currentDifficulty, currentQuestionIndex, e.target.value)}
                  className="jeopardy-input min-h-[150px]"
                  placeholder="Enter your question here..."
                />
              </div>
              
              <div className="flex justify-between pt-4">
                <Button 
                  onClick={() => handleQuestionNavigation('prev')}
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10"
                  disabled={currentDifficulty === 'easy' && currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                
                <Button 
                  onClick={() => handleQuestionNavigation('next')}
                  className="jeopardy-btn"
                >
                  {currentDifficulty === 'hard' && currentQuestionIndex === questionsPerDifficulty - 1 
                    ? 'Finish & Save' 
                    : 'Next'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Category Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-jeopardy-blue text-white border-2 border-jeopardy-gold">
            <DialogHeader>
              <DialogTitle className="text-jeopardy-gold font-jeopardy text-2xl">Delete Category</DialogTitle>
              <DialogDescription className="text-white/80">
                Select a category to delete. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-4">
              {categoriesToDelete.length === 0 ? (
                <p className="text-white">No categories available to delete.</p>
              ) : (
                <div className="space-y-2">
                  {categoriesToDelete.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 rounded border border-jeopardy-gold/30 hover:bg-jeopardy-blue/50">
                      <span>{category.name}</span>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => setSelectedCategoryId(category.id)}
                        className={selectedCategoryId === category.id ? "ring-2 ring-white" : ""}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button 
                className="bg-transparent border-2 border-white text-white hover:bg-white/10"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteCategory}
                disabled={!selectedCategoryId}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {categories.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl text-jeopardy-gold font-jeopardy mb-2">Added Categories ({categories.length}/5):</h2>
            <ul className="list-disc list-inside text-white">
              {categories.map((cat, idx) => (
                <li key={cat.id}>{idx + 1}. {cat.name}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Game Name input field */}
        {categories.length === 5 && (
          <div className="mb-6">
            <label htmlFor="gameName" className="block text-white font-semibold mb-2">
              Game Name
            </label>
            <Input
              id="gameName"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="jeopardy-input"
              placeholder="Enter a name for your game"
            />
          </div>
        )}

        <Button 
          onClick={handleSaveGame}
          className="jeopardy-btn w-full mt-4"
          disabled={categories.length !== 5 || !gameName.trim() || isSaving}
        >
          Save Game
        </Button>
      </div>
    </div>
  );
};

export default CreateGame;

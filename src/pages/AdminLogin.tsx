import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      try {
        const response = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Store the token and user info
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          toast({
            title: "Login Successful",
            description: "Welcome back to Jeopardy Reloaded!",
          });
          navigate('/admin/dashboard');
        } else {
          toast({
            title: "Login Failed",
            description: data.message || "Invalid username or password",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Login error:', error);
        toast({
          title: "Error",
          description: "An error occurred during login",
          variant: "destructive",
        });
      }
    } else {
      // Registration
      try {
        const response = await fetch('http://localhost:3000/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: "Registration Successful",
            description: "You can now log in with your credentials",
          });
          setIsLogin(true);
        } else {
          toast({
            title: "Registration Failed",
            description: data.message || "Failed to register",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Registration error:', error);
        toast({
          title: "Error",
          description: "An error occurred during registration",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-jeopardy-navy to-jeopardy-dark p-4">
      <Card className="w-full max-w-md bg-jeopardy-blue border-4 border-jeopardy-gold shadow-2xl">
        <CardHeader className="text-center border-b-2 border-jeopardy-gold/50 pb-4">
          <CardTitle className="text-4xl font-jeopardy text-jeopardy-gold">
            {isLogin ? 'ADMIN LOGIN' : 'REGISTER'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-white font-semibold">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="jeopardy-input w-full"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-white font-semibold">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="jeopardy-input w-full"
                required
              />
            </div>
            <div className="pt-2">
              <Button type="submit" className="jeopardy-btn w-full">
                {isLogin ? 'LOGIN' : 'REGISTER'}
              </Button>
            </div>
            <div className="text-center mt-4">
              <Button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-jeopardy-gold hover:underline"
              >
                {isLogin ? 'Need to register?' : 'Already have an account?'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;

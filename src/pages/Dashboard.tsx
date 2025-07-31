import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, LogOut, Settings, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-full">
              <Droplets className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Agua</h1>
              <p className="text-sm text-muted-foreground">Stay hydrated, stay healthy</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">Ready to track your hydration for today?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Daily Goal Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-primary" />
                <span>Today's Goal</span>
              </CardTitle>
              <CardDescription>Your daily hydration target</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">64 oz</div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">0% complete</p>
            </CardContent>
          </Card>

          {/* Quick Add Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Add</CardTitle>
              <CardDescription>Log your water intake</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Water
              </Button>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>This Week</CardTitle>
              <CardDescription>Your hydration streak</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent mb-2">0 days</div>
              <p className="text-sm text-muted-foreground">Keep going!</p>
            </CardContent>
          </Card>
        </div>

        {/* Setup Notice */}
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-accent">Complete Your Setup</CardTitle>
            <CardDescription>
              Set up your profile to get personalized hydration recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              onClick={() => navigate('/profile')}
            >
              Set Up Profile
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
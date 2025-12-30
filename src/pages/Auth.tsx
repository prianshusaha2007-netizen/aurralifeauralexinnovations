import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AuraOrb } from '@/components/AuraOrb';
import { toast } from 'sonner';
import { z } from 'zod';

// Common passwords list (top 100 most common)
const commonPasswords = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'shadow', '123123', '654321', 'superman', 'qazwsx',
  'michael', 'football', 'password1', 'password123', 'batman', 'login',
  'admin', 'welcome', 'hello', 'charlie', 'donald', 'password!', 'qwerty123',
  '1234567890', '123456789', 'princess', 'azerty', '000000', 'access',
  'passw0rd', 'starwars', 'whatever', 'freedom', 'lovely', 'nicole', 'pepper',
  'joshua', 'maggie', 'matthew', 'jordan', 'daniel', 'hannah', 'summer',
]);

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (!@#$%^&*)')
  .refine(
    (password) => !commonPasswords.has(password.toLowerCase()),
    'This password is too common. Please choose a stronger password.'
  );

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: passwordSchema,
});

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/', { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    try {
      const schema = isLogin ? loginSchema : signupSchema;
      schema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') {
            // Show only the first password error for cleaner UX
            if (!fieldErrors.password) fieldErrors.password = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Check terms agreement for signup
    if (!isLogin && !agreedToTerms) {
      toast.error('Please agree to the Privacy Policy and Terms of Service');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please try again.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Welcome back! 💫');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              terms_accepted_at: new Date().toISOString(),
            },
          },
        });
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Try logging in instead.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Account created! Welcome to AURRA 💫');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="flex flex-col items-center">
          <AuraOrb size="xl" />
          <h1 className="mt-6 text-3xl font-bold aura-gradient-text">AURRA</h1>
          <p className="mt-2 text-muted-foreground text-center">
            {isLogin ? 'Welcome back, ready to continue?' : 'Create your account to begin'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-center text-lg py-6 rounded-xl"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1 text-center">{errors.email}</p>
            )}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-center text-lg py-6 rounded-xl"
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-destructive mt-1 text-center">{errors.password}</p>
            )}
          </div>

          {/* Terms checkbox for signup */}
          {!isLogin && (
            <div className="flex items-start space-x-3 p-4 rounded-xl bg-muted/50">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                disabled={loading}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                I agree to the{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>
              </label>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={loading || (!isLogin && !agreedToTerms)}
            className="w-full rounded-full aura-gradient text-lg py-6"
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({});
              setAgreedToTerms(false);
            }}
            className="text-primary hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>

          {isLogin && (
            <div className="text-xs text-muted-foreground pt-2">
              By signing in, you agree to our{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
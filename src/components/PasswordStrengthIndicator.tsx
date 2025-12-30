import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const commonPasswords = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'shadow', '123123', '654321', 'superman', 'qazwsx',
  'michael', 'football', 'password1', 'password123', 'batman', 'login',
  'admin', 'welcome', 'hello', 'charlie', 'donald', 'password!', 'qwerty123',
]);

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%^&*)', test: (p) => /[^A-Za-z0-9]/.test(p) },
  { label: 'Not a common password', test: (p) => p.length > 0 && !commonPasswords.has(p.toLowerCase()) },
];

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const results = useMemo(() => {
    return requirements.map((req) => ({
      ...req,
      passed: req.test(password),
    }));
  }, [password]);

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = requirements.length;

  const strength = useMemo(() => {
    if (password.length === 0) return { label: '', color: 'bg-muted', textColor: 'text-muted-foreground' };
    if (passedCount <= 2) return { label: 'Weak', color: 'bg-destructive', textColor: 'text-destructive' };
    if (passedCount <= 4) return { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    return { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' };
  }, [password, passedCount]);

  if (password.length === 0) return null;

  return (
    <div className="space-y-3 p-4 rounded-xl bg-muted/50 animate-fade-in">
      {/* Strength meter */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Password strength</span>
          <span className={cn('text-xs font-medium', strength.textColor)}>{strength.label}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300 rounded-full', strength.color)}
            style={{ width: `${(passedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-1 gap-1.5">
        {results.map((req, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-2 text-xs transition-colors duration-200',
              req.passed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
            )}
          >
            {req.passed ? (
              <Check className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

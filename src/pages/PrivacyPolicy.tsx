import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-2 aura-gradient-text">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

        <div className="space-y-8 text-foreground">
          <p>
            Welcome to AURA, a product by Auralex Innovations ("Company", "we", "us", "our").
            Your privacy matters to us. This Privacy Policy explains how we collect, use, store, and protect your information.
          </p>

          <section>
            <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">We collect only what is necessary to provide the service.</p>
            
            <h3 className="font-medium mb-2">a) Information You Provide</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
              <li>Name (optional)</li>
              <li>Email or login credentials</li>
              <li>Conversations with AURA</li>
              <li>Files, images, or content you upload</li>
              <li>Preferences you choose to share</li>
            </ul>

            <h3 className="font-medium mb-2">b) Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
              <li>Device type (web / mobile)</li>
              <li>Usage patterns (feature usage, frequency)</li>
              <li>Timezone and language</li>
              <li>Anonymous analytics for improvement</li>
            </ul>

            <h3 className="font-medium mb-2">We do NOT access:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Your phone calls</li>
              <li>Your contacts</li>
              <li>Your camera or microphone without permission</li>
              <li>Your private apps or messages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Provide personalized responses</li>
              <li>Improve conversation quality</li>
              <li>Build life patterns only for your experience</li>
              <li>Maintain safety, performance, and reliability</li>
            </ul>
            <p className="mt-4 font-medium">Your data is never sold.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Memory & Personalization</h2>
            <p className="mb-4">AURA may remember preferences, repeated topics, and emotional patterns.</p>
            <p className="mb-4">This happens only with your permission and only to improve your experience.</p>
            <p className="text-muted-foreground">
              You can ask AURA what it remembers and delete memories anytime.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. AI & Automated Processing</h2>
            <p className="mb-4">AURA uses AI models to generate responses.</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>AI responses are not professional advice</li>
              <li>AI may sometimes be incorrect</li>
              <li>You are responsible for decisions you make</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Data Sharing</h2>
            <p className="mb-4">We may share limited data with:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Cloud infrastructure providers</li>
              <li>AI service providers (only to generate responses)</li>
            </ul>
            <p className="mt-4">We do not share identifiable personal data with third parties for marketing.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-muted-foreground">
              We use reasonable technical and organizational measures to protect your data.
              However, no system is 100% secure. Use AURA at your own discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Children's Privacy</h2>
            <p className="text-muted-foreground">
              AURA is not intended for children under 13 years without parental consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Your Rights</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Access your data</li>
              <li>Request deletion</li>
              <li>Withdraw consent</li>
              <li>Stop using the service anytime</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. Continued use means acceptance of updates.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Contact</h2>
            <p className="text-muted-foreground">
              For privacy concerns: contact@auralex.ai
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

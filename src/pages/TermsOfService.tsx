import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const TermsOfService: React.FC = () => {
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

        <h1 className="text-3xl font-bold mb-2 aura-gradient-text">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

        <div className="space-y-8 text-foreground">
          <p>
            By accessing or using AURA, you agree to the following terms.
          </p>

          <section>
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">By creating an account or using AURA, you confirm that:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>You are legally capable of entering this agreement</li>
              <li>You agree to all terms stated here</li>
            </ul>
            <p className="mt-4">If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Service Description</h2>
            <p className="mb-4">
              AURA is an AI-powered companion designed to assist users emotionally and practically.
            </p>
            <p className="font-medium mb-2">AURA is NOT:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>A therapist</li>
              <li>A doctor</li>
              <li>A lawyer</li>
              <li>A financial advisor</li>
            </ul>
            <p className="mt-4">All outputs are informational only.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. User Responsibility</h2>
            <p className="mb-4">You agree that:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>You use AURA at your own risk</li>
              <li>You are responsible for decisions taken based on AI responses</li>
              <li>You will not misuse the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Limitation of Liability</h2>
            <p className="mb-4 font-medium">Auralex Innovations shall not be liable for:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Any loss, harm, or damage arising from use of AURA</li>
              <li>Decisions made based on AI output</li>
              <li>Emotional, financial, or professional consequences</li>
            </ul>
            <p className="mt-4">Use AURA as a support tool, not a replacement for human judgment.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Intellectual Property</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>All product IP belongs to Auralex Innovations</li>
              <li>You retain ownership of your content</li>
              <li>By using AURA, you grant us permission to process content to provide services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Subscriptions & Payments</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Pricing may change</li>
              <li>No refunds unless stated</li>
              <li>Abuse of free usage may result in restrictions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Termination</h2>
            <p className="mb-4">We reserve the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Suspend or terminate accounts</li>
              <li>Restrict access if misuse is detected</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Prohibited Use</h2>
            <p className="mb-4">You may not:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Use AURA for illegal activities</li>
              <li>Attempt to reverse-engineer the system</li>
              <li>Exploit or abuse AI outputs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms are governed by the laws of India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update terms. Continued usage means acceptance.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

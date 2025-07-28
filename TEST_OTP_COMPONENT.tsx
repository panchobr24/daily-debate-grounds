import { OtpVerification } from '@/components/ui/otp-verification';

// Test component to verify OtpVerification works
export function TestOtpComponent() {
  const handleVerificationComplete = () => {
    console.log('Verification completed!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-turf-purple via-turf-purple-dark to-background flex items-center justify-center p-4">
      <OtpVerification 
        email="test@example.com"
        onVerificationComplete={handleVerificationComplete}
      />
    </div>
  );
}

// To test this component, temporarily replace the Auth component with this:
// export default TestOtpComponent; 
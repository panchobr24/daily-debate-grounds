import { useState } from 'react';
import { OtpVerification } from '@/components/ui/otp-verification';

// Test component to force OTP display
export function ForceOtpTest() {
  const [showOtp, setShowOtp] = useState(false);
  const [email, setEmail] = useState('test@example.com');

  const handleVerificationComplete = () => {
    console.log('Verification completed!');
    setShowOtp(false);
  };

  const handleShowOtp = () => {
    console.log('Forcing OTP display');
    setShowOtp(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-turf-purple via-turf-purple-dark to-background flex items-center justify-center p-4">
      {showOtp ? (
        <OtpVerification 
          email={email}
          onVerificationComplete={handleVerificationComplete}
        />
      ) : (
        <div className="w-full max-w-md bg-card/95 backdrop-blur-sm border-turf-purple/20 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-turf-purple mb-4">Test OTP Component</h2>
          <p className="text-muted-foreground mb-4">
            Click the button below to test the OTP verification screen.
          </p>
          <button 
            onClick={handleShowOtp}
            className="w-full bg-turf-purple text-white py-2 px-4 rounded hover:bg-turf-purple-dark"
          >
            Show OTP Screen
          </button>
        </div>
      )}
    </div>
  );
}

// To test this, temporarily replace the Auth component with:
// export default ForceOtpTest; 
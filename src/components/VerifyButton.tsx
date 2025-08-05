import { Button } from './ui/button';

export default function VerifyButton() {
  const handleVerify = () => {
    window.location.href = '/api/auth/discord';
  };

  return (
    <Button 
      onClick={handleVerify}
      className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
      size="lg"
    >
      Verify Premium Access Role
    </Button>
  );
}

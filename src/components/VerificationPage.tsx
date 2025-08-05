import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import VerifyButton from './VerifyButton';

interface VerificationPageProps {
  type: 'unauthorized' | 'failed';
}

export default function VerificationPage({ type }: VerificationPageProps) {
  if (type === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-500 text-xl">Verification Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-300">
              Verification failed. Please ensure you have the Premium Access role in our Discord server.
            </p>
            <VerifyButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-white text-xl">Premium Access Required</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-300">
            Access to CryptoSensei requires the Premium Access role in our Discord server.
          </p>
          <p className="text-sm text-gray-400">
            Join our Discord community and get verified to access advanced crypto analytics and trading insights.
          </p>
          <VerifyButton />
        </CardContent>
      </Card>
    </div>
  );
}

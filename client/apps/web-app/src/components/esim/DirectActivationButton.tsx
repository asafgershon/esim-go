import React, { useState } from 'react';
import { Button } from '@workspace/ui';
import { Smartphone, Check, AlertCircle } from 'lucide-react';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { InstallationLinks } from '@/__generated__/graphql';

interface DirectActivationButtonProps {
  installationLinks: InstallationLinks;
  className?: string;
}

export const DirectActivationButton: React.FC<DirectActivationButtonProps> = ({
  installationLinks,
  className = '',
}) => {
  const [isActivating, setIsActivating] = useState(false);
  const [activationStatus, setActivationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const capabilities = useDeviceCapabilities();

  const handleActivation = () => {
    setIsActivating(true);
    setActivationStatus('idle');

    // Delay for user feedback
    setTimeout(() => {
      try {
        if (capabilities.supportsUniversalLinks && installationLinks.universalLink) {
          // iOS 17.4+ - Direct activation via universal link
          window.location.href = installationLinks.universalLink;
          setActivationStatus('success');
        } else if (capabilities.supportsLPAScheme && installationLinks.lpaScheme) {
          // Android/Windows - LPA scheme activation
          window.location.href = installationLinks.lpaScheme;
          setActivationStatus('success');
        } else {
          // Fallback - Show manual instructions
          setActivationStatus('error');
        }
      } catch (error) {
        console.error('Activation error:', error);
        setActivationStatus('error');
      } finally {
        setIsActivating(false);
      }
    }, 500);
  };

  const getButtonText = () => {
    if (isActivating) return 'מפעיל...';
    if (activationStatus === 'success') return 'ההפעלה החלה';
    
    switch (capabilities.recommendedMethod) {
      case 'universalLink':
        return 'הפעל eSIM במכשיר';
      case 'lpaScheme':
        return 'הפעל eSIM במכשיר';
      default:
        return 'הצג הוראות הפעלה';
    }
  };

  const getButtonIcon = () => {
    if (activationStatus === 'success') return <Check className="h-4 w-4 ml-2" />;
    if (activationStatus === 'error') return <AlertCircle className="h-4 w-4 ml-2" />;
    return <Smartphone className="h-4 w-4 ml-2" />;
  };

  return (
    <Button
      className={`w-full ${className}`}
      onClick={handleActivation}
      disabled={isActivating}
      variant={activationStatus === 'success' ? 'default' : 'default'}
    >
      {getButtonIcon()}
      {getButtonText()}
    </Button>
  );
};
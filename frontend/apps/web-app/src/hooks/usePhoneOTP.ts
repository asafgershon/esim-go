import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { SEND_EMAIL_OTP, VERIFY_EMAIL_OTP } from '@/lib/graphql/mutations';
import { SendOTPResponse, SignInResponse } from '@/lib/types';

export const usePhoneOTP = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [sendOTPMutation] = useMutation(SEND_EMAIL_OTP);
  const [verifyOTPMutation] = useMutation(VERIFY_EMAIL_OTP);

  const sendOTP = async (email: string): Promise<SendOTPResponse> => {
    try {
      setLoading(true);
      const { data } = await sendOTPMutation({
        variables: { email }
      });

      if (data.sendEmailOTP.success) {
        setPhoneNumber(email); // stored as "phoneNumber" for backwards compat
        setStep('otp');
      }

      return data.sendEmailOTP;
    } catch (error) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        error: 'Failed to send OTP'
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (otp: string, firstName?: string, lastName?: string): Promise<SignInResponse> => {
    try {
      setLoading(true);
      const { data } = await verifyOTPMutation({
        variables: {
          input: {
            email: phoneNumber, // the email stored earlier
            otp,
            firstName,
            lastName
          }
        }
      });

      if (data.verifyEmailOTP.success) {
        // Store tokens in localStorage
        if (data.verifyEmailOTP.sessionToken) {
          localStorage.setItem('authToken', data.verifyEmailOTP.sessionToken);
        }
        if (data.verifyEmailOTP.refreshToken) {
          localStorage.setItem('refreshToken', data.verifyEmailOTP.refreshToken);
        }
      }

      return data.verifyEmailOTP;
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        error: 'Failed to verify OTP'
      };
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('phone');
    setPhoneNumber('');
  };

  return {
    loading,
    step,
    phoneNumber,
    sendOTP,
    verifyOTP,
    resetFlow
  };
};
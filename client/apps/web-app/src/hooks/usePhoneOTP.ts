import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { SEND_PHONE_OTP, VERIFY_PHONE_OTP } from '@/lib/graphql/mutations';
import { SendOTPResponse, SignInResponse } from '@/lib/types';

export const usePhoneOTP = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [sendOTPMutation] = useMutation(SEND_PHONE_OTP);
  const [verifyOTPMutation] = useMutation(VERIFY_PHONE_OTP);

  const sendOTP = async (phone: string): Promise<SendOTPResponse> => {
    try {
      setLoading(true);
      const { data } = await sendOTPMutation({
        variables: { phoneNumber: phone }
      });
      
      if (data.sendPhoneOTP.success) {
        setPhoneNumber(phone);
        setStep('otp');
      }
      
      return data.sendPhoneOTP;
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
            phoneNumber,
            otp,
            firstName,
            lastName
          }
        }
      });
      
      if (data.verifyPhoneOTP.success) {
        // Store tokens in localStorage
        if (data.verifyPhoneOTP.sessionToken) {
          localStorage.setItem('authToken', data.verifyPhoneOTP.sessionToken);
        }
        if (data.verifyPhoneOTP.refreshToken) {
          localStorage.setItem('refreshToken', data.verifyPhoneOTP.refreshToken);
        }
      }
      
      return data.verifyPhoneOTP;
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
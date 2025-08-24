import { gql } from "@/__generated__";
import {
  Checkout,
  UpdateCheckoutAuthMutation,
  UpdateCheckoutAuthNameMutation,
  VerifyOtpMutation,
} from "@/__generated__/graphql";
import { useLoginForm } from "@/hooks/useLoginForm";
import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AppleSignInButton,
  Button,
  Card,
  CardContent,
  GoogleSignInButton,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Label,
  PhoneInput,
  Separator,
} from "@workspace/ui";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, User as UserIcon } from "lucide-react";
import { forwardRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { SectionHeader } from "./section-header";
import { useAuth } from "@/hooks/useAuth";
import { type User } from "@/__generated__/types";

type AuthCardProps = {
  completed: boolean;
  sectionNumber?: number;
  data: Pick<Checkout, "auth" | "id"> | undefined;
  onAuthUpdate: (auth: Checkout["auth"]) => void;
};

const PhoneOrEmailSchema = z
  .object({
    phone: z.union([
      z.string({ message: "טלפון שגוי" }).optional(),
      z.e164({ message: "טלפון שגוי" }).optional(),
    ]),
    email: z.string({ message: "אימייל שגוי" }).optional(),
  })
  .refine((data) => data.phone || data.email, {
    message: "טלפון או אימייל נדרשים",
    path: ["phone", "email"],
  });

const UPDATE_CHECKOUT_AUTH_MUTATION = gql(`
    mutation UpdateCheckoutAuth($sessionId: String!, $firstName: String, $lastName: String, $email: String, $phone: String) {
        updateCheckoutAuth(sessionId: $sessionId, firstName: $firstName, lastName: $lastName, email: $email, phone: $phone) {
            ... on CheckoutAuth {
                completed
                userId
                email
                phone
                firstName
                lastName
                
            }
        }
    }
    `);

export const AuthCard = ({
  sectionNumber,
  data,
  completed,
  onAuthUpdate,
}: AuthCardProps) => {
  const { user: loggedInUser } = useAuth();

  const { auth } = data || {};

  if (!auth) return <AuthCardSkeleton />;

  return (
    <Card dir="rtl" className="flex flex-col gap-4 shadow-xl">
      <SectionHeader
        sectionNumber={sectionNumber || 2}
        title="השלם את הפרטים"
        icon={<UserIcon className="h-5 w-5 text-primary" />}
        isCompleted={completed}
      />
      {loggedInUser && <LoggedInAuthCard user={loggedInUser} />}
      {!auth.otpSent && !auth.otpVerified && data?.id && (
        <PhoneEmailForm
          sessionId={data.id}
          defaultPhone={auth.phone || undefined}
          defaultEmail={auth.email || undefined}
          onSuccess={() => onAuthUpdate(data?.auth)}
        />
      )}
      {auth.otpSent && data && auth.phone && !auth.otpVerified && (
        <OTPForm
          sessionId={data?.id}
          phone={auth.phone}
          onSuccess={() => onAuthUpdate(data?.auth)}
        />
      )}
      {!auth.firstName && !auth.lastName && data && (
        <NameForm
          sessionId={data?.id}
          firstName={auth.firstName || ""}
          lastName={auth.lastName || ""}
          onSuccess={() => onAuthUpdate(data?.auth)}
        />
      )}
    </Card>
  );
};

const LoggedInAuthCard = ({
  user,
}: {
  user: Omit<User, "orderCount" | "role">;
}) => {
  const { signOut, isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return (
    <CardContent className="space-y-4 flex flex-row items-center justify-between gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
      <div className="flex-1">
        <p className="font-medium">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-sm text-muted-foreground">
          {user.email || user.phoneNumber}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => signOut(false)}>
        <LogOut className="h-4 w-4" />
      </Button>
    </CardContent>
  );
};

const OTP_SUBMIT_MUTATION = gql(`
    mutation VerifyOTP($sessionId: String!, $otp: String!) {
        verifyOTP(sessionId: $sessionId, otp: $otp) {
            ... on CheckoutAuthWithOTP {
                otpVerified
                authToken
                refreshToken
            }
        }
    }
    `);

const OTPFormSchema = z.object({
  otp: z.string().min(6, { message: "הקוד שגוי" }),
});

type OTPFormSchema = z.infer<typeof OTPFormSchema>;

const OTPForm = ({
  sessionId,
  phone,
  onSuccess,
}: {
  sessionId: string;
  phone: string;
  onSuccess: () => void;
}) => {
  const [verifyOTP, { loading: isLoading }] =
    useMutation<VerifyOtpMutation>(OTP_SUBMIT_MUTATION);
  const { register, handleSubmit, watch, setValue, formState } =
    useForm<OTPFormSchema>({
      resolver: zodResolver(OTPFormSchema),
      defaultValues: {
        otp: "",
      },
      mode: "onChange",
    });

  const onSubmit = useCallback(
    async (formData: OTPFormSchema) => {
      const { data } = await verifyOTP({
        variables: {
          sessionId: sessionId,
          otp: formData.otp,
        },
      });
      if (data?.verifyOTP.authToken) {
        localStorage.setItem("authToken", data.verifyOTP.authToken);
      }
      if (data?.verifyOTP.refreshToken) {
        localStorage.setItem("refreshToken", data.verifyOTP.refreshToken);
      }
      if (data?.verifyOTP.otpVerified) {
        onSuccess();
      }
    },
    [verifyOTP, sessionId, onSuccess]
  );

  const OTP = watch("otp");
  useEffect(() => {
    if (OTP.length === 6) {
      onSubmit({ otp: OTP });
    }
  }, [OTP, onSubmit]);

  return (
    <CardContent className="space-y-4 flex flex-col items-center">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          הכנס את הקוד בן 6 הספרות שנשלח ל
        </p>
        <p className="font-medium" dir="ltr">
          {phone}
        </p>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col items-center w-full gap-4"
      >
        <InputOTP
          {...register("otp")}
          onChange={(e) => setValue("otp", e)}
          maxLength={6}
          disabled={formState.isSubmitting || isLoading}
        >
          <InputOTPGroup dir="ltr">
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </form>
    </CardContent>
  );
};

const NameFormSchema = z.object({
  firstName: z.string().min(1, { message: "שם פרטי שגוי" }),
  lastName: z.string().min(1, { message: "שם משפחה שגוי" }),
});

type NameFormSchema = z.infer<typeof NameFormSchema>;

const UPDATE_CHECKOUT_AUTH_NAME_MUTATION = gql(`

    mutation UpdateCheckoutAuthName($sessionId: String!, $firstName: String, $lastName: String) {
        updateCheckoutAuthName(sessionId: $sessionId, firstName: $firstName, lastName: $lastName) {
            ... on CheckoutAuth {
                firstName
                lastName
            }
        }
    }
    `);

const NameForm = ({
  sessionId,
  firstName,
  lastName,
  onSuccess,
}: {
  sessionId: string;
  firstName: string;
  lastName: string;
  onSuccess: () => void;
}) => {
  const [updateCheckoutAuthName, { loading: isLoading }] =
    useMutation<UpdateCheckoutAuthNameMutation>(
      UPDATE_CHECKOUT_AUTH_NAME_MUTATION
    );
  const { register, handleSubmit, formState } = useForm<NameFormSchema>({
    resolver: zodResolver(NameFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
    mode: "onChange",
  });

  const onSubmit = useCallback(
    async (formData: NameFormSchema) => {
      const result = await updateCheckoutAuthName({
        variables: {
          sessionId,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
      });

      if (result.data?.updateCheckoutAuthName) {
        onSuccess();
      }
    },
    [updateCheckoutAuthName, sessionId, onSuccess]
  );
  return (
    <CardContent className="space-y-4 flex flex-col items-center">
      {formState.isSubmitSuccessful && !firstName && !lastName && (
        <>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              כמעט סיימנו! נשאר לנו רק למלא שם לחשבונית
            </p>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 w-full flex flex-col items-center gap-2"
          >
            <Input
              {...register("firstName")}
              type="text"
              placeholder="שם פרטי"
            />
            <Input
              {...register("lastName")}
              type="text"
              placeholder="שם משפחה"
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !formState.isValid || !formState.isDirty}
            >
              שמירה
            </Button>
          </form>
        </>
      )}
    </CardContent>
  );
};

const AuthCardSkeleton = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full animate-pulse" />
        <div>
          <div className="h-4 md:h-5 w-20 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-3 md:h-4 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
};

const SeparatorWithText = ({ text }: { text: string }) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <Separator className="w-full" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">{text}</span>
      </div>
    </div>
  );
};

const PhoneEmailForm = ({
  sessionId,
  defaultPhone,
  defaultEmail,
  onSuccess,
}: {
  sessionId: string;
  defaultPhone?: string;
  defaultEmail?: string;
  onSuccess: () => void;
}) => {
  const { handleSocialSignIn } = useLoginForm({
    onSuccess,
  });

  const [updateCheckoutAuth, { loading: isLoading }] =
    useMutation<UpdateCheckoutAuthMutation>(UPDATE_CHECKOUT_AUTH_MUTATION);

  const { register, handleSubmit, watch, formState } = useForm({
    resolver: zodResolver(PhoneOrEmailSchema),
    defaultValues: {
      phone: defaultPhone || undefined,
      email: defaultEmail || undefined,
    },
    mode: "onChange",
  });

  const onSubmit = async (formData: z.infer<typeof PhoneOrEmailSchema>) => {
    const { email, phone } = formData;
    if (!sessionId) return;
    const result = await updateCheckoutAuth({
      variables: {
        sessionId,
        email: email,
        phone: phone,
      },
    });

    if (result.data?.updateCheckoutAuth) {
      onSuccess();
    }
  };

  return (
    <CardContent className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-2">
          <AppleSignInButton
            className="justify-center"
            onClick={() => handleSocialSignIn("apple")}
          />
          <GoogleSignInButton
            className="justify-center"
            onClick={() => handleSocialSignIn("google")}
          />
        </div>
        <SeparatorWithText text="או" />
        <PhoneNumberControl {...register("phone")} isLoading={isLoading} />
        <SeparatorWithText text="או" />

        <EmailControl {...register("email")} isLoading={isLoading} />
        <AnimatePresence mode="wait">
          <motion.div
            key="footer"
            initial={{ opacity: 0, y: 10, height: 0, marginBottom: 0 }}
            animate={{
              opacity: 1,
              y: 0,
              height: "auto",
              marginBottom: 6,
            }}
            exit={{ opacity: 0, y: 10, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* errors */}
            {formState.errors && (
              <div className="text-red-500 text-sm">
                {formState.errors.phone?.message ||
                  formState.errors.email?.message}
              </div>
            )}
            <Button
              size={`lg`}
              type="submit"
              disabled={
                isLoading ||
                (!watch("email") && !watch("phone")) ||
                !formState.isValid ||
                formState.isSubmitting
              }
              className="w-full"
            >
              שלח קוד אימות
            </Button>
          </motion.div>
        </AnimatePresence>
      </form>
    </CardContent>
  );
};

const PhoneNumberControl = forwardRef<HTMLInputElement, { isLoading: boolean }>(
  ({ isLoading, ...rest }, ref) => {
    return (
      <div className="space-y-2">
        <Label htmlFor="phone">מספר טלפון</Label>
        <PhoneInput
          id="phone"
          ref={ref}
          name="phone"
          defaultCountry="US"
          placeholder="הכנס מספר טלפון"
          disabled={isLoading}
          {...rest}
          // defaultCountry={getDefaultCountry()}
          // error={!!error && !phoneForm.watch("phoneNumber").trim()}
        />
      </div>
    );
  }
);
PhoneNumberControl.displayName = "PhoneNumberControl";

const EmailControl = forwardRef<HTMLInputElement, { isLoading: boolean }>(
  ({ isLoading, ...rest }, ref) => {
    return (
      <div className="space-y-2">
        <Label htmlFor="email">אימייל</Label>
        <Input
          type="email"
          id="email"
          name="email"
          placeholder="הכנס אימייל"
          ref={ref}
          disabled={isLoading}
          {...rest}
        />
      </div>
    );
  }
);
EmailControl.displayName = "EmailControl";

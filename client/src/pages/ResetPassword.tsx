import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Lock, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/Logo_company_logo_alphabet_logo_brand_logo_(1)_1766604339283.png";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      toast({
        title: "Invalid link",
        description: "This reset link is invalid. Please request a new one.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", {
        token,
        newPassword: values.newPassword,
      });
      setResetComplete(true);
    } catch (error: any) {
      const errorData = await error.json?.().catch(() => null);
      toast({
        title: "Reset failed",
        description: errorData?.error || "This link may have expired. Please request a new one.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1F44] via-[#0E2A55] to-[#132D5E] dark:from-[#060E22] dark:via-[#0A1833] dark:to-[#0E2040] px-5 pt-10 pb-14">
          <div className="relative z-10 flex flex-col items-center">
            <img
              src={logoImage}
              alt="Bénédictions Partagées"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37]/50 shadow-lg mb-4"
            />
            <h1 className="font-serif text-2xl font-bold text-white">Invalid Link</h1>
          </div>
        </div>
        <div className="px-5 -mt-8 relative z-10">
          <Card className="shadow-lg">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">This password reset link is invalid or has expired.</p>
              <Link href="/forgot-password" data-testid="link-request-new-reset">
                <Button className="bg-[#0A1F44] dark:bg-[#D4AF37] dark:text-[#0A1F44]">
                  Request New Reset Link
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1F44] via-[#0E2A55] to-[#132D5E] dark:from-[#060E22] dark:via-[#0A1833] dark:to-[#0E2040] px-5 pt-10 pb-14">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="relative z-10 flex flex-col items-center">
          <img
            src={logoImage}
            alt="Bénédictions Partagées"
            className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37]/50 shadow-lg mb-4"
          />
          <h1 className="font-serif text-2xl font-bold text-white" data-testid="text-reset-password-title">
            New Password
          </h1>
          <p className="text-white/60 text-sm mt-1">Create a new password for your account</p>
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-10">
        <Card className="shadow-lg">
          {resetComplete ? (
            <>
              <CardHeader>
                <CardTitle className="font-serif text-lg text-center flex flex-col items-center gap-3">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  Password Reset Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground text-sm mb-4" data-testid="text-reset-complete">
                  Your password has been successfully updated. You can now sign in with your new password.
                </p>
                <Button
                  className="w-full bg-[#0A1F44] dark:bg-[#D4AF37] dark:text-[#0A1F44]"
                  onClick={() => setLocation("/login")}
                  data-testid="button-go-to-login"
                >
                  Go to Sign In
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="font-serif text-lg text-center">Set New Password</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="password"
                                placeholder="At least 6 characters"
                                className="pl-10"
                                data-testid="input-new-password"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="password"
                                placeholder="Confirm your new password"
                                className="pl-10"
                                data-testid="input-confirm-password"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-[#0A1F44] dark:bg-[#D4AF37] dark:text-[#0A1F44] border-[#0A1F44] dark:border-[#D4AF37]"
                      disabled={isSubmitting}
                      data-testid="button-reset-password"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Resetting...
                        </span>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="justify-center">
                <p className="text-sm text-muted-foreground">
                  <Link href="/login" data-testid="link-login">
                    <span className="text-[#D4AF37] font-medium cursor-pointer">Back to Sign In</span>
                  </Link>
                </p>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

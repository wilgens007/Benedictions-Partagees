import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
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
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/Logo_company_logo_alphabet_logo_brand_logo_(1)_1766604339283.png";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email: values.email });
      setEmailSent(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="font-serif text-2xl font-bold text-white" data-testid="text-forgot-password-title">
            Reset Password
          </h1>
          <p className="text-white/60 text-sm mt-1">We'll send you a reset link</p>
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-10">
        <Card className="shadow-lg">
          {emailSent ? (
            <>
              <CardHeader>
                <CardTitle className="font-serif text-lg text-center flex flex-col items-center gap-3">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  Check Your Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground text-sm" data-testid="text-reset-sent">
                  If an account exists with that email, we've sent a password reset link.
                  Please check your inbox and spam folder.
                </p>
              </CardContent>
              <CardFooter className="justify-center">
                <Link href="/login" data-testid="link-back-to-login">
                  <Button variant="outline" className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </Button>
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="font-serif text-lg text-center">Forgot Password</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="your@email.com"
                                className="pl-10"
                                data-testid="input-reset-email"
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
                      data-testid="button-send-reset"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="justify-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <Link href="/login" data-testid="link-login">
                    <span className="text-[#D4AF37] font-medium cursor-pointer">Sign In</span>
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

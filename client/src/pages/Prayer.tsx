import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { HandHeart, Send, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/lib/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { insertPrayerRequestSchema } from "@shared/schema";

const formSchema = insertPrayerRequestSchema.extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  message: z.string().min(1, "Prayer request is required").max(2000, "Request too long"),
});

type FormData = z.infer<typeof formSchema>;

export default function Prayer() {
  const { t, language } = useLanguage();
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
      language: language,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/prayer-requests", {
        ...data,
        language,
      });
      return response.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      form.reset();
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 py-6">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-1">
          {t("prayerRequest")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("submitPrayer")}
        </p>
      </div>

      <div className="flex-1 px-5">
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#EAB308]/10 flex items-center justify-center">
                <HandHeart className="w-6 h-6 text-[#EAB308]" />
              </div>
              <div>
                <h2 className="font-serif font-semibold text-lg text-foreground">
                  {t("prayerRequest")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("welcomeMessage")}
                </p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("yourName")} *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t("namePlaceholder")} 
                          {...field} 
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("yourEmail")} *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder={t("emailPlaceholder")} 
                          {...field} 
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("yourPrayer")} *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t("prayerPlaceholder")}
                          className="min-h-[150px] resize-none"
                          {...field}
                          data-testid="textarea-prayer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={mutation.isPending}
                  data-testid="button-submit-prayer"
                >
                  {mutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t("loading")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {t("submit")}
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center px-4 pb-4">
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            &laquo; Do not be anxious about anything, but in every situation, by prayer and petition, 
            with thanksgiving, present your requests to God. &raquo;
          </p>
          <p className="text-sm text-[#EAB308] dark:text-[#EAB308] font-serif font-medium mt-2">
            — Philippians 4:6
          </p>
        </div>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 mx-auto">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="font-serif text-xl">
              {t("prayerSubmitted")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("prayerConfirmation")}
            </DialogDescription>
          </DialogHeader>
          <Button 
            onClick={() => setShowSuccess(false)}
            className="w-full mt-4"
            data-testid="button-close-success"
          >
            {t("amen")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

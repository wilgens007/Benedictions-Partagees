import { FileText, Mail, Globe, CreditCard, Shield, Users, Scale, AlertTriangle, RefreshCw, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/LanguageContext";
import { getLegalText } from "@/lib/legalTranslations";

export default function TermsOfUse() {
  const { language } = useLanguage();
  const lt = (key: string, enFallback: string) => {
    if (language === "en") return enFallback;
    return getLegalText("terms", key, language) || enFallback;
  };
  const ltItems = (key: string, enFallback: string[]): string[] => {
    const text = lt(key, enFallback.join("\n"));
    return text.split("\n").map(s => s.replace(/^- /, "").trim()).filter(Boolean);
  };
  const renderWithEmailLinks = (text: string) => {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const parts = text.split(emailRegex);
    return parts.map((part, i) =>
      emailRegex.test(part) ? (
        <a key={i} href={`mailto:${part}`} className="text-[#D4AF37] font-medium underline">{part}</a>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };
  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-muted-foreground" />
          <h1 className="font-serif text-2xl font-bold text-foreground" data-testid="text-terms-title">
            {lt("title", "Terms of Use")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2" data-testid="text-terms-subtitle">
          {lt("updated", "Last Updated: February 27, 2026")}
        </p>
      </div>

      <div className="flex-1 px-5 space-y-6 pb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground leading-relaxed" data-testid="text-terms-intro">
              {lt("intro1", "Welcome to Bénédictions Partagées (\"BP,\" \"we,\" \"our,\" or \"us\"). By accessing or using our mobile application and services, you agree to these Terms of Use.")}
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3 font-medium">
              {lt("intro2", "If you do not agree, please do not use the app.")}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <section data-testid="section-terms-purpose">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">{lt("s1_title", "1. Purpose of the App")}</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s1_body", "Bénédictions Partagées is a Christian digital platform offering:")}
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  {ltItems("s1_items", ["Gospel music streaming", "Daily devotionals", "Prayer request features", "Community engagement", "Optional Premium Subscription services"]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s1_note", "The content is provided for spiritual, inspirational, and entertainment purposes only.")}
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-accounts">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">{lt("s2_title", "2. User Accounts")}</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s2_body", "To access certain features, you may be required to create an account. You agree to:")}
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  {ltItems("s2_items", ["Provide accurate information", "Maintain the confidentiality of your login credentials", "Be responsible for activity under your account"]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s2_note1", "We reserve the right to suspend accounts that violate these Terms.")}
                </p>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  {lt("s2_note2", "You must be at least 13 years old to use this app.")}
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-subscription">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">{lt("s3_title", "3. Premium Subscription (Stripe Billing)")}</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s3_body", "Bénédictions Partagées offers optional Premium Subscription plans.")}
                </p>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">{lt("s3_a_title", "A. Billing")}</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                    {ltItems("s3_a_items", ["Payments are processed securely through Stripe.", "By subscribing, you authorize recurring billing according to the selected plan (monthly or annual).", "Subscription fees are charged automatically at the start of each billing cycle."]).map((item, i) => (
                      <li key={i}>{renderWithEmailLinks(item)}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">{lt("s3_b_title", "B. Auto-Renewal")}</h3>
                  <p className="text-muted-foreground leading-relaxed ml-2">
                    {lt("s3_b_body", "Unless canceled before the renewal date, your subscription will automatically renew.")}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">{lt("s3_c_title", "C. Cancellation")}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {lt("s3_c_body", "You may cancel your subscription at any time through:")}
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                    {ltItems("s3_c_items", ["Your account settings", "By contacting us at: contact@benedictionspartagees.org"]).map((item, i) => (
                      <li key={i}>{renderWithEmailLinks(item)}</li>
                    ))}
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    {lt("s3_c_note", "Cancellation will take effect at the end of the current billing period. No partial refunds will be issued unless required by law.")}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">{lt("s3_d_title", "D. Refund Policy")}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {lt("s3_d_body", "All payments are non-refundable unless:")}
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                    {ltItems("s3_d_items", ["Required by applicable law", "There was a billing error"]).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    {lt("s3_d_note", "If you believe you were charged incorrectly, contact us within 7 days of the charge.")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-ugc">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">{lt("s4_title", "4. User-Generated Content")}</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s4_body1", "Users may post prayer requests, comments, and testimonies. By posting content, you grant Bénédictions Partagées a non-exclusive license to display that content within the app.")}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s4_body2", "You agree NOT to post:")}
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  {ltItems("s4_items", ["Abusive or hateful content", "False or misleading information", "Illegal material", "Spam or promotional content"]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s4_note", "We reserve the right to remove content or suspend accounts that violate community standards.")}
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-ip">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">{lt("s5_title", "5. Intellectual Property")}</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s5_body1", "All music, branding, logos, and app design elements are the property of Bénédictions Partagées or its licensed partners.")}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s5_body2", "You may not copy, redistribute, reproduce, or sell any content without written permission.")}
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-termination">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">{lt("s6_title", "6. Termination")}</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s6_body", "We may suspend or terminate access to the app if:")}
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  {ltItems("s6_items", ["You violate these Terms", "You misuse the platform", "You engage in harmful behavior"]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s6_note", "Termination may result in loss of access to Premium features without refund.")}
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-liability">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">{lt("s7_title", "7. Limitation of Liability")}</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s7_body", 'The app is provided "as is" without warranties of any kind. We are not responsible for:')}
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  {ltItems("s7_items", ["Service interruptions", "Technical issues", "User-posted content", "Indirect or incidental damages"]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  {lt("s7_note", "Use of the app is at your own risk.")}
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-privacy">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">{lt("s8_title", "8. Privacy")}</h2>
            </div>
            <Card>
              <CardContent className="p-5">
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s8_body", "Your use of the app is also governed by our Privacy Policy. Please review it carefully.")}
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-changes">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">{lt("s9_title", "9. Changes to These Terms")}</h2>
            </div>
            <Card>
              <CardContent className="p-5">
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s9_body", "We may update these Terms periodically. Continued use of the app after changes are posted constitutes acceptance of the revised Terms.")}
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-contact">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">{lt("s10_title", "10. Contact Information")}</h2>
            </div>
            <Card className="bg-muted/30">
              <CardContent className="p-5 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  {lt("s10_body", "For questions regarding these Terms, billing issues, or subscription concerns, contact:")}
                </p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href="mailto:contact@benedictionspartagees.org" className="text-[#D4AF37] font-medium underline" data-testid="link-terms-contact-email">
                    contact@benedictionspartagees.org
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a href="https://benedictionspartagees.org" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] font-medium underline" data-testid="link-terms-website">
                    https://benedictionspartagees.org
                  </a>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
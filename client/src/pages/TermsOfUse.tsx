import { FileText, Mail, Globe, CreditCard, Shield, Users, Scale, AlertTriangle, RefreshCw, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function TermsOfUse() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-muted-foreground" />
          <h1 className="font-serif text-2xl font-bold text-foreground" data-testid="text-terms-title">
            Terms of Use
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2" data-testid="text-terms-subtitle">
          Last Updated: February 27, 2026
        </p>
      </div>

      <div className="flex-1 px-5 space-y-6 pb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground leading-relaxed" data-testid="text-terms-intro">
              Welcome to Bénédictions Partagées ("BP," "we," "our," or "us"). By accessing or using our mobile application and services, you agree to these Terms of Use.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3 font-medium">
              If you do not agree, please do not use the app.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <section data-testid="section-terms-purpose">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">1. Purpose of the App</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  Bénédictions Partagées is a Christian digital platform offering:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>Gospel music streaming</li>
                  <li>Daily devotionals</li>
                  <li>Prayer request features</li>
                  <li>Community engagement</li>
                  <li>Optional Premium Subscription services</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  The content is provided for spiritual, inspirational, and entertainment purposes only.
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-accounts">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">2. User Accounts</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  To access certain features, you may be required to create an account. You agree to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>Provide accurate information</li>
                  <li>Maintain the confidentiality of your login credentials</li>
                  <li>Be responsible for activity under your account</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to suspend accounts that violate these Terms.
                </p>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  You must be at least 13 years old to use this app.
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-subscription">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">3. Premium Subscription (Stripe Billing)</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Bénédictions Partagées offers optional Premium Subscription plans.
                </p>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">A. Billing</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                    <li>Payments are processed securely through Stripe.</li>
                    <li>By subscribing, you authorize recurring billing according to the selected plan (monthly or annual).</li>
                    <li>Subscription fees are charged automatically at the start of each billing cycle.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">B. Auto-Renewal</h3>
                  <p className="text-muted-foreground leading-relaxed ml-2">
                    Unless canceled before the renewal date, your subscription will automatically renew.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">C. Cancellation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You may cancel your subscription at any time through:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                    <li>Your account settings</li>
                    <li>By contacting us at: <a href="mailto:contact@benedictionspartagees.org" className="text-[#D4AF37] font-medium underline" data-testid="link-terms-cancel-email">contact@benedictionspartagees.org</a></li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    Cancellation will take effect at the end of the current billing period. No partial refunds will be issued unless required by law.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">D. Refund Policy</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All payments are non-refundable unless:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                    <li>Required by applicable law</li>
                    <li>There was a billing error</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    If you believe you were charged incorrectly, contact us within 7 days of the charge.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-ugc">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">4. User-Generated Content</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  Users may post prayer requests, comments, and testimonies. By posting content, you grant Bénédictions Partagées a non-exclusive license to display that content within the app.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  You agree NOT to post:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>Abusive or hateful content</li>
                  <li>False or misleading information</li>
                  <li>Illegal material</li>
                  <li>Spam or promotional content</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to remove content or suspend accounts that violate community standards.
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-ip">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">5. Intellectual Property</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  All music, branding, logos, and app design elements are the property of Bénédictions Partagées or its licensed partners.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  You may not copy, redistribute, reproduce, or sell any content without written permission.
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-termination">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">6. Termination</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  We may suspend or terminate access to the app if:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>You violate these Terms</li>
                  <li>You misuse the platform</li>
                  <li>You engage in harmful behavior</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Termination may result in loss of access to Premium features without refund.
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-liability">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">7. Limitation of Liability</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  The app is provided "as is" without warranties of any kind. We are not responsible for:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>Service interruptions</li>
                  <li>Technical issues</li>
                  <li>User-posted content</li>
                  <li>Indirect or incidental damages</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  Use of the app is at your own risk.
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-privacy">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">8. Privacy</h2>
            </div>
            <Card>
              <CardContent className="p-5">
                <p className="text-muted-foreground leading-relaxed">
                  Your use of the app is also governed by our Privacy Policy. Please review it carefully.
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-changes">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">9. Changes to These Terms</h2>
            </div>
            <Card>
              <CardContent className="p-5">
                <p className="text-muted-foreground leading-relaxed">
                  We may update these Terms periodically. Continued use of the app after changes are posted constitutes acceptance of the revised Terms.
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          <section data-testid="section-terms-contact">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-serif font-semibold text-lg text-foreground">10. Contact Information</h2>
            </div>
            <Card className="bg-muted/30">
              <CardContent className="p-5 space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  For questions regarding these Terms, billing issues, or subscription concerns, contact:
                </p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href="mailto:contact@benedictionspartagees.org" className="text-[#D4AF37] font-medium underline" data-testid="link-terms-contact-email">
                    contact@benedictionspartagees.org
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a href="https://benedictionspartagees.replit.app" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] font-medium underline" data-testid="link-terms-website">
                    https://benedictionspartagees.replit.app
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
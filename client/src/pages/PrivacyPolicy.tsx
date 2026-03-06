import { Shield, Lock, Database, Share2, FileText, Clock, UserCheck, Baby, Globe, RefreshCw, CheckCircle, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const sections = [
  {
    number: 1,
    title: "Information We Collect",
    icon: Database,
    subsections: [
      {
        subtitle: "A. Account Information",
        intro: "When you create an account, we collect:",
        items: ["Email address", "Username", "Password (securely encrypted using bcrypt hashing)"],
      },
      {
        subtitle: "B. Subscription & Payment Information",
        intro: "If you subscribe to a premium plan:",
        items: [
          "Stripe customer ID and subscription ID (for web payments)",
          "Google Play purchase token (for Android payments)",
          "We do NOT store credit card numbers, billing addresses, or other financial details. All payment processing is handled securely by Stripe or Google Play.",
        ],
      },
      {
        subtitle: "C. Prayer Requests",
        intro: "When you submit a prayer request, we collect:",
        items: ["Your name (or chosen display name)", "Email address", "The prayer request message"],
        note: "Prayer requests may be visible to other users on the prayer wall, depending on your display preferences.",
      },
      {
        subtitle: "D. Saved Verses",
        intro: "When you save Bible verses:",
        items: ["The verse reference, text, and language are stored in your account"],
      },
      {
        subtitle: "E. Push Notification Subscriptions",
        intro: "If you enable push notifications:",
        items: ["Browser push subscription endpoint", "Your preferred language for notifications"],
      },
      {
        subtitle: "F. Usage Data",
        intro: "We collect minimal usage data:",
        items: ["Song play counts (aggregated, not per-user)"],
        note: "We do NOT collect location data, browsing history, contacts, or device identifiers.",
      },
    ],
  },
  {
    number: 2,
    title: "How We Use Your Information",
    icon: FileText,
    intro: "We use your information to:",
    items: [
      "Create and manage your account",
      "Provide access to music, devotionals, daily verses, and premium features",
      "Process premium subscriptions via Stripe or Google Play",
      "Display prayer requests on the prayer wall",
      "Send daily devotional push notifications in your preferred language",
      "Send password reset emails when requested",
      "Notify administrators of new prayer requests via email",
    ],
    note: "We do NOT sell, rent, or trade your personal data to third parties.",
  },
  {
    number: 3,
    title: "Data Storage & Security",
    icon: Lock,
    intro: "Your data is stored securely using:",
    items: [
      "PostgreSQL database hosted on Replit's secure infrastructure",
      "Passwords encrypted with bcrypt hashing (we never store plain text passwords)",
      "HTTP-only cookies for session management",
      "HTTPS encryption for all data in transit",
    ],
    note: "We implement industry-standard security measures. However, no digital system is 100% secure. We encourage you to use a strong, unique password.",
  },
  {
    number: 4,
    title: "Data Sharing",
    icon: Share2,
    intro: "We do not sell or rent your personal information. We share data only with:",
    items: [
      "Stripe \u2014 for processing web payment subscriptions",
      "Google Play \u2014 for processing Android payment subscriptions",
      "Resend \u2014 for sending transactional emails (prayer request notifications, password resets)",
      "When legally required by law or court order",
      "To protect the rights and safety of our users",
    ],
  },
  {
    number: 5,
    title: "User-Generated Content Responsibility",
    icon: FileText,
    paragraphs: [
      "Content such as prayer requests may be visible to other users on the prayer wall. Users are responsible for the information they choose to share publicly.",
      "We reserve the right to remove content that:",
    ],
    items: ["Is abusive, harmful, or offensive", "Violates community standards", "Contains illegal or inappropriate material"],
  },
  {
    number: 6,
    title: "Data Retention",
    icon: Clock,
    intro: "We retain personal data:",
    items: ["As long as your account remains active", "As required for legal or financial compliance", "Password reset tokens are automatically invalidated after 1 hour"],
    note: "You may request deletion of your account and all associated data at any time (see below).",
  },
  {
    number: 7,
    title: "Your Rights",
    icon: UserCheck,
    intro: "You have the right to:",
    items: [
      "Access the data we hold about you",
      "Correct inaccurate information",
      "Request complete deletion of your account and data",
      "Withdraw consent for push notifications at any time",
      "Reset your password securely via email",
    ],
    note: "To exercise any of these rights, contact us at: contact@benedictionspartagees.org. We will respond within 30 days.",
  },
  {
    number: 8,
    title: "Children's Privacy",
    icon: Baby,
    paragraphs: [
      "This app is not intended for children under 13 years of age. We do not knowingly collect personal data from children under 13. If you believe a child has provided us with personal information, please contact us immediately.",
    ],
  },
  {
    number: 9,
    title: "International Users",
    icon: Globe,
    paragraphs: [
      "If you access the app outside the United States, your information may be transferred and processed in the U.S. where our servers are located. By using the app, you consent to this transfer.",
    ],
  },
  {
    number: 10,
    title: "Changes to This Policy",
    icon: RefreshCw,
    paragraphs: [
      "We may update this Privacy Policy periodically. Updates will be posted within the app and on our website.",
      "Continued use of the app after updates constitutes acceptance of the revised policy.",
    ],
  },
];

const dataSafety = {
  collected: ["Email address", "Username", "Prayer requests", "Saved verses", "Push notification preferences"],
  shared: ["With Stripe (payment processing)", "With Google Play (Android payments)", "With Resend (transactional emails)"],
  dataIs: ["Encrypted in transit (HTTPS)", "Passwords securely hashed (bcrypt)", "Not sold or rented to third parties", "Deletable upon user request"],
};

export default function PrivacyPolicy() {
  const dataRemovalEmail = "contact@benedictionspartagees.org";
  const dataRemovalSubject = encodeURIComponent("Data Removal Request - B\u00e9n\u00e9dictions Partag\u00e9es");
  const dataRemovalBody = encodeURIComponent(
    "Hello,\n\nI would like to request the deletion of my account and all associated data from B\u00e9n\u00e9dictions Partag\u00e9es.\n\nMy account email: [please enter your account email here]\n\nThank you."
  );

  return (
    <div className="flex flex-col min-h-full" data-testid="page-privacy-policy">
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-[#D4AF37]" />
          <h1 className="font-serif text-2xl font-bold text-foreground" data-testid="text-privacy-title">
            Privacy Policy
          </h1>
        </div>
        <p className="text-muted-foreground mt-2" data-testid="text-privacy-org">
          B&eacute;n&eacute;dictions Partag&eacute;es
        </p>
        <p className="text-sm text-muted-foreground/70" data-testid="text-privacy-updated">
          Last Updated: March 6, 2026
        </p>
      </div>

      <div className="flex-1 px-5 pb-8 space-y-5">
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground leading-relaxed" data-testid="text-privacy-intro">
              B&eacute;n&eacute;dictions Partag&eacute;es (&quot;BP,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our application and services.
            </p>
          </CardContent>
        </Card>

        {sections.map((section) => (
          <Card key={section.number} data-testid={`section-privacy-${section.number}`}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#D4AF37]/10">
                  <section.icon className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <h2 className="font-serif font-semibold text-lg text-foreground">
                  {section.number}. {section.title}
                </h2>
              </div>

              {"subsections" in section && section.subsections ? (
                <div className="space-y-4">
                  {section.subsections.map((sub, i) => (
                    <div key={i} className="space-y-2">
                      <h3 className="font-medium text-foreground">{sub.subtitle}</h3>
                      <p className="text-sm text-muted-foreground">{sub.intro}</p>
                      <ul className="space-y-1 ml-4">
                        {sub.items.map((item, j) => (
                          <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37]/50 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      {"note" in sub && sub.note && (
                        <p className="text-xs text-muted-foreground/70 italic">{sub.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {"paragraphs" in section && section.paragraphs?.map((p, i) => (
                    <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
                  ))}
                  {"intro" in section && section.intro && (
                    <p className="text-sm text-muted-foreground">{section.intro}</p>
                  )}
                  {"items" in section && section.items && (
                    <ul className="space-y-1 ml-4">
                      {section.items.map((item, j) => (
                        <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37]/50 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  {"note" in section && section.note && (
                    <p className="text-xs text-muted-foreground/70 italic mt-2">{section.note}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Separator />

        <Card data-testid="section-privacy-data-removal">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-red-500/10">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
              <h2 className="font-serif font-semibold text-lg text-foreground">
                Request Data Removal
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You have the right to request the complete deletion of your account and all associated data. This includes your account information, saved verses, prayer requests, push notification subscriptions, and any payment-related identifiers.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Once your data is deleted, this action cannot be undone. Your premium subscription (if any) will also be cancelled.
            </p>
            <a
              href={`mailto:${dataRemovalEmail}?subject=${dataRemovalSubject}&body=${dataRemovalBody}`}
              data-testid="link-data-removal"
            >
              <Button
                variant="outline"
                className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                data-testid="button-request-data-removal"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Request Data Removal
              </Button>
            </a>
            <p className="text-xs text-muted-foreground/70 italic">
              We will process your request within 30 days and confirm deletion via email.
            </p>
          </CardContent>
        </Card>

        <Separator />

        <Card data-testid="section-privacy-data-safety">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#D4AF37]/10">
                <Lock className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <h2 className="font-serif font-semibold text-lg text-foreground">
                Google Play Data Safety Alignment
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-sm text-foreground mb-1">Data Collected:</h3>
                <ul className="space-y-1 ml-4">
                  {dataSafety.collected.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37]/50 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-sm text-foreground mb-1">Data Shared With:</h3>
                <ul className="space-y-1 ml-4">
                  {dataSafety.shared.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37]/50 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-sm text-foreground mb-1">Security Practices:</h3>
                <ul className="space-y-1 ml-4">
                  {dataSafety.dataIs.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[#D4AF37]/70 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">
              Questions about this Privacy Policy? Contact us at{" "}
              <a href="mailto:contact@benedictionspartagees.org" className="text-[#D4AF37] font-medium" data-testid="link-contact-email">
                contact@benedictionspartagees.org
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

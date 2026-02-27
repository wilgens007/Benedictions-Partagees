import { Shield, Lock, Database, Share2, FileText, Clock, UserCheck, Baby, Globe, RefreshCw, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const sections = [
  {
    number: 1,
    title: "Information We Collect",
    icon: Database,
    subsections: [
      {
        subtitle: "A. Account Information",
        intro: "When you create an account, we may collect:",
        items: ["Full name", "Email address", "Profile information", "Login credentials (encrypted)"],
      },
      {
        subtitle: "B. Subscription & Payment Information",
        intro: "If you subscribe to a premium plan:",
        items: [
          "Payments are processed securely through Stripe.",
          "We do NOT store full credit card numbers.",
          "Stripe may collect billing details according to their own Privacy Policy.",
        ],
      },
      {
        subtitle: "C. User-Generated Content",
        intro: "When using the prayer and community features, we may collect:",
        items: ["Prayer requests", "Comments", "Testimonies", "Reactions or engagement data"],
        note: "This content may be visible to other users within the app.",
      },
      {
        subtitle: "D. Technical & Usage Data",
        intro: "We may automatically collect:",
        items: ["Device type and operating system", "App usage data", "Log information", "Crash reports", "IP address (for security purposes)"],
        note: "If using Firebase or Supabase, analytics and authentication data may be processed through those platforms.",
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
      "Provide access to music, devotionals, and premium features",
      "Process subscriptions via Stripe",
      "Display prayer requests and comments",
      "Improve app performance and security",
      "Send service-related notifications",
    ],
    note: "We do NOT sell your personal data.",
  },
  {
    number: 3,
    title: "Data Storage & Security",
    icon: Lock,
    intro: "Your data may be stored securely using:",
    items: ["Firebase / Supabase infrastructure", "Secure cloud hosting providers", "Stripe secure payment systems"],
    note: "We implement industry-standard security measures including encryption and secure authentication. However, no digital system is 100% secure.",
  },
  {
    number: 4,
    title: "Data Sharing",
    icon: Share2,
    intro: "We do not sell or rent your personal information. We may share data only:",
    items: [
      "With trusted service providers (Stripe, Firebase, Supabase)",
      "When legally required",
      "To protect the rights and safety of our users",
    ],
  },
  {
    number: 5,
    title: "User-Generated Content Responsibility",
    icon: FileText,
    paragraphs: [
      "Content such as prayer requests and comments may be visible to others. Users are responsible for the information they choose to share.",
      "We reserve the right to remove content that:",
    ],
    items: ["Is abusive or harmful", "Violates community standards", "Contains illegal or inappropriate material"],
  },
  {
    number: 6,
    title: "Data Retention",
    icon: Clock,
    intro: "We retain personal data:",
    items: ["As long as your account remains active", "As required for legal or financial compliance"],
    note: "You may request deletion of your account and data at any time.",
  },
  {
    number: 7,
    title: "Your Rights",
    icon: UserCheck,
    intro: "You have the right to:",
    items: ["Access your data", "Correct inaccurate information", "Request account deletion", "Withdraw consent (where applicable)"],
    note: "To request data deletion, contact us at: contact@benedictionspartagees.org. We will respond within a reasonable timeframe.",
  },
  {
    number: 8,
    title: "Children's Privacy",
    icon: Baby,
    paragraphs: [
      "This app is not intended for children under 13 years of age. We do not knowingly collect personal data from children under 13.",
    ],
  },
  {
    number: 9,
    title: "International Users",
    icon: Globe,
    paragraphs: [
      "If you access the app outside the United States, your information may be transferred and processed in the U.S. or other countries where our service providers operate.",
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
  collected: ["Name", "Email", "User-generated content", "App activity", "Device information"],
  shared: ["With Stripe (payments)", "With Firebase/Supabase (hosting & authentication)"],
  dataIs: ["Encrypted in transit", "Not sold", "Users can request deletion"],
};

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-full" data-testid="page-privacy-policy">
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          <h1 className="font-serif text-2xl font-bold text-foreground" data-testid="text-privacy-title">
            Privacy Policy
          </h1>
        </div>
        <p className="text-muted-foreground mt-2" data-testid="text-privacy-org">
          Bénédictions Partagées
        </p>
        <p className="text-sm text-muted-foreground/70" data-testid="text-privacy-updated">
          Last Updated: February 27, 2026
        </p>
      </div>

      <div className="flex-1 px-5 pb-8 space-y-5">
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground leading-relaxed" data-testid="text-privacy-intro">
              Bénédictions Partagées ("BP," "we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our mobile application and services.
            </p>
          </CardContent>
        </Card>

        {sections.map((section) => (
          <Card key={section.number} data-testid={`section-privacy-${section.number}`}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                  <section.icon className="w-4 h-4 text-primary" />
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
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
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
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
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

        <Card data-testid="section-privacy-data-safety">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-serif font-semibold text-lg text-foreground">
                Google Play Data Safety Alignment
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-sm text-foreground mb-1">Collected:</h3>
                <ul className="space-y-1 ml-4">
                  {dataSafety.collected.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-sm text-foreground mb-1">Shared:</h3>
                <ul className="space-y-1 ml-4">
                  {dataSafety.shared.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-sm text-foreground mb-1">Data is:</h3>
                <ul className="space-y-1 ml-4">
                  {dataSafety.dataIs.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
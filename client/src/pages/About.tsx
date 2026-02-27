import {
  Heart, Music, BookOpen, HandHeart, Users, Sparkles,
  Shield, Award, Globe, ChevronRight, Play, MessageCircle
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/LanguageContext";
import logoImage from "@assets/Logo_company_logo_alphabet_logo_brand_logo_(1)_1766604339283.png";

const coreValues = [
  { icon: Heart, label: "Faith", desc: "Christ-centered in everything we do." },
  { icon: Shield, label: "Integrity", desc: "Honest, transparent, and responsible." },
  { icon: Users, label: "Unity", desc: "Bridging churches and believers together." },
  { icon: Award, label: "Excellence", desc: "Offering high-quality content that honors God." },
];

const features = [
  { icon: Music, title: "Gospel Music with Purpose", desc: "From Afrobeat to Kompa, worship to contemporary gospel — every song points to Jesus Christ and carries a message of hope and redemption." },
  { icon: BookOpen, title: "Daily Verse & Encouragement", desc: "A word for your day. A reminder that God is present, faithful, and working." },
  { icon: HandHeart, title: "Prayer Requests & Community Support", desc: "We believe in the power of collective prayer. Here, you can share your burden and know you are not alone." },
  { icon: MessageCircle, title: "Testimonies", desc: "Because when God moves, His works must be shared." },
];

const journeyItems = [
  "Driving to work",
  "Starting your morning devotion",
  "Going through a difficult season",
  "Celebrating a breakthrough",
];

const ministryGoals = [
  "A place of healing",
  "A source of strength",
  "A channel of revival",
];

const movementActions = [
  { icon: Play, label: "Worship with us" },
  { icon: HandHeart, label: "Pray with us" },
  { icon: MessageCircle, label: "Share your testimony" },
  { icon: Sparkles, label: "Grow with us" },
];

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-full">
      <section
        className="relative overflow-hidden"
        data-testid="section-about-hero"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1F44] via-[#0E2A55] to-[#132D5E] dark:from-[#060E22] dark:via-[#0A1833] dark:to-[#0E2040]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 max-w-3xl mx-auto px-5 py-12 md:py-20 text-center">
          <img
            src={logoImage}
            alt="Bénédictions Partagées"
            className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37]/50 shadow-lg mx-auto mb-4"
            loading="lazy"
            data-testid="img-about-logo"
          />
          <p className="text-[#D4AF37]/80 text-xs font-semibold uppercase tracking-widest mb-3" data-testid="text-about-tagline">
            {t("aboutUs") || "About Us"}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white leading-tight mb-3" data-testid="text-about-title">
            Bénédictions Partagées
          </h1>
          <p className="font-serif text-lg md:text-xl text-white/80 mb-4" data-testid="text-about-subtitle">
            A Movement of Faith, Music, and Unity
          </p>
          <p className="text-white/50 text-sm md:text-base leading-relaxed max-w-xl mx-auto" data-testid="text-about-intro">
            Bénédictions Partagées (BP) was born from a simple but powerful vision: to create a digital space where faith is strengthened, worship is alive, and believers are united.
          </p>
        </div>
      </section>

      <div className="flex-1 px-5 md:px-8 max-w-3xl mx-auto w-full space-y-8 py-8">
        <Card className="shadow-md" data-testid="card-about-vision">
          <CardContent className="p-6">
            <p className="text-muted-foreground leading-relaxed">
              In a world filled with noise, distraction, and uncertainty, we believe people are searching for something deeper — something eternal. BP exists to offer that connection through gospel music, daily encouragement, and the power of prayer.
            </p>
          </CardContent>
        </Card>

        <section data-testid="section-about-mission">
          <h2 className="font-serif font-bold text-2xl text-foreground mb-4" data-testid="text-mission-title">
            Our Mission
          </h2>
          <p className="text-muted-foreground mb-4">Our mission is to:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Music, text: "Spread the Gospel through music and media" },
              { icon: BookOpen, text: "Encourage believers with daily devotionals" },
              { icon: HandHeart, text: "Create a safe space for prayer and testimonies" },
              { icon: Users, text: "Unite churches and communities through digital ministry" },
            ].map((item, i) => (
              <Card key={i} className="shadow-sm" data-testid={`card-mission-item-${i}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-muted-foreground mt-4 text-sm italic">
            We believe technology is not just a tool for entertainment — it can be a vessel for transformation.
          </p>
        </section>

        <Separator />

        <section data-testid="section-about-why">
          <h2 className="font-serif font-bold text-2xl text-foreground mb-4" data-testid="text-why-title">
            Why We Created This App
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            Bénédictions Partagées was created to bring worship and encouragement directly into your daily life. Whether you are:
          </p>
          <ul className="space-y-2 mb-4">
            {journeyItems.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground" data-testid={`text-journey-item-${i}`}>
                <ChevronRight className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            BP is designed to walk with you. This is more than a streaming app. It is a spiritual companion.
          </p>
        </section>

        <Separator />

        <section data-testid="section-about-features">
          <h2 className="font-serif font-bold text-2xl text-foreground mb-4" data-testid="text-features-title">
            What You'll Find Inside
          </h2>
          <div className="space-y-3">
            {features.map((feature, i) => (
              <Card key={i} className="shadow-sm" data-testid={`card-feature-${i}`}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#0A1F44] dark:bg-[#132D5E] flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section data-testid="section-about-values">
          <h2 className="font-serif font-bold text-2xl text-foreground mb-4" data-testid="text-values-title">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coreValues.map((value, i) => (
              <Card key={i} className="shadow-sm" data-testid={`card-value-${i}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <value.icon className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{value.label}</h3>
                    <p className="text-xs text-muted-foreground">{value.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section data-testid="section-about-ministry">
          <h2 className="font-serif font-bold text-2xl text-foreground mb-4" data-testid="text-ministry-title">
            A Digital Ministry
          </h2>
          <Card className="shadow-md" data-testid="card-ministry">
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Bénédictions Partagées is not just an app — it is a digital ministry. We understand that today's generation lives online. Instead of competing with the digital world, we bring the light of Christ into it.
              </p>
              <p className="text-muted-foreground mb-3">Our prayer is that this platform becomes:</p>
              <ul className="space-y-2">
                {ministryGoals.map((goal, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground" data-testid={`text-ministry-goal-${i}`}>
                    <Globe className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                    {goal}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section data-testid="section-about-join">
          <h2 className="font-serif font-bold text-2xl text-foreground mb-4" data-testid="text-join-title">
            Join the Movement
          </h2>
          <p className="text-muted-foreground mb-4">We invite you to:</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {movementActions.map((action, i) => (
              <Card key={i} className="shadow-sm hover-elevate" data-testid={`card-action-${i}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0A1F44] dark:bg-[#132D5E] flex items-center justify-center flex-shrink-0">
                    <action.icon className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-br from-[#0A1F44] to-[#132D5E] border-0 shadow-lg" data-testid="card-closing-message">
            <CardContent className="p-6 text-center">
              <p className="font-serif text-white text-lg leading-relaxed italic" data-testid="text-closing-message">
                Together, we are building a community where blessings are not kept — they are shared.
              </p>
              <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
                <Link href="/music">
                  <Button className="bg-[#D4AF37] text-[#0A1F44] border-[#D4AF37] font-semibold" data-testid="button-about-listen">
                    <Play className="w-4 h-4 mr-2" />
                    {t("startListening") || "Start Listening"}
                  </Button>
                </Link>
                <Link href="/prayer">
                  <Button variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/5 font-semibold" data-testid="button-about-prayer">
                    <HandHeart className="w-4 h-4 mr-2" />
                    {t("submitAPrayer") || "Submit a Prayer"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

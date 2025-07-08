import Link from "next/link";
import { ArrowRight, Globe, Smartphone, Zap, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EsimExperienceSelector } from "@/components/esim-experience-selector";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-2">
              <Globe className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Hiilo</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with eSIM Selector */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            UNLIMITED INTERNET
            <span className="block text-primary">THAT TRAVELS WITH YOU</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience seamless connectivity with our global eSIM marketplace. 
            No more roaming charges, no more local SIM cards.
          </p>
        </div>

        {/* eSIM Selector - Centered */}
        <div className="flex justify-center mb-16">
          <EsimExperienceSelector />
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto">
          {/* Trust Indicators */}
          <div className="text-center mb-12">
            <p className="text-sm text-muted-foreground mb-4">Powered by 700+ telcos worldwide</p>
            <div className="flex justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-muted-foreground">Verizon</div>
              <div className="text-2xl font-bold text-muted-foreground">Orange</div>
              <div className="text-2xl font-bold text-muted-foreground">Vodafone</div>
              <div className="text-2xl font-bold text-muted-foreground">T-Mobile</div>
            </div>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-6 text-center">
              <div className="bg-primary/10 rounded-full p-4 w-fit mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Switchless™ Tech</h3>
              <p className="text-muted-foreground">
                One eSIM. 190+ countries. No extra steps.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="bg-primary/10 rounded-full p-4 w-fit mx-auto mb-4">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Unlimited Really Means Unlimited</h3>
              <p className="text-muted-foreground">
                No caps, no hidden fees. Just internet that&apos;s always on and always fast.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="bg-primary/10 rounded-full p-4 w-fit mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Set Up in 2 Minutes Flat</h3>
              <p className="text-muted-foreground">
                Just tap to activate. So easy, your gran can do it.
              </p>
            </Card>
          </div>

          {/* Value Propositions */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Touchdown Connected
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                                 You&apos;ve survived the long flight. Now, you just want to get online. But your phone says, &quot;No Service.&quot; 
                 The airport Wi-Fi is a joke. And buying a SIM? Prepare to waste precious time...
              </p>
              <p className="text-foreground font-semibold mb-4">
                <strong>Not with eSIM Go.</strong> The moment you land, you&rsquo;re connected. No SIMs, no searching, no waiting. 
                It&apos;s seamless & hassle-free!
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Instant activation upon landing</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span>No physical SIM cards needed</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Works in 190+ countries</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 text-primary-foreground">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-8 w-8" />
                <h3 className="text-2xl font-bold">Always Fast</h3>
              </div>
              <p className="text-primary-foreground/80 leading-relaxed">
                No bars? Never. Our 700+ network partnerships ensure your connection never skips a beat. 
                Enterprise-grade security with encrypted connections and trusted network partners worldwide.
              </p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">
              Not to brag, but... travelers love us 💌
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="text-accent mb-2">★★★★★</div>
                <p className="text-muted-foreground mb-4">
                  &quot;To be able to just step off the plane in Japan and be connected was fantastic. 
                  So much better than having to mess around with purchasing and inserting a SIM.&quot;
                </p>
                <p className="font-semibold">— Elsa J.</p>
              </Card>
              
              <Card className="p-6">
                <div className="text-accent mb-2">★★★★★</div>
                <p className="text-muted-foreground mb-4">
                  &quot;Truely eSIM is a game changer. I travel a lot and work online so I need great Internet connection all the time. 
                  As a digital nomad this is life-changing.&quot;
                </p>
                <p className="font-semibold">— Nicole V.</p>
              </Card>
              
              <Card className="p-6">
                <div className="text-accent mb-2">★★★★★</div>
                <p className="text-muted-foreground mb-4">
                  &quot;Great service and amazing support. You can contact them via WhatsApp, and the service/support is 
                  attentive, intelligent, and downright amazing.&quot;
                </p>
                <p className="font-semibold">— Ben A.</p>
              </Card>
            </div>
          </div>

          {/* Final CTA */}
          <div className="bg-card border rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-3xl font-bold text-card-foreground mb-4">
              DON&apos;T TAKE OUR WORD FOR IT, TRY eSIM GO TODAY
            </h2>
            <p className="text-muted-foreground mb-6">
              Best refund policy. No strings.
            </p>
            <Button size="lg">
              Let&apos;s Go
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t">
        <div className="text-center text-muted-foreground">
          <p>&copy; 2024 eSIM Go. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

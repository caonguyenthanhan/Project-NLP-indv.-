"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { FileText, Filter, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";

export default function HomePage() {
  const t = useTranslations("HomePage");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: t("features.textClassification.title"),
      description: t("features.textClassification.description"),
      href: "/text-classification"
    },
    {
      icon: <Filter className="h-8 w-8" />,
      title: t("features.nlpFiltering.title"),
      description: t("features.nlpFiltering.description"),
      href: "/nlp-filtering"
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: t("features.chatBox.title"),
      description: t("features.chatBox.description"),
      href: "/chat-box"
    }
  ];

  // Prevent hydration issues
  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">{t("hero.title")}</h1>
        <p className="text-xl text-muted-foreground mb-8">{t("hero.description")}</p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/text-classification">{t("hero.tryDemo")}</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="https://github.com/caonguyenthanhan/Project-NLP-indv.-" target="_blank">
              {t("hero.viewGithub")}
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">{t("features.title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex justify-center">{feature.icon}</div>
                <CardTitle className="text-xl text-center">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center mb-4">
                  {feature.description}
                </CardDescription>
                <div className="flex justify-center">
                  <Button asChild variant="outline">
                    <Link href={feature.href}>{t("features.tryNow")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">{t("about.title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>{t("about.whatIs.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("about.whatIs.description")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("about.benefits.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>{t("about.benefits.point1")}</li>
                <li>{t("about.benefits.point2")}</li>
                <li>{t("about.benefits.point3")}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">{t("cta.title")}</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              {t("cta.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" variant="secondary">
              <Link href="/text-classification">{t("cta.button")}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
} 
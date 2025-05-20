"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Question = {
  id: string;
  text: string;
  options: {
    value: string;
    label: string;
  }[];
};

const questions: Question[] = [
  {
    id: "experience",
    text: "How much experience do you have playing D&D?",
    options: [
      { value: "never", label: "Never" },
      { value: "beginner", label: "Once or twice" },
      { value: "experienced", label: "Play all the time" },
    ],
  },
  {
    id: "equipment",
    text: "Do you have a laptop or desktop with a microphone? (Bonus points for webcam)",
    options: [
      { value: "yes", label: "Yes, I have a laptop or desktop with a microphone" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "groupSize",
    text: "Would you like to bring some friends? How many people would you like to book for?",
    options: [
      { value: "1", label: "Just me" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
      { value: "5", label: "5" },
      { value: "6", label: "6" },
    ],
  },
];

export function OnboardingQuiz() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showRecommendations, setShowRecommendations] = useState(false);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    
    // Auto-advance to next question after a short delay
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        setShowRecommendations(true);
      }
    }, 500);
  };

  const getRecommendations = () => {
    const experience = answers.experience;
    const hasEquipment = answers.equipment === "yes";
    const groupSize = parseInt(answers.groupSize);

    let recommendations = [];

    if (experience === "never") {
      recommendations.push({
        title: "Beginner-Friendly Sessions",
        description: "Perfect for first-time players! These sessions include character creation and basic rules explanation.",
        link: "/sessions?experience=beginner",
      });
    }

    if (!hasEquipment) {
      recommendations.push({
        title: "In-Person Sessions",
        description: "No equipment needed! Find local game stores and community centers hosting D&D sessions.",
        link: "/sessions?type=in-person",
      });
    }

    if (groupSize > 1) {
      recommendations.push({
        title: "Group Sessions",
        description: `Great for groups of ${groupSize}! Find sessions that can accommodate your entire party.`,
        link: `/sessions?groupSize=${groupSize}`,
      });
    }

    // Always show these recommendations
    recommendations.push(
      {
        title: "All Available Sessions",
        description: "Browse all available D&D sessions in your area.",
        link: "/sessions",
      },
      {
        title: "Create an Account",
        description: "Sign up to book sessions and track your D&D adventures!",
        link: "/signup",
      }
    );

    return recommendations;
  };

  if (showRecommendations) {
    const recommendations = getRecommendations();
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-bold text-ink text-center mb-8">
          Recommended for You
        </h2>
        <div className="grid gap-4">
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-lg border-2 border-ink-light hover:border-forest/50 transition-all"
            >
              <h3 className="text-xl font-bold text-ink mb-2">{rec.title}</h3>
              <p className="text-ink-light mb-4">{rec.description}</p>
              <Link
                href={rec.link}
                className="fantasy-button inline-block px-6 py-2"
              >
                {rec.title.includes("Account") ? "Sign Up" : "View Sessions"}
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative min-h-[400px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-ink mb-4">
                {questions[currentStep].text}
              </h2>
              <div className="w-full max-w-md mx-auto h-1 bg-ink-light/20 rounded-full">
                <div
                  className="h-full bg-forest transition-all duration-300 rounded-full"
                  style={{
                    width: `${((currentStep + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid gap-4">
              {questions[currentStep].options.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => handleAnswer(questions[currentStep].id, option.value)}
                  className={`p-4 text-left rounded-lg border-2 transition-all ${
                    answers[questions[currentStep].id] === option.value
                      ? "border-forest bg-forest/10"
                      : "border-ink-light hover:border-forest/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Question = {
  id: string;
  text: string;
  options: {
    value: string;
    label: string;
    feedback?: string;
  }[];
};

const questions: Question[] = [
  {
    id: "experience",
    text: "How much experience do you have playing D&D?",
    options: [
      { 
        value: "never", 
        label: "Never",
        feedback: "Perfect! We have special sessions designed for first-time players."
      },
      { 
        value: "beginner", 
        label: "Once or twice",
        feedback: "Great! You'll fit right in with our beginner-friendly sessions."
      },
      { 
        value: "experienced", 
        label: "Play all the time",
        feedback: "Excellent! You'll find plenty of advanced sessions to join."
      },
    ],
  },
  {
    id: "equipment",
    text: "Do you have a laptop or desktop with a microphone? (Bonus points for webcam)",
    options: [
      { 
        value: "yes", 
        label: "Yes, I have a laptop or desktop with a microphone",
        feedback: "Perfect! You're all set for online D&D sessions."
      },
      { 
        value: "no", 
        label: "No",
        feedback: "No worries! We can help you find the right equipment or suggest alternatives."
      },
    ],
  },
  {
    id: "groupSize",
    text: "Would you like to bring some friends? How many people would you like to book for?",
    options: [
      { 
        value: "1", 
        label: "Just me",
        feedback: "Great! You'll find plenty of sessions with open spots for solo players."
      },
      { 
        value: "2", 
        label: "2",
        feedback: "Perfect! Many sessions are designed for small groups like yours."
      },
      { 
        value: "3", 
        label: "3",
        feedback: "Excellent! You'll find sessions that can accommodate your group."
      },
      { 
        value: "4", 
        label: "4",
        feedback: "Great! Many sessions are perfect for groups of four."
      },
      { 
        value: "5", 
        label: "5",
        feedback: "Perfect! You'll find sessions that can host your entire party."
      },
      { 
        value: "6", 
        label: "6",
        feedback: "Excellent! We have sessions that can accommodate larger groups."
      },
    ],
  },
];

export function OnboardingQuiz() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<string>("");

  const handleAnswer = (questionId: string, value: string, feedback?: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setSelectedFeedback(feedback || "");
    
    // Auto-advance to next question after a short delay
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep((prev) => prev + 1);
        setSelectedFeedback("");
      } else {
        setShowRecommendations(true);
      }
    }, 1500);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setSelectedFeedback("");
    }
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
        link: `/recommended-sessions?experienceLevel=Beginner${groupSize > 1 ? `&groupSize=${groupSize}` : ""}`,
      });
    }

    if (!hasEquipment) {
      recommendations.push({
        title: "In-Person Sessions",
        description: "No equipment needed! Find local game stores and community centers hosting D&D sessions.",
        link: `/recommended-sessions?type=in-person${groupSize > 1 ? `&groupSize=${groupSize}` : ""}`,
      });
    }

    if (groupSize > 1) {
      recommendations.push({
        title: "Group Sessions",
        description: `Great for groups of ${groupSize}! Find sessions that can accommodate your entire party.`,
        link: `/recommended-sessions?groupSize=${groupSize}`,
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
                  onClick={() => handleAnswer(questions[currentStep].id, option.value, option.feedback)}
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

            {selectedFeedback && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-ink-light italic"
              >
                {selectedFeedback}
              </motion.p>
            )}

            {currentStep > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleBack}
                className="flex items-center gap-2 text-ink-light hover:text-ink transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 
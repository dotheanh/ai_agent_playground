import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Brain, CheckCircle, Trophy, RotateCcw } from 'lucide-react';
import { api } from '../lib/api';

gsap.registerPlugin(ScrollTrigger);

interface Question {
  id: number;
  question: string;
  options: string[];
}

const AIQuiz = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; percentage: number; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await api.getQuizQuestions();
        setQuestions(data);
        setAnswers(new Array(data.length).fill(-1));
      } catch (err) {
        console.error('Failed to load questions:', err);
        setError('Unable to load quiz questions');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, []);

  // GSAP animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.quiz-card',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [currentIndex, showResult]);

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);

    const newAnswers = [...answers];
    newAnswers[currentIndex] = index;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(answers[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(answers[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = await api.submitQuiz(answers);
      setResult(data);
      setShowResult(true);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setError('Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers(new Array(questions.length).fill(-1));
    setSelectedAnswer(null);
    setShowResult(false);
    setResult(null);
    setError(null);

    // Reload questions
    api.getQuizQuestions().then((data) => {
      setQuestions(data);
      setAnswers(new Array(data.length).fill(-1));
    });
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Loading state
  if (loading && questions.length === 0) {
    return (
      <section id="quiz" className="py-20 bg-void-black">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-crimson/10 rounded-full mb-4">
            <Brain className="w-4 h-4 text-crimson animate-pulse" />
            <span className="font-mono text-xs text-crimson uppercase">Loading Quiz...</span>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error && questions.length === 0) {
    return (
      <section id="quiz" className="py-20 bg-void-black">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-red-400 font-mono">{error}</p>
        </div>
      </section>
    );
  }

  // Result screen
  if (showResult && result) {
    return (
      <section id="quiz" ref={containerRef} className="py-20 bg-void-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-void-dark/50 to-void-black" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-crimson/30 to-transparent" />

        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <div className="quiz-card text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-crimson/20 rounded-full flex items-center justify-center">
              <Trophy className="w-12 h-12 text-crimson" />
            </div>

            <h2 className="text-4xl font-bold text-white mb-2">Quiz Complete!</h2>
            <p className="text-crimson text-lg mb-8">{result.message}</p>

            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <p className="text-5xl font-bold text-white">{result.percentage}%</p>
                <p className="text-white/40 text-sm">Score</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-5xl font-bold text-white">
                  {result.score}/{result.total}
                </p>
                <p className="text-white/40 text-sm">Correct</p>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-8 py-3 bg-crimson text-white font-semibold rounded-full hover:bg-crimson-light transition-all duration-300 hover:shadow-glow-red"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <section id="quiz" ref={containerRef} className="py-20 bg-void-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-void-dark/50 to-void-black" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-crimson/30 to-transparent" />

      <div className="relative z-10 max-w-2xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-crimson/10 rounded-full mb-4">
            <Brain className="w-4 h-4 text-crimson" />
            <span className="font-mono text-xs text-crimson uppercase tracking-wider">AI Knowledge</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Test Your <span className="text-crimson">AI IQ</span>
          </h2>
          <p className="text-white/60">
            Challenge yourself with questions about Artificial Intelligence
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-white/40 text-sm mb-2">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-crimson transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="quiz-card bg-void-dark/50 border border-white/5 rounded-2xl p-6 md:p-8">
          <h3 className="text-xl md:text-2xl text-white font-semibold mb-6">
            {currentQuestion?.question}
          </h3>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={loading}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                  selectedAnswer === index
                    ? 'bg-crimson/20 border-crimson text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === index
                        ? 'border-crimson bg-crimson'
                        : 'border-white/20'
                    }`}
                  >
                    {selectedAnswer === index && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-6 py-2 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={loading || answers.includes(-1)}
                className="px-8 py-2 bg-crimson text-white font-semibold rounded-full hover:bg-crimson-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="px-8 py-2 bg-crimson text-white font-semibold rounded-full hover:bg-crimson-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIQuiz;

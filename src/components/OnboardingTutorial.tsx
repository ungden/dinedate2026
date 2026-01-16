'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Search,
  Shield,
  Rocket,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  CreditCard,
  MessageCircle,
  Sparkles,
  CheckCircle
} from 'lucide-react';

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  features?: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Chao mung den DineDate',
    subtitle: 'Tim nguoi dong hanh hoan hao',
    description: 'Nen tang ket noi ban voi nhung nguoi ban dong hanh tuyet voi cho moi bua an, cuoc hen hay chuyen di cua ban.',
    icon: (
      <div className="relative">
        <Heart className="w-20 h-20 text-white" strokeWidth={1.5} />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <Heart className="w-20 h-20 text-white/30" strokeWidth={1.5} />
        </motion.div>
      </div>
    ),
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    features: [
      'Hang ngan doi tac da xac minh',
      'An toan va bao mat',
      'Ho tro 24/7'
    ]
  },
  {
    id: 'discover',
    title: 'Tim Partner',
    subtitle: 'Kham pha & Dat lich',
    description: 'Duyet qua danh sach Partner da duoc xac minh. Xem ho so, danh gia tu nguoi dung khac va dat lich hen nhanh chong.',
    icon: (
      <div className="relative">
        <Search className="w-20 h-20 text-white" strokeWidth={1.5} />
        <motion.div
          className="absolute -right-2 -top-2"
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          <Users className="w-10 h-10 text-white/80" strokeWidth={1.5} />
        </motion.div>
      </div>
    ),
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    features: [
      'Loc theo vi tri, dich vu',
      'Xem danh gia thuc te',
      'Chat truc tiep voi Partner'
    ]
  },
  {
    id: 'escrow',
    title: 'Thanh toan an toan',
    subtitle: 'He thong Escrow bao ve ban',
    description: 'Tien cua ban duoc giu an toan trong he thong Escrow. Chi thanh toan cho Partner khi buoi hen hoan thanh tot dep.',
    icon: (
      <div className="relative">
        <Shield className="w-20 h-20 text-white" strokeWidth={1.5} />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <CreditCard className="w-10 h-10 text-white/70 mt-2" strokeWidth={1.5} />
        </motion.div>
      </div>
    ),
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    features: [
      'Tien duoc bao ve 100%',
      'Hoan tien neu co van de',
      'Thanh toan an toan qua app'
    ]
  },
  {
    id: 'start',
    title: 'Bat dau thoi!',
    subtitle: 'Hoan thanh ho so cua ban',
    description: 'Chi con mot buoc nua! Hoan thanh ho so de bat dau tim kiem va ket noi voi nhung nguoi ban dong hanh tuyet voi.',
    icon: (
      <div className="relative">
        <Rocket className="w-20 h-20 text-white" strokeWidth={1.5} />
        <motion.div
          className="absolute -right-4 -bottom-2"
          animate={{
            x: [0, 10, 0],
            y: [0, -10, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <Sparkles className="w-8 h-8 text-yellow-300" strokeWidth={1.5} />
        </motion.div>
      </div>
    ),
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    features: [
      'Them anh dai dien',
      'Viet gioi thieu ban than',
      'Xac minh so dien thoai'
    ]
  }
];

interface OnboardingTutorialProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTutorial({
  isOpen,
  onComplete,
  onSkip
}: OnboardingTutorialProps) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];

  // Swipe threshold
  const minSwipeDistance = 50;

  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index >= slides.length) return;
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    }
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  const handleComplete = useCallback(() => {
    onComplete();
    router.push('/profile/edit');
  }, [onComplete, router]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onSkip();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextSlide, prevSlide, onSkip]);

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Background gradient */}
        <motion.div
          className={cn(
            'absolute inset-0 bg-gradient-to-br transition-all duration-700',
            slide.gradient
          )}
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Skip button */}
        <motion.button
          className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
          onClick={onSkip}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-5 h-5 text-white" />
        </motion.button>

        {/* Main content */}
        <div
          className="relative h-full flex flex-col"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Slide content */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={slide.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.3 }
                }}
                className="w-full px-6 py-8 flex flex-col items-center text-center"
              >
                {/* Icon */}
                <motion.div
                  className="w-36 h-36 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8 shadow-2xl"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  {slide.icon}
                </motion.div>

                {/* Title */}
                <motion.h1
                  className="text-3xl sm:text-4xl font-bold text-white mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {slide.title}
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  className="text-lg sm:text-xl text-white/90 font-medium mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {slide.subtitle}
                </motion.p>

                {/* Description */}
                <motion.p
                  className="text-base text-white/80 max-w-sm leading-relaxed mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {slide.description}
                </motion.p>

                {/* Features */}
                {slide.features && (
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    {slide.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-3 text-white/90"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                      >
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm sm:text-base">{feature}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom navigation */}
          <div className="pb-10 px-6">
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-8">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    index === currentSlide
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/40 hover:bg-white/60'
                  )}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between max-w-md mx-auto">
              {/* Previous button */}
              <motion.button
                className={cn(
                  'p-3 rounded-full transition-all',
                  currentSlide > 0
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'opacity-0 pointer-events-none'
                )}
                onClick={prevSlide}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>

              {/* Next / Complete button */}
              <motion.button
                className={cn(
                  'px-8 py-4 rounded-2xl font-bold text-base sm:text-lg transition-all shadow-xl',
                  isLastSlide
                    ? 'bg-white text-gray-900 hover:bg-white/90'
                    : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                )}
                onClick={isLastSlide ? handleComplete : nextSlide}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLastSlide ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Hoan thanh ho so
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Tiep tuc
                    <ChevronRight className="w-5 h-5" />
                  </span>
                )}
              </motion.button>

              {/* Spacer for alignment */}
              <div className={cn(
                'p-3 rounded-full',
                currentSlide > 0 ? 'opacity-0' : 'opacity-0'
              )}>
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>

            {/* Skip text */}
            <motion.p
              className="text-center text-white/60 text-sm mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Vuot trai/phai de chuyen trang
            </motion.p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

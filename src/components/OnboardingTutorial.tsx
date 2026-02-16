'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Heart,
  UtensilsCrossed,
  Shield,
  Rocket,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  Sparkles,
  CheckCircle,
  Star,
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
    title: 'Chào mừng đến DineDate!',
    subtitle: 'Hẹn hò ẩn danh x Khám phá ẩm thực',
    description: 'DineDate là nền tảng hẹn hò ẩn danh qua ẩm thực. Bạn không biết đối phương là ai cho đến khi gặp mặt tại nhà hàng. Hoàn toàn bất ngờ và thú vị!',
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
      'Hẹn hò ẩn danh - không lộ mặt trước',
      'Gặp mặt tại nhà hàng chất lượng',
      'An toàn và bảo mật tuyệt đối',
    ],
  },
  {
    id: 'restaurant',
    title: 'Chọn nhà hàng & combo',
    subtitle: 'Ẩm thực tuyệt vời cho buổi hẹn',
    description: 'Duyệt qua các nhà hàng đối tác của DineDate. Chọn combo bữa ăn cho 2 người với giá đã bao gồm. Không cần lo về giá hay thực đơn!',
    icon: (
      <div className="relative">
        <UtensilsCrossed className="w-20 h-20 text-white" strokeWidth={1.5} />
        <motion.div
          className="absolute -right-2 -top-2"
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          <Star className="w-10 h-10 text-white/80" strokeWidth={1.5} />
        </motion.div>
      </div>
    ),
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    features: [
      'Nhà hàng đối tác đã xác minh',
      'Combo set menu cho 2 người',
      'Giá minh bạch, không phụ thu',
    ],
  },
  {
    id: 'dateorder',
    title: 'Tạo hoặc ứng tuyển Date Order',
    subtitle: 'Tìm người ăn cùng chỉ trong vài phút',
    description: 'Tạo Date Order để mời ai đó đi ăn, hoặc ứng tuyển vào Date Order của người khác. Khi được chọn, bạn sẽ gặp mặt tại nhà hàng mà không biết trước đối phương.',
    icon: (
      <div className="relative">
        <Users className="w-20 h-20 text-white" strokeWidth={1.5} />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <Shield className="w-10 h-10 text-white/70 mt-2" strokeWidth={1.5} />
        </motion.div>
      </div>
    ),
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    features: [
      'Tạo Date Order trong 1 phút',
      'Chọn chia đôi hoặc mời đối phương',
      'Hệ thống thanh toán escrow an toàn',
    ],
  },
  {
    id: 'meet',
    title: 'Gặp mặt & đánh giá',
    subtitle: 'Trải nghiệm hẹn hò ẩn danh độc đáo',
    description: 'Đến nhà hàng, gặp đối phương và tận hưởng bữa ăn. Sau buổi hẹn, hai bên đánh giá lẫn nhau. Nếu cả hai đều thích, bạn sẽ kết nối và xem được ảnh thật!',
    icon: (
      <div className="relative">
        <Rocket className="w-20 h-20 text-white" strokeWidth={1.5} />
        <motion.div
          className="absolute -right-4 -bottom-2"
          animate={{
            x: [0, 10, 0],
            y: [0, -10, 0],
            rotate: [0, 10, 0],
          }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <Sparkles className="w-8 h-8 text-yellow-300" strokeWidth={1.5} />
        </motion.div>
      </div>
    ),
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    features: [
      'Gặp mặt tại nhà hàng an toàn',
      'Đánh giá sau buổi hẹn',
      'Kết nối nếu cả hai thích nhau',
    ],
  },
];

interface OnboardingTutorialProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTutorial({
  isOpen,
  onComplete,
  onSkip,
}: OnboardingTutorialProps) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];

  const minSwipeDistance = 50;

  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= slides.length) return;
      setDirection(index > currentSlide ? 1 : -1);
      setCurrentSlide(index);
    },
    [currentSlide]
  );

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
    if (isLeftSwipe) nextSlide();
    else if (isRightSwipe) prevSlide();
  };

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

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
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

        <div
          className="relative h-full flex flex-col"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
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
                  opacity: { duration: 0.3 },
                }}
                className="w-full px-6 py-8 flex flex-col items-center text-center"
              >
                <motion.div
                  className="w-36 h-36 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8 shadow-2xl"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  {slide.icon}
                </motion.div>

                <motion.h1
                  className="text-3xl sm:text-4xl font-bold text-white mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {slide.title}
                </motion.h1>

                <motion.p
                  className="text-lg sm:text-xl text-white/90 font-medium mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {slide.subtitle}
                </motion.p>

                <motion.p
                  className="text-base text-white/80 max-w-sm leading-relaxed mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {slide.description}
                </motion.p>

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

          <div className="pb-10 px-6">
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

            <div className="flex items-center justify-between max-w-md mx-auto">
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
                    Bắt đầu khám phá
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Tiếp tục
                    <ChevronRight className="w-5 h-5" />
                  </span>
                )}
              </motion.button>

              <div
                className={cn(
                  'p-3 rounded-full',
                  currentSlide > 0 ? 'opacity-0' : 'opacity-0'
                )}
              >
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>

            <motion.p
              className="text-center text-white/60 text-sm mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Vuốt trái/phải để chuyển trang
            </motion.p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

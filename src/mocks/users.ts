import { User } from '@/types';

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Minh Anh',
    age: 25,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=533&fit=crop&crop=face',
    bio: 'Yêu thích khám phá ẩm thực và du lịch. Mình là người vui vẻ, biết lắng nghe và thích những cuộc trò chuyện thú vị! 💕',
    location: 'Quận 1, TP.HCM',
    coordinates: { latitude: 10.7769, longitude: 106.7009 },
    onlineStatus: { isOnline: true, lastSeen: new Date().toISOString() },
    isServiceProvider: true,
    wallet: { balance: 2500000, escrowBalance: 0, currency: 'VND' },
    vipStatus: {
      tier: 'svip',
      expiryDate: '2025-12-31',
      benefits: ['Unlimited bookings', 'Priority support', 'Featured profile', '20% discount']
    },
    images: [
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop'
    ],
    phone: '0901234567',
    gender: 'female',
    height: 165,
    birthYear: 1999,
    zodiac: 'libra',
    personalityTags: ['fun', 'listener', 'extrovert', 'friendly'],
    restrictions: ['Không nhận đi bar sau 23h', 'Không uống rượu mạnh'],
    voiceIntroUrl: '/audio/voice-intro-1.mp3',
    hourlyRate: 300000,
    availableNow: true,
    availableTonight: true,
    occupation: 'Marketing Specialist',
    rating: 4.9,
    reviewCount: 128,
    services: [
      { id: 's1', activity: 'dining', title: 'Đi ăn tối', description: 'Cùng bạn khám phá ẩm thực', price: 300000, available: true, duration: 'session' },
      { id: 's2', activity: 'cafe', title: 'Cafe date', description: 'Trò chuyện tại quán cafe', price: 200000, available: true, duration: 'session' },
      { id: 's3', activity: 'movies', title: 'Xem phim', description: 'Đi xem phim cùng nhau', price: 250000, available: true, duration: 'session' }
    ]
  },
  {
    id: '2',
    name: 'Tuấn Kiệt',
    age: 28,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=533&fit=crop&crop=face',
    bio: 'Thích xem phim và cafe chill. Mình biết nhiều quán cafe đẹp và phim hay nè! 🎬☕',
    location: 'Quận 3, TP.HCM',
    coordinates: { latitude: 10.7867, longitude: 106.6837 },
    onlineStatus: { isOnline: false, lastSeen: '2025-01-10T08:30:00Z' },
    isServiceProvider: true,
    wallet: { balance: 1800000, escrowBalance: 0, currency: 'VND' },
    vipStatus: {
      tier: 'vip',
      expiryDate: '2025-06-30',
      benefits: ['Priority listing', '10% discount', 'Verified badge']
    },
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop'
    ],
    phone: '0912345678',
    gender: 'male',
    height: 175,
    birthYear: 1996,
    zodiac: 'leo',
    personalityTags: ['humorous', 'intellectual', 'introvert'],
    restrictions: ['Không đi xa quá 10km'],
    hourlyRate: 250000,
    availableNow: false,
    availableTonight: true,
    occupation: 'Software Developer',
    rating: 4.7,
    reviewCount: 89,
    services: [
      { id: 's3', activity: 'movies', title: 'Xem phim', description: 'Đi xem phim, tư vấn phim hay', price: 250000, available: true, duration: 'session' },
      { id: 's4', activity: 'cafe', title: 'Cafe chill', description: 'Uống cafe và trò chuyện', price: 200000, available: true, duration: 'session' }
    ]
  },
  {
    id: '3',
    name: 'Thanh Hương',
    age: 24,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=533&fit=crop&crop=face',
    bio: 'Foodie và travel lover 🍜✈️ Mình có thể dẫn bạn đi ăn những món ngon nhất Sài Gòn!',
    location: 'Quận 7, TP.HCM',
    coordinates: { latitude: 10.7340, longitude: 106.7216 },
    onlineStatus: { isOnline: true, lastSeen: new Date().toISOString() },
    isServiceProvider: true,
    wallet: { balance: 950000, escrowBalance: 0, currency: 'VND' },
    vipStatus: {
      tier: 'vip',
      expiryDate: '2025-03-31',
      benefits: ['Verified badge', '5% discount']
    },
    images: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop'
    ],
    phone: '0923456789',
    gender: 'female',
    height: 160,
    birthYear: 2000,
    zodiac: 'pisces',
    personalityTags: ['adventurous', 'friendly', 'fun'],
    restrictions: ['Không nhận đi bar', 'Chỉ đi vào ban ngày'],
    voiceIntroUrl: '/audio/voice-intro-3.mp3',
    hourlyRate: 200000,
    availableNow: true,
    availableTonight: false,
    occupation: 'Food Blogger',
    rating: 4.8,
    reviewCount: 156,
    services: [
      { id: 's5', activity: 'dining', title: 'Food tour Sài Gòn', description: 'Khám phá ẩm thực đường phố', price: 200000, available: true, duration: 'session' },
      { id: 's6', activity: 'tour_guide', title: 'City tour', description: 'Dẫn bạn đi tham quan', price: 350000, available: true, duration: 'session' }
    ]
  },
  {
    id: '4',
    name: 'Đức Minh',
    age: 26,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=533&fit=crop&crop=face',
    bio: 'Thích khám phá những địa điểm mới và kết bạn 🌟',
    location: 'Quận 2, TP.HCM',
    coordinates: { latitude: 10.7866, longitude: 106.7504 },
    onlineStatus: { isOnline: false, lastSeen: '2025-01-09T20:15:00Z' },
    isServiceProvider: false,
    wallet: { balance: 500000, escrowBalance: 0, currency: 'VND' },
    vipStatus: { tier: 'free', benefits: [] },
    images: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop'],
    gender: 'male',
    height: 178,
    birthYear: 1998,
    zodiac: 'taurus'
  },
  {
    id: '5',
    name: 'Ngọc Trinh',
    age: 23,
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=533&fit=crop&crop=face',
    bio: 'Mình thích cafe và âm nhạc 🎵 Có thể ngồi nói chuyện hàng giờ!',
    location: 'Quận Bình Thạnh, TP.HCM',
    coordinates: { latitude: 10.8018, longitude: 106.7093 },
    onlineStatus: { isOnline: true, lastSeen: new Date().toISOString() },
    isServiceProvider: true,
    wallet: { balance: 1200000, escrowBalance: 0, currency: 'VND' },
    vipStatus: {
      tier: 'vip',
      expiryDate: '2025-08-15',
      benefits: ['Priority listing', '10% discount', 'Verified badge']
    },
    images: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop'
    ],
    phone: '0934567890',
    gender: 'female',
    height: 162,
    birthYear: 2001,
    zodiac: 'gemini',
    personalityTags: ['listener', 'caring', 'romantic'],
    restrictions: ['Không uống bia rượu'],
    voiceIntroUrl: '/audio/voice-intro-5.mp3',
    hourlyRate: 280000,
    availableNow: true,
    availableTonight: true,
    occupation: 'University Student',
    rating: 4.6,
    reviewCount: 67,
    services: [
      { id: 's6', activity: 'cafe', title: 'Cafe date', description: 'Đi cafe, trò chuyện thư giãn', price: 180000, available: true, duration: 'session' },
      { id: 's7', activity: 'karaoke', title: 'Karaoke night', description: 'Đi hát karaoke cùng nhau', price: 300000, available: true, duration: 'session' }
    ]
  },
  {
    id: '6',
    name: 'Hoàng Nam',
    age: 27,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=533&fit=crop&crop=face',
    bio: 'Yêu thích phim ảnh và du lịch 📽️ Có thể đưa bạn đến những địa điểm sống ảo cực đẹp!',
    location: 'Quận Phú Nhuận, TP.HCM',
    coordinates: { latitude: 10.7995, longitude: 106.6822 },
    onlineStatus: { isOnline: true, lastSeen: new Date().toISOString() },
    isServiceProvider: true,
    wallet: { balance: 800000, escrowBalance: 0, currency: 'VND' },
    vipStatus: {
      tier: 'vip',
      expiryDate: '2025-05-20',
      benefits: ['Verified badge', '5% discount']
    },
    images: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop'
    ],
    phone: '0945678901',
    gender: 'male',
    height: 180,
    birthYear: 1997,
    zodiac: 'scorpio',
    personalityTags: ['creative', 'adventurous', 'humorous'],
    restrictions: [],
    hourlyRate: 320000,
    availableNow: true,
    availableTonight: true,
    occupation: 'Photographer',
    rating: 4.8,
    reviewCount: 112,
    services: [
      { id: 's7', activity: 'movies', title: 'Movie night', description: 'Đi xem phim cuối tuần', price: 280000, available: true, duration: 'session' },
      { id: 's8', activity: 'tour_guide', title: 'Photo tour', description: 'Dẫn đi chụp ảnh đẹp', price: 400000, available: true, duration: 'session' },
      { id: 's9', activity: 'drinking', title: 'Bar hopping', description: 'Khám phá bar chill', price: 350000, available: true, duration: 'session' }
    ]
  },
  {
    id: '7',
    name: 'Kim Ngân',
    age: 22,
    avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=533&fit=crop&crop=face',
    bio: 'Sinh viên năm cuối, thích làm quen bạn mới và khám phá ẩm thực 🍕',
    location: 'Quận 1, TP.HCM',
    coordinates: { latitude: 10.7756, longitude: 106.7019 },
    onlineStatus: { isOnline: true, lastSeen: new Date().toISOString() },
    isServiceProvider: true,
    wallet: { balance: 650000, escrowBalance: 0, currency: 'VND' },
    vipStatus: { tier: 'free', benefits: [] },
    images: [
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop'
    ],
    phone: '0956789012',
    gender: 'female',
    height: 158,
    birthYear: 2002,
    zodiac: 'aries',
    personalityTags: ['fun', 'extrovert', 'sporty'],
    restrictions: ['Không đi sau 22h'],
    hourlyRate: 150000,
    availableNow: true,
    availableTonight: false,
    occupation: 'Student',
    rating: 4.5,
    reviewCount: 34,
    services: [
      { id: 's10', activity: 'cafe', title: 'Study date', description: 'Cùng học bài tại cafe', price: 120000, available: true, duration: 'session' },
      { id: 's11', activity: 'dining', title: 'Lunch buddy', description: 'Cùng đi ăn trưa', price: 150000, available: true, duration: 'session' }
    ]
  },
  {
    id: '8',
    name: 'Quốc Bảo',
    age: 30,
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=533&fit=crop&crop=face',
    bio: 'Doanh nhân trẻ, đam mê golf và fine dining 🏌️ Sẵn sàng chiều bạn những trải nghiệm cao cấp!',
    location: 'Quận 2, TP.HCM',
    coordinates: { latitude: 10.7889, longitude: 106.7520 },
    onlineStatus: { isOnline: false, lastSeen: '2025-01-10T12:00:00Z' },
    isServiceProvider: true,
    wallet: { balance: 5000000, escrowBalance: 0, currency: 'VND' },
    vipStatus: {
      tier: 'svip',
      expiryDate: '2026-12-31',
      benefits: ['VIP experience', 'Personal concierge', 'Exclusive events', 'Max discount']
    },
    images: [
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop'
    ],
    phone: '0967890123',
    gender: 'male',
    height: 182,
    birthYear: 1994,
    zodiac: 'capricorn',
    personalityTags: ['intellectual', 'romantic', 'caring'],
    restrictions: [],
    hourlyRate: 500000,
    availableNow: false,
    availableTonight: true,
    occupation: 'Entrepreneur',
    rating: 4.9,
    reviewCount: 45,
    services: [
      { id: 's12', activity: 'dining', title: 'Fine dining', description: 'Trải nghiệm nhà hàng cao cấp', price: 500000, available: true, duration: 'session' },
      { id: 's13', activity: 'drinking', title: 'Wine tasting', description: 'Thưởng thức rượu vang', price: 600000, available: true, duration: 'session' }
    ]
  }
];

export const CURRENT_USER: User = {
  id: 'current',
  name: 'Bạn',
  age: 25,
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face',
  bio: 'Tìm kiếm những trải nghiệm thú vị',
  location: 'Quận 1, TP.HCM',
  coordinates: { latitude: 10.7769, longitude: 106.7009 },
  onlineStatus: { isOnline: true, lastSeen: new Date().toISOString() },
  wallet: { balance: 1500000, escrowBalance: 0, currency: 'VND' },
  vipStatus: { tier: 'free', benefits: [] },
  images: ['https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&h=800&fit=crop'],
  gender: 'male',
  birthYear: 1999
};
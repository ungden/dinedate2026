import { Review } from '@/types';
import { MOCK_USERS, CURRENT_USER } from './users';

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    userId: 'current',
    reviewerId: '1',
    revieweeId: 'current',
    reviewer: MOCK_USERS[0],
    rating: 5,
    comment: 'Người hòa đồng, vui vẻ, dễ trò chuyện. Rất vui khi được đi chơi cùng!',
    dateRequestId: '1',
    createdAt: '2025-01-05T10:00:00Z'
  },
  {
    id: 'r2',
    userId: 'current',
    reviewerId: '2',
    revieweeId: 'current',
    reviewer: MOCK_USERS[1],
    rating: 5,
    comment: 'Đúng giờ, lịch sự và nhiệt tình. Buổi xem phim rất vui!',
    dateRequestId: '2',
    createdAt: '2025-01-03T15:30:00Z'
  },
  {
    id: 'r3',
    userId: 'current',
    reviewerId: '3',
    revieweeId: 'current',
    reviewer: MOCK_USERS[2],
    rating: 4,
    comment: 'Trải nghiệm tốt, thân thiện và có gu ăn uống tuyệt vời!',
    createdAt: '2025-01-02T12:00:00Z'
  },
  {
    id: 'r4',
    userId: '1',
    reviewerId: 'current',
    revieweeId: '1',
    reviewer: CURRENT_USER,
    rating: 5,
    comment: 'Rất vui và nhiệt tình, mình rất thích!',
    dateRequestId: '1',
    createdAt: '2025-01-06T10:00:00Z'
  },
  {
    id: 'r5',
    userId: '2',
    reviewerId: 'current',
    revieweeId: '2',
    reviewer: CURRENT_USER,
    rating: 5,
    comment: 'Người tốt, thân thiện và vui tính!',
    createdAt: '2025-01-04T16:00:00Z'
  }
];

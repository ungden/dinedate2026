'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DateRequest,
  Application,
  ActivityType,
  User,
  Notification,
  Conversation,
  Message,
  Review,
  ServiceBooking,
  ServiceOffering,
  Transaction,
  PaymentMethod,
  VIPTier,
} from '@/types';
import { MOCK_DATE_REQUESTS } from '@/mocks/dateRequests';
import { CURRENT_USER, MOCK_USERS } from '@/mocks/users';
import { MOCK_REVIEWS } from '@/mocks/reviews';

const REQUEST_TTL_MINUTES = 15;

const addMinutesIso = (minutes: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
};

const isExpired = (expiresAt?: string) => {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
};

interface DateStore {
  // State
  dateRequests: DateRequest[];
  applications: Application[];
  currentUser: User;
  users: User[];
  bookings: ServiceBooking[];
  notifications: Notification[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  reviews: Review[];
  transactions: Transaction[];
  isLoaded: boolean;

  // New: Sync from Auth
  setCurrentUserFromAuth: (user: User) => void;

  // Actions - Date Requests
  createDateRequest: (
    request: Omit<
      DateRequest,
      | 'id'
      | 'userId'
      | 'user'
      | 'currentParticipants'
      | 'applicants'
      | 'status'
      | 'createdAt'
      | 'expiresAt'
    >
  ) => DateRequest;
  deleteRequest: (requestId: string) => void;
  updateRequest: (requestId: string, updates: Partial<DateRequest>) => void;
  applyToRequest: (requestId: string, message: string) => void;
  selectApplicant: (requestId: string, applicantUserId: string) => void;
  expireRequestsIfNeeded: () => void;

  getRequestsByActivity: (activity?: ActivityType) => DateRequest[];
  getMyRequests: () => DateRequest[];
  getMyApplications: () => Application[];
  getApplicationsForRequest: (requestId: string) => Application[];
  acceptApplication: (applicationId: string) => void;
  rejectApplication: (applicationId: string) => void;

  // Actions - User
  updateProfile: (updates: Partial<User>) => void;
  getAllUsers: () => User[];
  getUserById: (userId: string) => User | undefined;

  // Actions - Messages
  sendMessage: (conversationId: string, text: string) => void;
  getMyConversations: () => Conversation[];
  getMessages: (conversationId: string) => Message[];

  // New: strict 1-1 conversation helper
  getOrCreateConversationWithUser: (otherUserId: string) => string | null;

  // Actions - Notifications
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  getMyNotifications: () => Notification[];

  // Actions - Reviews
  getUserReviews: (userId: string) => Review[];
  getUserAverageRating: (userId: string) => number;
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => Review;

  // Actions - Bookings
  createBooking: (
    providerId: string,
    serviceId: string,
    date: string,
    time: string,
    location: string,
    message: string
  ) => ServiceBooking | undefined;
  acceptBooking: (bookingId: string) => void;
  rejectBooking: (bookingId: string) => void;
  getMyBookings: () => ServiceBooking[];
  getReceivedBookings: () => ServiceBooking[];

  // Actions - Services
  addServiceToProfile: (service: Omit<ServiceOffering, 'id'>) => ServiceOffering;
  updateService: (serviceId: string, updates: Partial<ServiceOffering>) => void;
  removeService: (serviceId: string) => void;

  // Actions - Wallet
  topUpWallet: (amount: number, method: PaymentMethod) => Transaction;
  
  // NOTE: Purchase VIP is removed as it's now spending-based
  // purchaseVIP: (tier: VIPTier) => Transaction | null;
  
  payForBooking: (bookingId: string) => Transaction | null;
  getMyTransactions: () => Transaction[];
  // getVIPPrice: (tier: VIPTier) => number;
}

export const useDateStore = create<DateStore>()(
  persist(
    (set, get) => ({
      // Initial State
      dateRequests: MOCK_DATE_REQUESTS,
      applications: [],
      currentUser: CURRENT_USER,
      users: MOCK_USERS,
      bookings: [],
      notifications: [],
      conversations: [],
      messages: {},
      reviews: MOCK_REVIEWS,
      transactions: [],
      isLoaded: true,

      setCurrentUserFromAuth: (user) => {
        set((state) => {
          // Deep-merge wallet + vipStatus so numbers from DB overwrite persisted mock values.
          const nextCurrentUser: User = {
            ...state.currentUser,
            ...user,
            wallet: {
              ...state.currentUser.wallet,
              ...user.wallet,
            },
            vipStatus: {
              ...state.currentUser.vipStatus,
              ...user.vipStatus,
            },
            // Keep images if Auth user has it, else fallback to existing
            images: user.images ?? state.currentUser.images,
          };

          const nextUsers = state.users.map((u) => {
            if (u.id !== user.id) return u;
            return {
              ...u,
              ...user,
              wallet: {
                ...u.wallet,
                ...user.wallet,
              },
              vipStatus: {
                ...u.vipStatus,
                ...user.vipStatus,
              },
              images: user.images ?? u.images,
            };
          });

          return {
            currentUser: nextCurrentUser,
            users: nextUsers,
          };
        });
      },

      expireRequestsIfNeeded: () => {
        const { dateRequests } = get();
        const now = Date.now();

        const hasAnyToExpire = dateRequests.some(
          (r) =>
            r.status === 'active' &&
            r.expiresAt &&
            new Date(r.expiresAt).getTime() <= now
        );

        if (!hasAnyToExpire) return;

        set((state) => ({
          dateRequests: state.dateRequests.map((r) => {
            if (r.status !== 'active') return r;
            if (!r.expiresAt) return r;
            if (new Date(r.expiresAt).getTime() > now) return r;
            return { ...r, status: 'expired' as const };
          }),
        }));
      },

      // Date Request Actions
      createDateRequest: (request) => {
        const { currentUser } = get();

        const newRequest: DateRequest = {
          ...request,
          id: Date.now().toString(),
          userId: currentUser.id,
          user: currentUser,
          currentParticipants: 1,
          applicants: [],
          status: 'active',
          createdAt: new Date().toISOString(),
          expiresAt: addMinutesIso(REQUEST_TTL_MINUTES),
        };

        set((state) => ({
          dateRequests: [newRequest, ...state.dateRequests],
        }));

        return newRequest;
      },

      deleteRequest: (requestId) => {
        set((state) => ({
          dateRequests: state.dateRequests.filter((r) => r.id !== requestId),
          applications: state.applications.filter((app) => app.requestId !== requestId),
        }));
      },

      updateRequest: (requestId, updates) => {
        set((state) => ({
          dateRequests: state.dateRequests.map((r) =>
            r.id === requestId ? { ...r, ...updates } : r
          ),
        }));
      },

      applyToRequest: (requestId, message) => {
        const { dateRequests, currentUser } = get();
        const request = dateRequests.find((r) => r.id === requestId);
        if (!request) return;

        // Disallow apply to non-active/expired/matched requests
        if (request.status !== 'active') return;
        if (isExpired(request.expiresAt)) {
          set((state) => ({
            dateRequests: state.dateRequests.map((r) =>
              r.id === requestId ? { ...r, status: 'expired' as const } : r
            ),
          }));
          return;
        }

        // Prevent duplicate apply
        const alreadyApplied = request.applicants.some((u) => u.id === currentUser.id);
        if (alreadyApplied) return;

        const application: Application = {
          id: Date.now().toString(),
          requestId,
          userId: currentUser.id,
          user: currentUser,
          message,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        const notification: Notification = {
          id: Date.now().toString(),
          userId: request.userId,
          type: 'application',
          title: 'Có người muốn đi cùng bạn',
          message: `${currentUser.name} muốn tham gia "${request.title}"`,
          data: { requestId, applicationId: application.id },
          read: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          applications: [...state.applications, application],
          dateRequests: state.dateRequests.map((req) =>
            req.id === requestId
              ? { ...req, applicants: [...req.applicants, currentUser] }
              : req
          ),
          notifications: [notification, ...state.notifications],
        }));
      },

      selectApplicant: (requestId, applicantUserId) => {
        const { dateRequests, currentUser, conversations, users } = get();
        const request = dateRequests.find((r) => r.id === requestId);
        if (!request) return;

        if (request.userId !== currentUser.id) return;
        if (request.status !== 'active') return;

        if (isExpired(request.expiresAt)) {
          set((state) => ({
            dateRequests: state.dateRequests.map((r) =>
              r.id === requestId ? { ...r, status: 'expired' as const } : r
            ),
          }));
          return;
        }

        const applicant =
          request.applicants.find((u) => u.id === applicantUserId) ||
          users.find((u) => u.id === applicantUserId);

        if (!applicant) return;

        const existingConversation = conversations.find(
          (c) =>
            c.participants.some((p) => p.id === applicant.id) &&
            c.participants.some((p) => p.id === currentUser.id)
        );

        const newConversation: Conversation | null = existingConversation
          ? null
          : {
              id: Date.now().toString(),
              participants: [currentUser, applicant],
              updatedAt: new Date().toISOString(),
            };

        const notification: Notification = {
          id: Date.now().toString(),
          userId: applicant.id,
          type: 'accepted',
          title: 'Bạn đã được chọn',
          message: `${currentUser.name} đã chọn bạn cho "${request.title}". Hai bạn đã match!`,
          data: { requestId, conversationId: newConversation?.id || existingConversation?.id },
          read: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          dateRequests: state.dateRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'matched' as const } : r
          ),
          applications: state.applications.map((app) => {
            if (app.requestId !== requestId) return app;
            if (app.userId === applicant.id) return { ...app, status: 'accepted' as const };
            return { ...app, status: 'rejected' as const };
          }),
          conversations: newConversation
            ? [newConversation, ...state.conversations]
            : state.conversations.map((c) =>
                c.id === existingConversation?.id
                  ? { ...c, updatedAt: new Date().toISOString() }
                  : c
              ),
          notifications: [notification, ...state.notifications],
        }));
      },

      getRequestsByActivity: (activity) => {
        const { dateRequests } = get();
        if (!activity) return dateRequests;
        return dateRequests.filter((request) => request.activity === activity);
      },

      getMyRequests: () => {
        const { dateRequests, currentUser } = get();
        return dateRequests.filter((request) => request.userId === currentUser.id);
      },

      getMyApplications: () => {
        const { applications, currentUser } = get();
        return applications.filter((app) => app.userId === currentUser.id);
      },

      getApplicationsForRequest: (requestId) => {
        const { applications } = get();
        return applications.filter((app) => app.requestId === requestId);
      },

      acceptApplication: (applicationId) => {
        const { applications, dateRequests, currentUser, conversations } = get();
        const application = applications.find((a) => a.id === applicationId);
        if (!application) return;

        const request = dateRequests.find((r) => r.id === application.requestId);

        const notification: Notification = {
          id: Date.now().toString(),
          userId: application.userId,
          type: 'accepted',
          title: 'Ứng tuyển được chấp nhận',
          message: `${currentUser.name} đã chấp nhận ứng tuyển của bạn cho "${request?.title}"`,
          data: { requestId: request?.id, applicationId },
          read: false,
          createdAt: new Date().toISOString(),
        };

        const existingConversation = conversations.find(
          (c) =>
            c.participants.some((p) => p.id === application.userId) &&
            c.participants.some((p) => p.id === currentUser.id)
        );

        const newConversation: Conversation | null = existingConversation
          ? null
          : {
              id: Date.now().toString(),
              participants: [currentUser, application.user],
              updatedAt: new Date().toISOString(),
            };

        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === applicationId ? { ...app, status: 'accepted' as const } : app
          ),
          dateRequests: state.dateRequests.map((req) =>
            req.id === application.requestId
              ? {
                  ...req,
                  currentParticipants: req.currentParticipants + 1,
                  status: 'matched' as const,
                }
              : req
          ),
          notifications: [notification, ...state.notifications],
          conversations: newConversation
            ? [newConversation, ...state.conversations]
            : state.conversations,
        }));
      },

      rejectApplication: (applicationId) => {
        const { applications, dateRequests, currentUser } = get();
        const application = applications.find((a) => a.id === applicationId);
        if (!application) return;

        const request = dateRequests.find((r) => r.id === application.requestId);

        const notification: Notification = {
          id: Date.now().toString(),
          userId: application.userId,
          type: 'rejected',
          title: 'Ứng tuyển bị từ chối',
          message: `${currentUser.name} đã từ chối ứng tuyển của bạn cho "${request?.title}"`,
          data: { requestId: request?.id, applicationId },
          read: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === applicationId ? { ...app, status: 'rejected' as const } : app
          ),
          notifications: [notification, ...state.notifications],
        }));
      },

      // User Actions
      updateProfile: (updates) => {
        set((state) => ({
          currentUser: { ...state.currentUser, ...updates },
          users: state.users.map((u) =>
            u.id === state.currentUser.id ? { ...u, ...updates } : u
          ),
        }));
      },

      getAllUsers: () => {
        const { users, currentUser } = get();
        return users.filter((u) => u.id !== currentUser.id);
      },

      getUserById: (userId) => {
        const { users } = get();
        return users.find((u) => u.id === userId);
      },

      // Messages
      getOrCreateConversationWithUser: (otherUserId) => {
        const { currentUser, users, conversations } = get();
        if (!otherUserId) return null;
        if (otherUserId === currentUser.id) return null;

        const otherUser = users.find((u) => u.id === otherUserId);
        if (!otherUser) return null;

        const existing = conversations.find(
          (c) =>
            c.participants.some((p) => p.id === currentUser.id) &&
            c.participants.some((p) => p.id === otherUserId) &&
            c.participants.length === 2
        );

        if (existing) {
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === existing.id ? { ...c, updatedAt: new Date().toISOString() } : c
            ),
          }));
          return existing.id;
        }

        const newConversation: Conversation = {
          id: Date.now().toString(),
          participants: [currentUser, otherUser],
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
        }));

        return newConversation.id;
      },

      sendMessage: (conversationId, text) => {
        const { conversations, currentUser } = get();
        const conversation = conversations.find((c) => c.id === conversationId);
        if (!conversation) return;

        const receiver = conversation.participants.find((p) => p.id !== currentUser.id);
        if (!receiver) return;

        const newMessage: Message = {
          id: Date.now().toString(),
          conversationId,
          senderId: currentUser.id,
          receiverId: receiver.id,
          text,
          createdAt: new Date().toISOString(),
          read: false,
        };

        const notification: Notification = {
          id: Date.now().toString(),
          userId: receiver.id,
          type: 'message',
          title: 'Tin nhắn mới',
          message: `${currentUser.name}: "${text}"`,
          data: { conversationId, messageId: newMessage.id },
          read: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [...(state.messages[conversationId] || []), newMessage],
          },
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, lastMessage: newMessage, updatedAt: new Date().toISOString() }
              : c
          ),
          notifications: [notification, ...state.notifications],
        }));
      },

      getMyConversations: () => {
        const { conversations, currentUser } = get();
        return conversations
          .filter((c) => c.participants.some((p) => p.id === currentUser.id))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },

      getMessages: (conversationId) => {
        const { messages } = get();
        return messages[conversationId] || [];
      },

      // Notification Actions
      markNotificationAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
      },

      markAllNotificationsAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      getMyNotifications: () => {
        const { notifications, currentUser } = get();
        return notifications.filter((n) => n.userId === currentUser.id);
      },

      // Review Actions
      getUserReviews: (userId) => {
        const { reviews } = get();
        return reviews
          .filter((r) => r.userId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getUserAverageRating: (userId) => {
        const { reviews } = get();
        const userReviews = reviews.filter((r) => r.userId === userId);
        if (userReviews.length === 0) return 0;
        const sum = userReviews.reduce((acc, r) => acc + r.rating, 0);
        return sum / userReviews.length;
      },

      addReview: (review) => {
        const newReview: Review = {
          ...review,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          reviews: [newReview, ...state.reviews],
        }));
        return newReview;
      },

      // Booking Actions
      createBooking: (providerId, serviceId, date, time, location, message) => {
        const { users, currentUser } = get();
        const provider = users.find((u) => u.id === providerId);
        if (!provider) return undefined;

        const service = provider.services?.find((s) => s.id === serviceId);
        if (!service) return undefined;

        const newBooking: ServiceBooking = {
          id: Date.now().toString(),
          serviceId,
          providerId,
          provider,
          bookerId: currentUser.id,
          booker: currentUser,
          service,
          date,
          time,
          location,
          message,
          status: 'pending',
          isPaid: false,
          escrowAmount: service.price,
          createdAt: new Date().toISOString(),
        };

        const notification: Notification = {
          id: Date.now().toString(),
          userId: providerId,
          type: 'booking',
          title: 'Booking mới',
          message: `${currentUser.name} muốn book dịch vụ "${service.title}"`,
          data: { bookingId: newBooking.id },
          read: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          bookings: [newBooking, ...state.bookings],
          notifications: [notification, ...state.notifications],
        }));

        return newBooking;
      },

      acceptBooking: (bookingId) => {
        const { bookings, currentUser, conversations } = get();
        const booking = bookings.find((b) => b.id === bookingId);
        if (!booking) return;

        const notification: Notification = {
          id: Date.now().toString(),
          userId: booking.bookerId,
          type: 'booking_accepted',
          title: 'Booking được chấp nhận',
          message: `${currentUser.name} đã chấp nhận booking "${booking.service.title}" của bạn`,
          data: { bookingId },
          read: false,
          createdAt: new Date().toISOString(),
        };

        const existingConversation = conversations.find(
          (c) =>
            c.participants.some((p) => p.id === booking.bookerId) &&
            c.participants.some((p) => p.id === currentUser.id)
        );

        const newConversation: Conversation | null = existingConversation
          ? null
          : {
              id: Date.now().toString(),
              participants: [currentUser, booking.booker],
              updatedAt: new Date().toISOString(),
            };

        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId ? { ...b, status: 'accepted' as const } : b
          ),
          notifications: [notification, ...state.notifications],
          conversations: newConversation
            ? [newConversation, ...state.conversations]
            : state.conversations,
        }));
      },

      rejectBooking: (bookingId) => {
        const { bookings, currentUser } = get();
        const booking = bookings.find((b) => b.id === bookingId);
        if (!booking) return;

        const notification: Notification = {
          id: Date.now().toString(),
          userId: booking.bookerId,
          type: 'booking_rejected',
          title: 'Booking bị từ chối',
          message: `${currentUser.name} đã từ chối booking "${booking.service.title}" của bạn`,
          data: { bookingId },
          read: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId ? { ...b, status: 'rejected' as const } : b
          ),
          notifications: [notification, ...state.notifications],
        }));
      },

      getMyBookings: () => {
        const { bookings, currentUser } = get();
        return bookings.filter((b) => b.bookerId === currentUser.id);
      },

      getReceivedBookings: () => {
        const { bookings, currentUser } = get();
        return bookings.filter((b) => b.providerId === currentUser.id);
      },

      // Service Actions
      addServiceToProfile: (service) => {
        const newService: ServiceOffering = {
          ...service,
          id: Date.now().toString(),
        };

        set((state) => ({
          currentUser: {
            ...state.currentUser,
            isServiceProvider: true,
            services: [...(state.currentUser.services || []), newService],
          },
          users: state.users.map((u) =>
            u.id === state.currentUser.id
              ? {
                  ...u,
                  isServiceProvider: true,
                  services: [...(u.services || []), newService],
                }
              : u
          ),
        }));

        return newService;
      },

      updateService: (serviceId, updates) => {
        set((state) => ({
          currentUser: {
            ...state.currentUser,
            services: state.currentUser.services?.map((s) =>
              s.id === serviceId ? { ...s, ...updates } : s
            ),
          },
          users: state.users.map((u) =>
            u.id === state.currentUser.id
              ? {
                  ...u,
                  services: u.services?.map((s) =>
                    s.id === serviceId ? { ...s, ...updates } : s
                  ),
                }
              : u
          ),
        }));
      },

      removeService: (serviceId) => {
        set((state) => ({
          currentUser: {
            ...state.currentUser,
            services: state.currentUser.services?.filter((s) => s.id !== serviceId),
          },
          users: state.users.map((u) =>
            u.id === state.currentUser.id
              ? {
                  ...u,
                  services: u.services?.filter((s) => s.id !== serviceId),
                }
              : u
          ),
        }));
      },

      // Wallet Actions
      topUpWallet: (amount, method) => {
        const { currentUser } = get();
        const transaction: Transaction = {
          id: Date.now().toString(),
          userId: currentUser.id,
          type: 'top_up',
          amount,
          status: 'completed',
          description: `Nạp tiền vào ví qua ${method}`,
          paymentMethod: method,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        set((state) => ({
          transactions: [transaction, ...state.transactions],
          currentUser: {
            ...state.currentUser,
            wallet: {
              ...state.currentUser.wallet,
              balance: state.currentUser.wallet.balance + amount,
            },
          },
          users: state.users.map((u) =>
            u.id === state.currentUser.id
              ? {
                  ...u,
                  wallet: { ...u.wallet, balance: u.wallet.balance + amount },
                }
              : u
          ),
        }));

        return transaction;
      },

      payForBooking: (bookingId) => {
        const { bookings, currentUser } = get();
        const booking = bookings.find((b) => b.id === bookingId);
        if (!booking) return null;

        const amount = booking.service.price;
        if (currentUser.wallet.balance < amount) {
          return null;
        }

        const transaction: Transaction = {
          id: Date.now().toString(),
          userId: currentUser.id,
          type: 'booking_payment',
          amount,
          status: 'completed',
          description: `Thanh toán booking: ${booking.service.title}`,
          relatedId: bookingId,
          paymentMethod: 'wallet',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        const providerTransaction: Transaction = {
          id: (Date.now() + 1).toString(),
          userId: booking.providerId,
          type: 'booking_earning',
          amount,
          status: 'completed',
          description: `Thu nhập từ booking: ${booking.service.title}`,
          relatedId: bookingId,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        set((state) => ({
          transactions: [transaction, providerTransaction, ...state.transactions],
          currentUser: {
            ...state.currentUser,
            wallet: {
              ...state.currentUser.wallet,
              balance: state.currentUser.wallet.balance - amount,
            },
          },
          users: state.users.map((u) => {
            if (u.id === state.currentUser.id) {
              return {
                ...u,
                wallet: { ...u.wallet, balance: u.wallet.balance - amount },
              };
            }
            if (u.id === booking.providerId) {
              return {
                ...u,
                wallet: { ...u.wallet, balance: u.wallet.balance + amount },
              };
            }
            return u;
          }),
        }));

        return transaction;
      },

      getMyTransactions: () => {
        const { transactions, currentUser } = get();
        return transactions
          .filter((t) => t.userId === currentUser.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
    }),
    {
      name: 'dinedate-storage',
      partialize: (state) => ({
        dateRequests: state.dateRequests,
        applications: state.applications,
        currentUser: state.currentUser,
        users: state.users,
        bookings: state.bookings,
        notifications: state.notifications,
        conversations: state.conversations,
        messages: state.messages,
        reviews: state.reviews,
        transactions: state.transactions,
      }),
    }
  )
);
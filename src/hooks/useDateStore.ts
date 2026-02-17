'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DateOrder,
  DateOrderApplication,
  User,
  Notification,
  PersonReview,
  Transaction,
  PaymentMethod,
  Restaurant,
  Combo,
} from '@/types';
import { MOCK_DATE_ORDERS } from '@/mocks/dateRequests';
import { MOCK_RESTAURANTS, MOCK_COMBOS } from '@/mocks/restaurants';
import { MOCK_USERS } from '@/mocks/users';
import { MOCK_PERSON_REVIEWS } from '@/mocks/reviews';

const CURRENT_USER = MOCK_USERS[0];

const isExpired = (expiresAt?: string) => {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
};

const addMinutesIso = (minutes: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
};

interface DateStore {
  // State
  dateOrders: DateOrder[];
  dateOrderApplications: DateOrderApplication[];
  restaurants: Restaurant[];
  combos: Combo[];
  currentUser: User;
  users: User[];
  notifications: Notification[];
  reviews: PersonReview[];
  transactions: Transaction[];
  isLoaded: boolean;

  // Sync from Auth
  setCurrentUserFromAuth: (user: User) => void;

  // Actions - Date Orders
  createDateOrder: (
    order: Omit<
      DateOrder,
      'id' | 'creatorId' | 'creator' | 'status' | 'applicantCount' | 'createdAt'
    >
  ) => DateOrder;
  cancelDateOrder: (orderId: string) => void;
  updateDateOrder: (orderId: string, updates: Partial<DateOrder>) => void;
  expireOrdersIfNeeded: () => void;

  getActiveDateOrders: () => DateOrder[];
  getMyDateOrders: () => DateOrder[];
  getDateOrderById: (orderId: string) => DateOrder | undefined;

  // Actions - Applications
  applyToDateOrder: (orderId: string, message: string) => void;
  acceptApplication: (applicationId: string) => void;
  rejectApplication: (applicationId: string) => void;
  getApplicationsForOrder: (orderId: string) => DateOrderApplication[];
  getMyApplications: () => DateOrderApplication[];

  // Actions - Restaurants
  getRestaurants: () => Restaurant[];
  getRestaurantById: (id: string) => Restaurant | undefined;
  getCombosForRestaurant: (restaurantId: string) => Combo[];

  // Actions - User
  updateProfile: (updates: Partial<User>) => void;
  getAllUsers: () => User[];
  getUserById: (userId: string) => User | undefined;

  // Actions - Notifications
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  getMyNotifications: () => Notification[];

  // Actions - Reviews
  getUserReviews: (userId: string) => PersonReview[];
  getUserAverageRating: (userId: string) => number;
  addReview: (review: Omit<PersonReview, 'id' | 'createdAt'>) => PersonReview;

  // Actions - Wallet
  topUpWallet: (amount: number, method: PaymentMethod) => Transaction;
  payForDateOrder: (orderId: string, amount: number) => Transaction | null;
  getMyTransactions: () => Transaction[];
}

export const useDateStore = create<DateStore>()(
  persist(
    (set, get) => ({
      // Initial State
      dateOrders: MOCK_DATE_ORDERS,
      dateOrderApplications: [],
      restaurants: MOCK_RESTAURANTS,
      combos: MOCK_COMBOS,
      currentUser: CURRENT_USER,
      users: MOCK_USERS,
      notifications: [],
      reviews: MOCK_PERSON_REVIEWS,
      transactions: [],
      isLoaded: true,

      setCurrentUserFromAuth: (user) => {
        set((state) => {
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

      // --- Date Order Actions ---

      expireOrdersIfNeeded: () => {
        const { dateOrders } = get();
        const now = Date.now();

        const hasAnyToExpire = dateOrders.some(
          (r) =>
            r.status === 'active' &&
            r.expiresAt &&
            new Date(r.expiresAt).getTime() <= now
        );

        if (!hasAnyToExpire) return;

        set((state) => ({
          dateOrders: state.dateOrders.map((r) => {
            if (r.status !== 'active') return r;
            if (!r.expiresAt) return r;
            if (new Date(r.expiresAt).getTime() > now) return r;
            return { ...r, status: 'expired' as const };
          }),
        }));
      },

      createDateOrder: (order) => {
        const { currentUser } = get();

        const newOrder: DateOrder = {
          ...order,
          id: Date.now().toString(),
          creatorId: currentUser.id,
          creator: currentUser,
          status: 'active',
          applicantCount: 0,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          dateOrders: [newOrder, ...state.dateOrders],
        }));

        return newOrder;
      },

      cancelDateOrder: (orderId) => {
        set((state) => ({
          dateOrders: state.dateOrders.map((o) =>
            o.id === orderId && o.status === 'active'
              ? { ...o, status: 'cancelled' as const, cancelledAt: new Date().toISOString() }
              : o
          ),
        }));
      },

      updateDateOrder: (orderId, updates) => {
        set((state) => ({
          dateOrders: state.dateOrders.map((o) =>
            o.id === orderId ? { ...o, ...updates } : o
          ),
        }));
      },

      getActiveDateOrders: () => {
        const { dateOrders } = get();
        return dateOrders.filter((o) => o.status === 'active' && !isExpired(o.expiresAt));
      },

      getMyDateOrders: () => {
        const { dateOrders, currentUser } = get();
        return dateOrders.filter(
          (o) => o.creatorId === currentUser.id || o.matchedUserId === currentUser.id
        );
      },

      getDateOrderById: (orderId) => {
        const { dateOrders } = get();
        return dateOrders.find((o) => o.id === orderId);
      },

      // --- Application Actions ---

      applyToDateOrder: (orderId, message) => {
        const { dateOrders, currentUser, dateOrderApplications } = get();
        const order = dateOrders.find((o) => o.id === orderId);
        if (!order) return;
        if (order.status !== 'active') return;
        if (isExpired(order.expiresAt)) {
          set((state) => ({
            dateOrders: state.dateOrders.map((o) =>
              o.id === orderId ? { ...o, status: 'expired' as const } : o
            ),
          }));
          return;
        }

        // Prevent duplicate apply
        const alreadyApplied = dateOrderApplications.some(
          (a) => a.orderId === orderId && a.applicantId === currentUser.id
        );
        if (alreadyApplied) return;

        const application: DateOrderApplication = {
          id: Date.now().toString(),
          orderId,
          applicantId: currentUser.id,
          applicant: currentUser,
          message,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        const notification: Notification = {
          id: Date.now().toString(),
          userId: order.creatorId,
          type: 'date_order_application',
          title: 'Co nguoi ung tuyen',
          message: `${currentUser.name} muon di an cung ban tai "${order.restaurant?.name || 'nha hang'}"`,
          data: { orderId, applicationId: application.id },
          read: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          dateOrderApplications: [...state.dateOrderApplications, application],
          dateOrders: state.dateOrders.map((o) =>
            o.id === orderId
              ? { ...o, applicantCount: o.applicantCount + 1 }
              : o
          ),
          notifications: [notification, ...state.notifications],
        }));
      },

      acceptApplication: (applicationId) => {
        const { dateOrderApplications, dateOrders, currentUser } = get();
        const application = dateOrderApplications.find((a) => a.id === applicationId);
        if (!application) return;

        const order = dateOrders.find((o) => o.id === application.orderId);
        if (!order) return;

        const notification: Notification = {
          id: Date.now().toString(),
          userId: application.applicantId,
          type: 'date_order_matched',
          title: 'Da ghep doi!',
          message: `Ban da duoc chon cho buoi hen tai "${order.restaurant?.name || 'nha hang'}". Chuan bi gap mat nhe!`,
          data: { orderId: order.id },
          read: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          dateOrderApplications: state.dateOrderApplications.map((a) => {
            if (a.orderId !== application.orderId) return a;
            if (a.id === applicationId) return { ...a, status: 'accepted' as const };
            return { ...a, status: 'rejected' as const };
          }),
          dateOrders: state.dateOrders.map((o) =>
            o.id === application.orderId
              ? {
                  ...o,
                  status: 'matched' as const,
                  matchedUserId: application.applicantId,
                  matchedUser: application.applicant,
                  matchedAt: new Date().toISOString(),
                }
              : o
          ),
          notifications: [notification, ...state.notifications],
        }));
      },

      rejectApplication: (applicationId) => {
        const { dateOrderApplications, dateOrders, currentUser } = get();
        const application = dateOrderApplications.find((a) => a.id === applicationId);
        if (!application) return;

        const order = dateOrders.find((o) => o.id === application.orderId);

        const notification: Notification = {
          id: Date.now().toString(),
          userId: application.applicantId,
          type: 'system',
          title: 'Ung tuyen khong duoc chon',
          message: `Nguoi tao date order tai "${order?.restaurant?.name || 'nha hang'}" da chon nguoi khac.`,
          data: { orderId: order?.id },
          read: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          dateOrderApplications: state.dateOrderApplications.map((a) =>
            a.id === applicationId ? { ...a, status: 'rejected' as const } : a
          ),
          notifications: [notification, ...state.notifications],
        }));
      },

      getApplicationsForOrder: (orderId) => {
        const { dateOrderApplications } = get();
        return dateOrderApplications.filter((a) => a.orderId === orderId);
      },

      getMyApplications: () => {
        const { dateOrderApplications, currentUser } = get();
        return dateOrderApplications.filter((a) => a.applicantId === currentUser.id);
      },

      // --- Restaurant Actions ---

      getRestaurants: () => {
        const { restaurants } = get();
        return restaurants.filter((r) => r.status === 'active');
      },

      getRestaurantById: (id) => {
        const { restaurants } = get();
        return restaurants.find((r) => r.id === id);
      },

      getCombosForRestaurant: (restaurantId) => {
        const { combos } = get();
        return combos.filter((c) => c.restaurantId === restaurantId && c.isAvailable);
      },

      // --- User Actions ---

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

      // --- Notification Actions ---

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

      // --- Review Actions ---

      getUserReviews: (userId) => {
        const { reviews } = get();
        return reviews
          .filter((r) => r.reviewedId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getUserAverageRating: (userId) => {
        const { reviews } = get();
        const userReviews = reviews.filter((r) => r.reviewedId === userId);
        if (userReviews.length === 0) return 0;
        const sum = userReviews.reduce((acc, r) => acc + r.rating, 0);
        return sum / userReviews.length;
      },

      addReview: (review) => {
        const newReview: PersonReview = {
          ...review,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          reviews: [newReview, ...state.reviews],
        }));
        return newReview;
      },

      // --- Wallet Actions ---

      topUpWallet: (amount, method) => {
        const { currentUser } = get();
        const transaction: Transaction = {
          id: Date.now().toString(),
          userId: currentUser.id,
          type: 'topup',
          amount,
          status: 'completed',
          description: `Nap tien vao vi qua ${method}`,
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

      payForDateOrder: (orderId, amount) => {
        const { dateOrders, currentUser } = get();
        const order = dateOrders.find((o) => o.id === orderId);
        if (!order) return null;

        if (currentUser.wallet.balance < amount) {
          return null;
        }

        const transaction: Transaction = {
          id: Date.now().toString(),
          userId: currentUser.id,
          type: 'payment',
          amount,
          status: 'completed',
          description: `Thanh toan date order: ${order.restaurant?.name || 'Nha hang'} - ${order.combo?.name || 'Combo'}`,
          relatedId: orderId,
          paymentMethod: 'wallet',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        set((state) => ({
          transactions: [transaction, ...state.transactions],
          currentUser: {
            ...state.currentUser,
            wallet: {
              ...state.currentUser.wallet,
              balance: state.currentUser.wallet.balance - amount,
            },
          },
          users: state.users.map((u) =>
            u.id === state.currentUser.id
              ? {
                  ...u,
                  wallet: { ...u.wallet, balance: u.wallet.balance - amount },
                }
              : u
          ),
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
        dateOrders: state.dateOrders,
        dateOrderApplications: state.dateOrderApplications,
        currentUser: state.currentUser,
        users: state.users,
        notifications: state.notifications,
        reviews: state.reviews,
        transactions: state.transactions,
      }),
    }
  )
);

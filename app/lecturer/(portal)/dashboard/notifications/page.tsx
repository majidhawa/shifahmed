'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Menu,
  UserCircle,
  LogOut,
  ChevronDown,
  Loader2,
  Megaphone,
  ClipboardList,
  FileQuestion,
  BookOpen,
  CalendarDays,
  UserRound,
  GraduationCap,
  BellRing,
  Info,
  ArrowRight,
  CheckCheck,
  RefreshCw,
  X,
} from 'lucide-react';

type Lecturer = {
  id: number | string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

type Notification = {
  id: number;
  lecturer_id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_by: number | null;
  created_at: string;
  read_at: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
};

type NotificationResponse = {
  success?: boolean;
  notifications?: Notification[];
  unreadCount?: number;
  totalCount?: number;
  message?: string;
};

function getNotificationIcon(type: string) {
  switch (type?.toLowerCase()) {
    case 'announcement':
      return Megaphone;

    case 'assignment':
      return ClipboardList;

    case 'quiz':
      return FileQuestion;

    case 'lesson':
      return BookOpen;

    case 'timetable':
      return CalendarDays;

    case 'student':
      return UserRound;

    case 'grade':
      return GraduationCap;

    case 'system':
      return BellRing;

    case 'general':
      return Bell;

    default:
      return Info;
  }
}

function getNotificationIconStyle(type: string) {
  switch (type?.toLowerCase()) {
    case 'announcement':
      return 'bg-amber-100 text-amber-700';

    case 'assignment':
      return 'bg-blue-100 text-blue-700';

    case 'quiz':
      return 'bg-purple-100 text-purple-700';

    case 'lesson':
      return 'bg-emerald-100 text-emerald-700';

    case 'timetable':
      return 'bg-cyan-100 text-cyan-700';

    case 'student':
      return 'bg-indigo-100 text-indigo-700';

    case 'grade':
      return 'bg-green-100 text-green-700';

    case 'system':
      return 'bg-red-100 text-red-700';

    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = Date.now();
  const diff = now - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 30) {
    return 'Just now';
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year:
      date.getFullYear() !== new Date().getFullYear()
        ? 'numeric'
        : undefined,
  });
}

function truncateMessage(message: string, maxLength = 90) {
  if (!message) return '';

  if (message.length <= maxLength) {
    return message;
  }

  return `${message.slice(0, maxLength).trim()}…`;
}

export default function LecturerHeader() {
  const [lecturer, setLecturer] = useState<Lecturer | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null
  );

  const [loggingOut, setLoggingOut] = useState(false);

  const notificationDropdownRef = useRef<HTMLDivElement | null>(null);
  const accountDropdownRef = useRef<HTMLDivElement | null>(null);

  /*
   * ============================================================
   * LOAD LECTURER
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    const loadLecturer = async () => {
      try {
        const response = await fetch('/api/lecturer/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          if (mounted) {
            setLecturer(null);
          }

          return;
        }

        const data = await response.json();

        if (mounted) {
          setLecturer(data?.lecturer ?? data?.user ?? null);
        }
      } catch (error) {
        console.error('Failed to load lecturer:', error);

        if (mounted) {
          setLecturer(null);
        }
      }
    };

    void loadLecturer();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ============================================================
   * LOAD NOTIFICATIONS
   *
   * Uses the EXISTING notification API.
   * It does NOT use announcements.
   * ============================================================
   */

  const loadNotifications = useCallback(
    async (showLoading = false) => {
      if (!lecturer?.id) {
        return;
      }

      if (showLoading) {
        setNotificationsLoading(true);
      }

      try {
        setNotificationsError(null);

        const params = new URLSearchParams();

        // Only request a small number for the header preview.
        params.set('limit', '8');

        const response = await fetch(
          `/api/lecturer/notifications?${params.toString()}`,
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }
        );

        const data: NotificationResponse = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(
            data.message || 'Failed to load notifications.'
          );
        }

        setNotifications(
          Array.isArray(data.notifications) ? data.notifications : []
        );

        setUnreadCount(
          typeof data.unreadCount === 'number'
            ? data.unreadCount
            : Array.isArray(data.notifications)
              ? data.notifications.filter(
                  (notification) => !notification.is_read
                ).length
              : 0
        );
      } catch (error) {
        console.error('Failed to load lecturer notifications:', error);

        setNotificationsError(
          error instanceof Error
            ? error.message
            : 'Failed to load notifications.'
        );
      } finally {
        if (showLoading) {
          setNotificationsLoading(false);
        }
      }
    },
    [lecturer?.id]
  );

  /*
   * ============================================================
   * LIVE NOTIFICATION POLLING
   *
   * Refreshes every 15 seconds while the lecturer is logged in.
   * Does not poll when the browser tab is hidden.
   * ============================================================
   */

  useEffect(() => {
    if (!lecturer?.id) {
      return;
    }

    void loadNotifications(true);

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        void loadNotifications(false);
      }
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [lecturer?.id, loadNotifications]);

  /*
   * ============================================================
   * CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
   * ============================================================
   */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
      }

      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /*
   * ============================================================
   * MARK SINGLE NOTIFICATION AS READ
   * ============================================================
   */

  const markNotificationAsRead = async (
    notification: Notification
  ) => {
    if (notification.is_read) {
      return true;
    }

    try {
      const response = await fetch('/api/lecturer/notifications', {
        method: 'PATCH',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          id: notification.id,
          is_read: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || 'Failed to mark notification as read.'
        );
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : item
        )
      );

      setUnreadCount((current) => Math.max(0, current - 1));

      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  };

  /*
   * ============================================================
   * HANDLE NOTIFICATION CLICK
   * ============================================================
   */

  const handleNotificationClick = async (
    notification: Notification
  ) => {
    await markNotificationAsRead(notification);

    setNotificationsOpen(false);

    if (notification.link) {
      window.location.href = notification.link;
      return;
    }

    window.location.href = '/lecturer/dashboard/notifications';
  };

  /*
   * ============================================================
   * LOGOUT
   * ============================================================
   */

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await fetch('/api/lecturer/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLecturer(null);
      setMenuOpen(false);
      setNotificationsOpen(false);

      window.location.replace('/lecturer/login');
    }
  };

  /*
   * ============================================================
   * TOGGLE NOTIFICATION DROPDOWN
   * ============================================================
   */

  const toggleNotifications = () => {
    if (loggingOut) {
      return;
    }

    setNotificationsOpen((current) => !current);
    setMenuOpen(false);

    if (!notificationsOpen) {
      void loadNotifications(false);
    }
  };

  /*
   * ============================================================
   * TOGGLE ACCOUNT MENU
   * ============================================================
   */

  const toggleAccountMenu = () => {
    if (loggingOut) {
      return;
    }

    setMenuOpen((current) => !current);
    setNotificationsOpen(false);
  };

  const displayName = lecturer?.name || 'Lecturer';

  const notificationBadge =
    unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : unreadCount;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ======================================================
            LEFT SIDE
        ====================================================== */}

        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Toggle */}
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('lecturer-toggle-sidebar')
              );
            }}
            disabled={loggingOut}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-brand-green/10 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link
            href="/lecturer/dashboard"
            className="flex items-center gap-3"
            onClick={(event) => {
              if (loggingOut) {
                event.preventDefault();
              }
            }}
          >
            <img
              src="/images/logo.jpg"
              alt="Shifah Medical Training College"
              className="h-10 w-10 rounded-xl object-cover"
            />

            <div className="hidden sm:block">
              <p className="text-sm font-bold text-brand-dark">
                Shifah Medical Training College
              </p>

              <p className="text-xs text-slate-500">
                Lecturer Portal
              </p>
            </div>
          </Link>
        </div>

        {/* ======================================================
            RIGHT SIDE
        ====================================================== */}

        <div className="flex items-center gap-2 sm:gap-3">
          {/* ====================================================
              LIVE NOTIFICATIONS
          ==================================================== */}

          <div
            ref={notificationDropdownRef}
            className="relative"
          >
            <button
              type="button"
              aria-label={
                unreadCount > 0
                  ? `${unreadCount} unread notifications`
                  : 'Notifications'
              }
              aria-expanded={notificationsOpen}
              onClick={toggleNotifications}
              disabled={loggingOut}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-brand-green/10 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Bell
                className={`h-5 w-5 transition ${
                  unreadCount > 0
                    ? 'text-brand-green'
                    : 'text-slate-500'
                }`}
              />

              {/* Unread Count */}
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-gold px-1 text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
                  {notificationBadge}
                </span>
              )}
            </button>

            {/* ==================================================
                NOTIFICATION DROPDOWN
            ================================================== */}

            {notificationsOpen && (
              <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] max-w-[390px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Notifications
                      </h3>

                      {unreadCount > 0 && (
                        <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[10px] font-bold text-brand-green">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Latest updates from your lecturer portal
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Refresh notifications"
                      onClick={() => void loadNotifications(true)}
                      disabled={notificationsLoading}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand-green disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${
                          notificationsLoading ? 'animate-spin' : ''
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      aria-label="Close notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="max-h-[420px] overflow-y-auto">
                  {/* Loading */}
                  {notificationsLoading &&
                    notifications.length === 0 && (
                      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                        <Loader2 className="mb-3 h-7 w-7 animate-spin text-brand-green" />

                        <p className="text-sm font-medium text-slate-700">
                          Loading notifications...
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Checking for your latest updates
                        </p>
                      </div>
                    )}

                  {/* Error */}
                  {!notificationsLoading &&
                    notificationsError && (
                      <div className="px-6 py-10 text-center">
                        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                          <BellRing className="h-5 w-5 text-red-500" />
                        </div>

                        <p className="text-sm font-semibold text-slate-800">
                          Unable to load notifications
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {notificationsError}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            void loadNotifications(true)
                          }
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-green px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Try again
                        </button>
                      </div>
                    )}

                  {/* Empty */}
                  {!notificationsLoading &&
                    !notificationsError &&
                    notifications.length === 0 && (
                      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                          <Bell className="h-5 w-5 text-slate-400" />
                        </div>

                        <p className="text-sm font-semibold text-slate-800">
                          No notifications
                        </p>

                        <p className="mt-1 max-w-[250px] text-xs leading-5 text-slate-500">
                          You&apos;re all caught up. New notifications
                          will appear here automatically.
                        </p>
                      </div>
                    )}

                  {/* Notifications */}
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(
                      notification.type
                    );

                    const iconStyle = getNotificationIconStyle(
                      notification.type
                    );

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() =>
                          void handleNotificationClick(notification)
                        }
                        className={`group flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                          !notification.is_read
                            ? 'bg-brand-green/[0.035]'
                            : 'bg-white'
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p
                                className={`line-clamp-1 text-xs ${
                                  notification.is_read
                                    ? 'font-medium text-slate-700'
                                    : 'font-bold text-slate-900'
                                }`}
                              >
                                {notification.title}
                              </p>
                            </div>

                            {!notification.is_read && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-gold" />
                            )}
                          </div>

                          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">
                            {truncateMessage(notification.message)}
                          </p>

                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-medium capitalize text-slate-400">
                              {notification.type || 'general'}
                            </span>

                            <span className="text-[10px] text-slate-400">
                              {formatRelativeTime(
                                notification.created_at
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="mt-3 h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </button>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 bg-slate-50/70 p-2">
                  <Link
                    href="/lecturer/dashboard/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-green transition hover:bg-brand-green/10"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    View all notifications
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ====================================================
              ACCOUNT MENU
          ==================================================== */}

          <div
            ref={accountDropdownRef}
            className="relative"
          >
            <button
              type="button"
              onClick={toggleAccountMenu}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <UserCircle className="h-8 w-8 text-brand-green" />

              <div className="hidden text-left sm:block">
                <p className="max-w-[130px] truncate text-xs font-semibold text-slate-800">
                  {displayName}
                </p>

                <p className="text-[10px] text-slate-400">
                  Lecturer
                </p>
              </div>

              <ChevronDown
                className={`hidden h-4 w-4 text-slate-400 transition sm:block ${
                  menuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Account Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {displayName}
                  </p>

                  {lecturer?.email && (
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {lecturer.email}
                    </p>
                  )}
                </div>

                <Link
                  href="/lecturer/dashboard/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-brand-green"
                >
                  <UserCircle className="h-4 w-4" />
                  Profile
                </Link>

                <Link
                  href="/lecturer/dashboard/notifications"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-brand-green"
                >
                  <span className="flex items-center gap-3">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </span>

                  {unreadCount > 0 && (
                    <span className="rounded-full bg-brand-gold px-2 py-0.5 text-[10px] font-bold text-white">
                      {notificationBadge}
                    </span>
                  )}
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}

                  {loggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
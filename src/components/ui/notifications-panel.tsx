import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, Trash2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { usePanelState } from '@/hooks/usePanelState';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

export function NotificationsPanel() {
  const { notifications, unreadCount, markAsRead, deleteAllNotifications } = useNotifications();
  const { notificationsOpen, setNotificationsOpen } = usePanelState();
  const navigate = useNavigate();
  
  console.log('NotificationsPanel render - unreadCount:', unreadCount);

  const handleNotificationClick = (notification: any) => {
    console.log('Clicked notification:', notification.id, 'Current unread count:', unreadCount);
    markAsRead(notification.id);
    navigate(`/private-chat/${notification.room_id}`);
    setNotificationsOpen(false);
  };

  const handleDeleteAll = async () => {
    await deleteAllNotifications();
    setNotificationsOpen(false);
  };

  // Always show the bell, but only show badge when there are unread notifications

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setNotificationsOpen(!notificationsOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {notificationsOpen && (
        <Card className="absolute top-12 right-0 w-80 max-h-96 overflow-hidden z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Notifications</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteAll}
                  className="h-6 w-6 p-0 hover:text-destructive"
                  title="Delete all notifications"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notification.is_read ? 'bg-muted/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={notification.sender_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {notification.sender_profile?.username?.charAt(0).toUpperCase() || 'F'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {notification.sender_profile?.username || 'Friend'}
                          </p>
                          {!notification.is_read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: enUS 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
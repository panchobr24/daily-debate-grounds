import { useNavigate } from 'react-router-dom';
import { Bell, Trash2, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMentions } from '@/hooks/useMentions';
import { usePanelState } from '@/hooks/usePanelState';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

export function MentionsPanel() {
  const { mentionsOpen, setMentionsOpen } = usePanelState();
  const { mentions, unreadMentions, markMentionAsRead, deleteAllMentions } = useMentions();
  const navigate = useNavigate();

  const handleMentionClick = async (mention: any) => {
    // Mark mention as read
    if (!mention.is_read) {
      await markMentionAsRead(mention.id);
    }
    
    navigate(`/chat/${mention.room_id}`);
    setMentionsOpen(false);
  };

  const handleDeleteAll = async () => {
    await deleteAllMentions();
    setMentionsOpen(false);
  };

  // Always show the mentions bell, but only show badge when there are unread mentions

  return (
    <div className="relative">
      {/* Mentions Bell */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMentionsOpen(!mentionsOpen)}
        className="relative"
      >
        <AtSign className="h-5 w-5" />
        {unreadMentions > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
          >
            {unreadMentions > 9 ? '9+' : unreadMentions}
          </Badge>
        )}
      </Button>

      {/* Mentions Panel */}
      {mentionsOpen && (
        <Card className="absolute top-12 right-0 w-80 max-h-96 overflow-hidden z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Mentions</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteAll}
                  className="h-6 w-6 p-0 hover:text-destructive"
                  title="Delete all mentions"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {mentions.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No new mentions
                </div>
              ) : (
                mentions.map((mention) => (
                  <div
                    key={mention.id}
                    onClick={() => handleMentionClick(mention)}
                    className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      !mention.is_read ? 'bg-muted/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={mention.mentioned_by_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {mention.mentioned_by_profile?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {mention.mentioned_by_profile?.username || 'User'}
                          </p>
                          {!mention.is_read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          mentioned you in "{mention.room_title}"
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          "{mention.message_content}"
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(mention.created_at), { 
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
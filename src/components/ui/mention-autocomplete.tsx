import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

interface User {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

interface MentionAutocompleteProps {
  roomId: string;
  inputValue: string;
  cursorPosition: number;
  onSelectUser: (username: string) => void;
  onClose: () => void;
}

export function MentionAutocomplete({ 
  roomId, 
  inputValue, 
  cursorPosition, 
  onSelectUser, 
  onClose 
}: MentionAutocompleteProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract the mention query from the input
  const getMentionQuery = () => {
    const beforeCursor = inputValue.slice(0, cursorPosition);
    const match = beforeCursor.match(/@(\w*)$/);
    return match ? match[1] : '';
  };

  const mentionQuery = getMentionQuery();

  useEffect(() => {
    if (!mentionQuery) {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Get users who have sent messages in this room
        const { data: messages } = await supabase
          .from('messages')
          .select('user_id')
          .eq('room_id', roomId);

        if (messages && messages.length > 0) {
          const userIds = [...new Set(messages.map(m => m.user_id))];
          
          // Get user profiles
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, avatar_url')
            .in('user_id', userIds)
            .ilike('username', `%${mentionQuery}%`)
            .limit(5);

          if (profiles) {
            setUsers(profiles);
            setSelectedIndex(0);
          }
        }
      } catch (error) {
        console.error('Error fetching users for mentions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [mentionQuery, roomId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!users.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % users.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + users.length) % users.length);
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (users[selectedIndex]) {
            onSelectUser(users[selectedIndex].username);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [users, selectedIndex, onSelectUser, onClose]);

  // Close if no mention query
  useEffect(() => {
    if (!mentionQuery) {
      onClose();
    }
  }, [mentionQuery, onClose]);

  if (!mentionQuery || users.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="absolute bottom-full left-0 mb-2 z-50"
    >
      <Card className="w-64 max-h-48 overflow-hidden">
        <CardContent className="p-0">
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : (
              users.map((user, index) => (
                <div
                  key={user.user_id}
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-3 ${
                    index === selectedIndex ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => onSelectUser(user.username)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {user.username}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
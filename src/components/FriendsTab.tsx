import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, Check, X, MessageCircle, ArrowLeft } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/ui/header';

interface UserSearchResult {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export default function FriendsTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { friends, friendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, searchUsers } = useFriends();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleStartPrivateChat = async (friendUserId: string) => {
    if (!user) return;
    
    try {
      // Check if private chat room already exists
      const { data: existingRoom } = await supabase
        .from('private_chat_rooms')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${friendUserId}),and(user1_id.eq.${friendUserId},user2_id.eq.${user.id})`)
        .single();

      if (existingRoom) {
        navigate(`/private-chat/${existingRoom.id}`);
        return;
      }

      // Create new private chat room
      const { data: newRoom, error } = await supabase
        .from('private_chat_rooms')
        .insert({
          user1_id: user.id < friendUserId ? user.id : friendUserId,
          user2_id: user.id < friendUserId ? friendUserId : user.id
        })
        .select('id')
        .single();

      if (error) throw error;
      
      navigate(`/private-chat/${newRoom.id}`);
    } catch (error) {
      console.error('Error starting private chat:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Friends</h1>
            <p className="text-muted-foreground">Manage your friends and start private conversations</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Friends
            </CardTitle>
            <CardDescription>
              Manage your friends and start private conversations
            </CardDescription>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue="friends" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="friends">My Friends ({friends.length})</TabsTrigger>
              <TabsTrigger value="requests">
                Requests ({friendRequests.length})
                {friendRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                    {friendRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="search">Find Friends</TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-4">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No friends yet. Search for users to add as friends!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {friends.map((friend) => (
                    <Card key={friend.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={friend.friend_profile?.avatar_url || undefined} />
                            <AvatarFallback>
                              {friend.friend_profile?.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{friend.friend_profile?.username}</p>
                            <p className="text-sm text-muted-foreground">
                              Friends since {new Date(friend.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleStartPrivateChat(friend.friend_profile?.user_id || '')}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Chat
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {friendRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No pending friend requests</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {friendRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={request.requester_profile?.avatar_url || undefined} />
                            <AvatarFallback>
                              {request.requester_profile?.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.requester_profile?.username}</p>
                            <p className="text-sm text-muted-foreground">
                              Sent {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => acceptFriendRequest(request.id)}
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Check className="h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => rejectFriendRequest(request.id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <X className="h-4 w-4" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for users by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={searchLoading || !searchQuery.trim()}>
                  {searchLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="grid gap-4">
                  {searchResults.map((result) => (
                    <Card key={result.user_id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={result.avatar_url || undefined} />
                            <AvatarFallback>
                              {result.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{result.username}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => sendFriendRequest(result.user_id)}
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <UserPlus className="h-4 w-4" />
                          Add Friend
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !searchLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No users found with that username</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
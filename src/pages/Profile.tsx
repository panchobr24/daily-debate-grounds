import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function Profile() {
  const { profile } = useProfile();
  const { user, signOut } = useAuth();
  const [username, setUsername] = useState(profile?.username || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  // Inicializa avatarPreview com o valor do perfil, mas se avatarFile mudar, mostra o preview do arquivo
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sempre que profile.avatar_url mudar e nenhum arquivo novo for selecionado, atualiza o preview
  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(profile?.avatar_url || null);
    }
  }, [profile?.avatar_url, avatarFile]);

  if (!profile) {
    return <div className="p-8">Loading profile...</div>;
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // If the user clears the input, return to the current avatar
      setAvatarFile(null);
      setAvatarPreview(profile.avatar_url || null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    let avatarUrl = profile.avatar_url;
    if (avatarFile && user) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });
      if (!uploadError) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatarUrl = data.publicUrl;
      } else {
        setError("Error uploading profile image.");
        setLoading(false);
        return;
      }
    }
    // If username is empty, use the current profile value
    const usernameToSave = username.trim() === "" ? profile.username : username;
    const { error: updateError } = await supabase.from('profiles').update({ username: usernameToSave, avatar_url: avatarUrl }).eq('user_id', user?.id);
    setLoading(false);
    if (updateError) {
      setError("Error updating profile.");
    } else {
      setSuccess("Profile updated successfully!");
      window.location.reload();
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    if (password) {
      const { error: passError } = await supabase.auth.updateUser({ password });
      setPassword("");
      setLoading(false);
      if (passError) {
        setError("Error changing password.");
      } else {
        setSuccess("Password changed successfully!");
      }
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm("Are you sure you want to delete your profile? This action cannot be undone.")) return;
    setLoading(true);
    setError("");
    // Remove from profiles table
    await supabase.from('profiles').delete().eq('user_id', user?.id);
    // Remove user from auth
    await supabase.auth.admin.deleteUser(user?.id!);
    setLoading(false);
    signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-turf-purple/5 py-8">
      <Card className="w-full max-w-lg bg-card/95 backdrop-blur-sm border-turf-purple/20 shadow-xl">
        <CardHeader className="flex flex-col items-center gap-2">
          <Avatar className="h-24 w-24 border-4 border-turf-purple shadow-lg">
            <AvatarImage src={avatarPreview || undefined} />
            <AvatarFallback>
              {profile.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold text-turf-purple">{profile.username}</CardTitle>
          <CardDescription className="text-center">ID: <Badge variant="secondary">{profile.user_id}</Badge></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {success && (
            <Alert variant="default">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="avatar">Profile image</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                className="mt-1"
              />
              {avatarPreview && (
                <div className="mt-2 flex justify-center">
                  <img src={avatarPreview} alt="Preview" className="h-16 w-16 rounded-full border-2 border-turf-accent shadow" />
                </div>
              )}
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-turf-purple to-turf-accent hover:opacity-90 transition-opacity" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </form>
          <Separator className="my-6" />
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                placeholder="Minimum 6 characters"
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !password}>
              Change password
            </Button>
          </form>
          <Separator className="my-6" />
          <Button variant="destructive" className="w-full" onClick={handleDeleteProfile} disabled={loading}>
            Delete profile
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button variant="outline" className="w-full" onClick={() => navigate("/")}>Back to home</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
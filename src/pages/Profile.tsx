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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    setShowDeleteConfirm(false);
    setLoading(true);
    setError("");
    
    try {
      // Remove from profiles table
      await supabase.from('profiles').delete().eq('user_id', user?.id);
      // Remove user from auth
      await supabase.auth.admin.deleteUser(user?.id!);
      setLoading(false);
      signOut();
      navigate("/");
    } catch (error) {
      setLoading(false);
      setError("Erro ao deletar perfil. Tente novamente.");
      console.error("Error deleting profile:", error);
    }
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
          <div className="text-center">
            <CardDescription>ID:</CardDescription>
            <Badge variant="secondary" className="mt-1">{profile.user_id}</Badge>
          </div>
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
          <Button 
            variant="destructive" 
            className="w-full flex items-center gap-2" 
            onClick={() => setShowDeleteConfirm(true)} 
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
            Deletar Perfil
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button variant="outline" className="w-full" onClick={() => navigate("/")}>Back to home</Button>
        </CardFooter>
      </Card>
      
      {/* Modal de Confirmação de Deletar Perfil */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <DialogTitle>Confirmar Exclusão do Perfil</DialogTitle>
            </div>
            <DialogDescription className="text-left space-y-3">
              <p className="font-medium text-foreground">
                Você está prestes a deletar permanentemente sua conta.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>⚠️ <strong>Esta ação não pode ser desfeita.</strong></p>
                <p>Serão removidos permanentemente:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Seu perfil e dados pessoais</li>
                  <li>Todas as suas mensagens e debates</li>
                  <li>Seu histórico de atividades</li>
                  <li>Suas configurações e preferências</li>
                </ul>
                <p className="mt-3 text-foreground">
                  <strong>Nome de usuário:</strong> {profile.username}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProfile}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Sim, Deletar Perfil
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
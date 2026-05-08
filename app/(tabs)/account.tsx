import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  currency: string | null;
  language: string | null;
};

export default function AccountScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (session?.user) loadProfile();
  }, [session]);

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, email, currency, language')
      .eq('id', session!.user.id)
      .single();
    if (data) setProfile(data as Profile);
  }

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo access to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;
    const uri = result.assets[0].uri;

    setUploadingAvatar(true);
    try {
      // Read file as blob
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split('.').pop() ?? 'jpg';
      const path = `${session!.user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: `image/${ext}` });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session!.user.id);

      if (updateError) throw updateError;

      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : prev);
    } catch (err: any) {
      Alert.alert('Upload failed', err.message ?? 'Could not upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
        <TouchableOpacity onPress={() => router.push('/account/edit')}>
          <Ionicons name="create-outline" size={22} color="#5BC5A7" />
        </TouchableOpacity>
      </View>

      {/* Profile section */}
      <View style={styles.profileSection}>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar} disabled={uploadingAvatar}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {(profile?.full_name ?? session?.user?.email ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesome name="camera" size={12} color="#fff" />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <Text style={styles.name}>{profile?.full_name ?? 'Add your name'}</Text>
          <Text style={styles.email}>{session?.user?.email}</Text>
          {profile?.currency && (
            <Text style={styles.currency}>{profile.currency}</Text>
          )}
        </View>

        <TouchableOpacity onPress={() => router.push('/account/edit')} style={{ padding: 8 }}>
          <FontAwesome name="pencil" size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Settings</Text>

      <View style={styles.menuContainer}>
        <MenuItem
          icon="sliders"
          text="Preferences"
          onPress={() => router.push('/preferences')}
        />
        <MenuItem
          icon="bell"
          text="Notifications"
          onPress={() =>
            Alert.alert('Notifications', 'Push notifications coming soon.')
          }
        />
        <MenuItem
          icon="lock"
          text="Security"
          onPress={() =>
            Alert.alert('Security', 'Change your password in account settings.')
          }
        />
        <View style={styles.separator} />
        <MenuItem
          icon="star"
          text="Rate Garpa"
          color="#f59e0b"
          onPress={() =>
            Alert.alert('Rate Garpa', 'Thanks for using Garpa! ⭐')
          }
        />
        <MenuItem
          icon="envelope"
          text="Contact us"
          onPress={() =>
            Alert.alert('Contact', 'Email us at hello@garpa.app')
          }
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

function MenuItem({
  icon,
  text,
  color = '#555',
  onPress,
}: {
  icon: any;
  text: string;
  color?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.iconContainer}>
        <FontAwesome name={icon} size={18} color={color} />
      </View>
      <Text style={styles.menuText}>{text}</Text>
      <FontAwesome name="angle-right" size={18} color="#d1d5db" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 56,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatar: { width: 68, height: 68, borderRadius: 34 },
  avatarPlaceholder: { backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 26, fontWeight: '700', color: '#065f46' },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5BC5A7',
    padding: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', marginBottom: 3 },
  email: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  currency: { fontSize: 12, color: '#9ca3af' },
  sectionTitle: {
    marginLeft: 20,
    marginBottom: 8,
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 28,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: { width: 28, alignItems: 'center', marginRight: 14 },
  menuText: { flex: 1, fontSize: 16, color: '#111' },
  separator: { height: 10, backgroundColor: '#f0f0f0' },
  logoutButton: {
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 32,
  },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center', marginBottom: 40 },
  versionText: { color: '#d1d5db', fontSize: 12 },
});

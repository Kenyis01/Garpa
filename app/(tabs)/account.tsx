import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AccountScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  // Cargar datos del perfil al entrar
  useEffect(() => {
    if (session?.user) {
      getProfile();
    }
  }, [session]);

  const getProfile = async () => {
    try {
      if (!session?.user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.log('Error cargando perfil', error);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error', error.message);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
        <TouchableOpacity onPress={() => router.push('/account/edit')}>
          <FontAwesome name="search" size={20} color="#5BC5A7" />
        </TouchableOpacity>
      </View>

      {/* Perfil Header */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
           {/* Placeholder de Avatar */}
          <Image 
            source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/150' }} 
            style={styles.avatar} 
          />
          <TouchableOpacity style={styles.cameraIcon}>
            <FontAwesome name="camera" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{profile?.full_name || 'Usuario Nuevo'}</Text>
          <Text style={styles.email}>{session?.user?.email}</Text>
        </View>
        
        <TouchableOpacity onPress={() => router.push('/account/edit')} style={styles.editButton}>
            <FontAwesome name="pencil" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Settings</Text>

      {/* Menú de Opciones */}
      <View style={styles.menuContainer}>
        <MenuItem icon="qrcode" text="Scan code" />
        <MenuItem icon="diamond" text="G garpa Pro" color="#8e44ad" />
        <View style={styles.separator} />
        
        <MenuItem icon="sliders" text="Preferences" />
        <MenuItem icon="bell" text="Notifications" />
        <MenuItem icon="lock" text="Security" />
        <View style={styles.separator} />

        <MenuItem icon="star" text="Rate G garpa" color="#f1c40f" />
        <MenuItem icon="envelope" text="Contact us" />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
      
      <View style={styles.footer}>
        <Text style={styles.versionText}>P.S. You're awesome.</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

// Componente auxiliar para los items del menú
const MenuItem = ({ icon, text, color = "#555" }: { icon: any, text: string, color?: string }) => (
  <TouchableOpacity style={styles.menuItem}>
    <View style={styles.iconContainer}>
      <FontAwesome name={icon} size={20} color={color} />
    </View>
    <Text style={styles.menuText}>{text}</Text>
    <FontAwesome name="angle-right" size={20} color="#ccc" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 60, 
    backgroundColor: '#fff' 
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  profileSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 20, 
    marginBottom: 20 
  },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#ddd' },
  cameraIcon: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: '#5BC5A7', 
    padding: 6, 
    borderRadius: 15, 
    borderWidth: 2, 
    borderColor: '#fff' 
  },
  profileInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 14, color: '#888' },
  editButton: { padding: 10 },
  sectionTitle: { marginLeft: 20, marginBottom: 10, fontSize: 14, color: '#666', fontWeight: '600' },
  menuContainer: { backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee', marginBottom: 30 },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f9f9f9' 
  },
  iconContainer: { width: 30, alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, color: '#333' },
  separator: { height: 10, backgroundColor: '#f0f0f0' },
  logoutButton: { 
    backgroundColor: '#fff', 
    padding: 15, 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
    borderColor: '#eee',
    marginBottom: 40
  },
  logoutText: { color: '#ff5252', fontSize: 16, fontWeight: 'bold' },
  footer: { alignItems: 'center', marginBottom: 40 },
  versionText: { color: '#999', fontSize: 12, marginBottom: 4 }
});
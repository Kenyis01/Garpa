import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Mock de contactos (Simulando tu teléfono)
const PHONE_CONTACTS = [
  { id: '1', name: 'Abdou', phone: '+201008189145' },
  { id: '2', name: 'Agus Tayo', phone: '+5491166664681' },
  { id: '3', name: 'Alejandro Masajista', phone: '+5491133163228' },
  { id: '4', name: 'Alejo Zambecchi', phone: '+5491134210486' },
  { id: '5', name: 'Andru', phone: '+5491134210486' },
];

export default function AddFriendsScreen() {
  const params = useLocalSearchParams();
  const [searchText, setSearchText] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [localContacts, setLocalContacts] = useState(PHONE_CONTACTS);

  // Si volvemos de "new-contact" con un nuevo amigo creado, lo seleccionamos
  useEffect(() => {
    if (params.newContactName) {
      const newPerson = {
        id: Date.now().toString(),
        name: params.newContactName as string,
        phone: params.newContactPhone as string || '',
        email: params.newContactEmail as string || '',
      };
      // Lo agregamos a la lista visual y lo seleccionamos
      setLocalContacts(prev => [newPerson, ...prev]);
      setSelectedContacts(prev => [...prev, newPerson]);
    }
  }, [params.newContactName]);

  const filteredContacts = localContacts.filter(c => 
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const toggleSelection = (contact: any) => {
    if (selectedContacts.find(c => c.id === contact.id)) {
      setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts(prev => [...prev, contact]);
    }
  };

  const handleAddNew = () => {
    // Navegamos a la pantalla de crear contacto (Desliza desde derecha)
    // Pasamos lo que ya escribiste para pre-llenar el nombre
    router.push({
      pathname: '/new-contact',
      params: { initialName: searchText }
    });
  };

  const handleNext = () => {
    router.push({
      pathname: '/review-friends',
      params: { contacts: JSON.stringify(selectedContacts) }
    });
  };

  const renderContact = ({ item }: { item: any }) => {
    const isSelected = selectedContacts.find(c => c.id === item.id);
    return (
      <TouchableOpacity style={styles.contactRow} onPress={() => toggleSelection(item)}>
        <View style={styles.avatar}>
           {/* Iniciales o icono */}
           {item.name ? <Text style={styles.avatarText}>{item.name[0]}</Text> : <Ionicons name="person" size={16} color="white"/>}
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactDetail}>{item.phone || item.email}</Text>
        </View>
        <View style={[styles.radio, isSelected && styles.radioSelected]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      {/* Header Modal Full Screen */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add friends</Text>
        <TouchableOpacity onPress={handleNext} disabled={selectedContacts.length === 0}>
          <Text style={[styles.nextText, selectedContacts.length === 0 && { color: '#ccc' }]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
           <Ionicons name="search" size={20} color="#666" style={{marginRight: 8}} />
           <TextInput 
              placeholder="Enter name, email, or phone #"
              value={searchText}
              onChangeText={setSearchText}
              style={styles.input}
              autoFocus
           />
        </View>

        {/* LOGICA DINÁMICA: Botón que cambia según lo que escribes */}
        <TouchableOpacity style={styles.addNewRow} onPress={handleAddNew}>
            <View style={styles.addIconCircle}>
                <Ionicons name="person-add-outline" size={20} color="#666" />
            </View>
            <Text style={styles.addNewText}>
                {searchText.length > 0 
                  ? `Add a new contact: "${searchText}"` 
                  : "Add a new contact to Splitwise"}
            </Text>
        </TouchableOpacity>

        {/* Chips de seleccionados */}
        {selectedContacts.length > 0 && (
            <View style={{paddingHorizontal: 16, marginBottom: 10}}>
                <FlatList 
                    horizontal 
                    data={selectedContacts}
                    keyExtractor={item => item.id}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({item}) => (
                        <TouchableOpacity onPress={() => toggleSelection(item)} style={styles.chip}>
                            <Text style={{color:'white', fontSize: 12}}>{item.name}</Text>
                            <Ionicons name="close" size={14} color="white" style={{marginLeft: 4}}/>
                        </TouchableOpacity>
                    )}
                />
            </View>
        )}

        <Text style={styles.sectionTitle}>From your contacts</Text>

        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  cancelText: { fontSize: 16, color: '#000' },
  title: { fontSize: 17, fontWeight: '600' },
  nextText: { fontSize: 16, fontWeight: 'bold', color: Colors.brand.primary },
  container: { flex: 1, backgroundColor: '#fff' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', margin: 16, padding: 10, borderRadius: 8 },
  input: { flex: 1, fontSize: 16 },
  addNewRow: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 0, paddingBottom: 20 },
  addIconCircle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  addNewText: { fontSize: 16, fontWeight: '500', color: Colors.brand.primary },
  sectionTitle: { padding: 16, paddingBottom: 8, fontSize: 14, fontWeight: 'bold', color: '#666', backgroundColor: '#fafafa' },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#999', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: 'white', fontWeight: 'bold' },
  contactName: { fontSize: 16, fontWeight: '500' },
  contactDetail: { fontSize: 12, color: '#666' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.brand.primary, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, marginRight: 8 }
});
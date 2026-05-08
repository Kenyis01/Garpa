import { logError } from '@/lib/logger';
import * as Contacts from 'expo-contacts';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import type { Contact } from './types';

type State = {
  contacts: Contact[];
  loading: boolean;
  permissionDenied: boolean;
};

const initialState: State = { contacts: [], loading: false, permissionDenied: false };

export function useDeviceContacts(enabled: boolean) {
  const [state, setState] = useState<State>(initialState);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, permissionDenied: false }));
    try {
      const current = await Contacts.getPermissionsAsync();
      let status = current.status;
      if (status !== 'granted') {
        const requested = await Contacts.requestPermissionsAsync();
        status = requested.status;
      }

      if (status !== 'granted') {
        setState({ contacts: [], loading: false, permissionDenied: true });
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });

      const formatted: Contact[] = data
        .filter((c) => c.name && ((c.phoneNumbers?.length ?? 0) > 0 || (c.emails?.length ?? 0) > 0))
        .map((c, i) => ({
          id: c.id ?? `contact-${i}`,
          name: c.name ?? 'Unknown',
          phone: c.phoneNumbers?.[0]?.number ?? '',
          email: c.emails?.[0]?.email ?? undefined,
        }));

      setState({ contacts: formatted, loading: false, permissionDenied: false });
    } catch (err) {
      logError('useDeviceContacts.load', err instanceof Error ? err : new Error(String(err)));
      setState({ contacts: [], loading: false, permissionDenied: true });
    }
  }, []);

  const requestAgain = useCallback(async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      await load();
      return;
    }
    try {
      await Linking.openSettings();
    } catch (err) {
      logError(
        'useDeviceContacts.openSettings',
        err instanceof Error ? err : new Error(String(err)),
      );
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      }
    }
  }, [load]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { ...state, reload: load, requestAgain };
}

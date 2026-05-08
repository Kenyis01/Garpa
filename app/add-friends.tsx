import AddFriendsScreen from '@/components/AddFriendsScreen';
import { router } from 'expo-router';

export default function AddFriendsRoute() {
  return <AddFriendsScreen onClose={() => router.back()} />;
}

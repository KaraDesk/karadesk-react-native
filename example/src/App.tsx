import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import KaraDesk, {
  type Destination,
  type KaraDeskError,
  useUnreadConversationCount,
} from '@karadesk/karadesk-react-native';

const SPACE_ID = 'your-space-id';
const IOS_APP_ID = 'your-ios-app-id';
const ANDROID_APP_ID = 'your-android-app-id';

function Button({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const destinations: { title: string; destination: Destination }[] = [
  { title: 'Home', destination: { type: 'home' } },
  { title: 'Messages', destination: { type: 'messages' } },
  {
    title: 'New conversation',
    destination: { type: 'newConversation', message: 'I need help' },
  },
  { title: 'Help center', destination: { type: 'helpCenter' } },
];

export default function App() {
  const unread = useUnreadConversationCount();
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    KaraDesk.initialize({
      spaceId: SPACE_ID,
      iosAppId: IOS_APP_ID,
      androidAppId: ANDROID_APP_ID,
    });
  }, []);

  const login = async () => {
    try {
      await KaraDesk.login({
        id: userId.trim() || undefined,
        email: email.trim() || undefined,
      });
      Alert.alert('Signed in');
    } catch (error) {
      const failure = error as KaraDeskError;
      Alert.alert('Sign in failed', `${failure.code}: ${failure.message}`);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>KaraDesk</Text>
      <Text style={styles.caption}>
        SDK {KaraDesk.version} · {unread} unread
      </Text>

      <Text style={styles.heading}>Open the messenger</Text>
      {destinations.map((item) => (
        <Button
          key={item.title}
          title={item.title}
          onPress={() => KaraDesk.present(item.destination)}
        />
      ))}
      <Button
        title="Help center on its own"
        onPress={() => KaraDesk.present({ type: 'helpCenter' }, 'standalone')}
      />

      <Text style={styles.heading}>Sign in a user</Text>
      <View style={styles.fields}>
        <TextInput
          placeholder="User ID"
          value={userId}
          onChangeText={setUserId}
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
      </View>
      <Button title="Sign in" onPress={login} />
      <Button title="Sign out" onPress={() => KaraDesk.logout()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, paddingTop: 64, gap: 10 },
  title: { fontSize: 28, fontWeight: '700' },
  caption: { color: '#666' },
  heading: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  fields: { gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pressed: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '600' },
});

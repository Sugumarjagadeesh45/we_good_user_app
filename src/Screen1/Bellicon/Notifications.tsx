import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, Platform, ListRenderItem } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NotificationItem from './NotificationItem';

interface NotificationsProps {
  toggleNotifications: () => void;
}

interface NotificationData {
  id: string;
  icon: string;
  title: string;
  text: string;
  time: string;
}

const NOTIFICATIONS_DATA: NotificationData[] = [
  {
    id: '1',
    icon: 'local-offer',
    title: 'Special Offer',
    text: 'Get 20% off on your next ride',
    time: '2 hours ago',
  },
  {
    id: '2',
    icon: 'directions-car',
    title: 'Ride Completed',
    text: 'Your ride to Downtown has been completed',
    time: 'Yesterday',
  },
];

const Notifications: React.FC<NotificationsProps> = ({ toggleNotifications }) => {
  const renderItem: ListRenderItem<NotificationData> = ({ item }) => (
    <NotificationItem
      icon={item.icon}
      title={item.title}
      text={item.text}
      time={item.time}
    />
  );

  return (
    <View style={styles.notificationsContainer}>
      <View style={styles.notificationsHeader}>
        <TouchableOpacity onPress={toggleNotifications}>
          <Ionicons name="arrow-back" size={24} color="#28a745" /> 
        </TouchableOpacity>
        <Text style={styles.notificationsTitle}>Notifications</Text>
      </View>

      <FlatList
        data={NOTIFICATIONS_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  notificationsContainer: {
    width: '75%',
    height: '100%',
    backgroundColor: '#FFFFFF', // replaced WHITE
    padding: 20,
    marginLeft: 'auto',
    // Shadow for depth since it appears to be a drawer/overlay
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  notificationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000', // changed to black for readability
    marginLeft: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default Notifications;

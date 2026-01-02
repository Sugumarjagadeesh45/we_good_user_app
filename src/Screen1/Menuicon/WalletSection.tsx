import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useWallet } from '../../context/WalletContext';

const WalletSection: React.FC = () => {
  const { walletBalance, loading } = useWallet();

  // Format the balance to Indian Rupees
  const formatIndianCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <View style={styles.walletSection}>
      <View style={styles.walletIcon}>
        <FontAwesome name="money" size={20} color="#28a745" />
      </View>
      <View style={styles.walletInfo}>
        <Text style={styles.walletTitle}>Wallet</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#28a745" />
        ) : (
          <Text style={styles.walletBalance}>{formatIndianCurrency(walletBalance)}</Text>
        )}
      </View>
      <Feather name="chevron-right" size={20} color="#A9A9A9" />
    </View>
  );
};

const styles = StyleSheet.create({
  walletSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#D3D3D3',
    borderRadius: 10,
    marginBottom: 20,
  },
  walletIcon: { 
    marginRight: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletInfo: { 
    flex: 1,
  },
  walletTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#000000',
    marginBottom: 4,
  },
  walletBalance: { 
    fontSize: 18, 
    color: '#28a745', 
    fontWeight: '700',
  },
});

export default WalletSection;




// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import Feather from 'react-native-vector-icons/Feather';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';

// const WalletSection: React.FC = () => {
//   return (
//     <View style={styles.walletSection}>
//       <View style={styles.walletIcon}>
//         <FontAwesome name="money" size={20} color="#28a745" />
//       </View>
//       <View style={styles.walletInfo}>
//         <Text style={styles.walletTitle}>Wallet</Text>
//         <Text style={styles.walletBalance}>$50.00</Text>
//       </View>
//       <Feather name="chevron-right" size={20} color="#A9A9A9" />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   walletSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 15,
//     backgroundColor: '#D3D3D3',
//     borderRadius: 10,
//     marginBottom: 20,
//   },
//   walletIcon: { marginRight: 15 },
//   walletInfo: { flex: 1 },
//   walletTitle: { fontSize: 16, fontWeight: '600', color: '#000000' },
//   walletBalance: { fontSize: 14, color: '#28a745', lineHeight: 20 },
// });

// export default WalletSection;
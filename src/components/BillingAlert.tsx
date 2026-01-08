import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  surcharge?: number;
}

interface BillingData {
  distance: number | string;
  duration: number | string;
  fareBreakdown: FareBreakdown;
  totalAmount: number;
  walletBalance: number;
  driverName?: string;
  vehicleType?: string;
}

interface BillingAlertProps {
  visible: boolean;
  onClose: () => void;
  billing: BillingData | null;
  onViewDetails?: () => void;
}

// Default empty billing data
const defaultBillingData: BillingData = {
  distance: '0 km',
  duration: '0 mins',
  fareBreakdown: {
    baseFare: 0,
    distanceCharge: 0,
    timeCharge: 0,
    surcharge: 0
  },
  totalAmount: 0,
  walletBalance: 0,
  driverName: 'Driver',
  vehicleType: 'vehicle'
};

const BillingAlert: React.FC<BillingAlertProps> = ({
  visible,
  onClose,
  billing,
  onViewDetails,
}) => {
  // Use billing data or default
  const billData = billing || defaultBillingData;
  
  // If no billing data and modal is visible, show loading or basic message
  if (visible && !billing) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.alertContainer}>
            <View style={styles.header}>
              <View style={styles.successIcon}>
                <MaterialIcons name="hourglass-empty" size={60} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>Processing Bill...</Text>
              <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onClose}
            >
              <Text style={styles.primaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const formatDistance = (dist: number | string): string => {
    if (typeof dist === 'string') return dist;
    return `${dist.toFixed(2)} km`;
  };

  const formatDuration = (dur: number | string): string => {
    if (typeof dur === 'string') return dur;
    return `${Math.round(dur)} mins`;
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Header with Success Icon */}
          <View style={styles.header}>
            <View style={styles.successIcon}>
              <MaterialIcons name="check-circle" size={60} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Ride Completed!</Text>
            <Text style={styles.subtitle}>Thank you for riding with us</Text>
          </View>

          {/* Billing Details */}
          <ScrollView
            style={styles.detailsContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Trip Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trip Summary</Text>

              <View style={styles.row}>
                <View style={styles.iconLabelContainer}>
                  <MaterialIcons name="straighten" size={18} color="#666666" />
                  <Text style={styles.label}>Distance Travelled</Text>
                </View>
                <Text style={styles.value}>{formatDistance(billData.distance)}</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.iconLabelContainer}>
                  <MaterialIcons name="access-time" size={18} color="#666666" />
                  <Text style={styles.label}>Duration</Text>
                </View>
                <Text style={styles.value}>{formatDuration(billData.duration)}</Text>
              </View>

              {billData.driverName && (
                <View style={styles.row}>
                  <View style={styles.iconLabelContainer}>
                    <MaterialIcons name="person" size={18} color="#666666" />
                    <Text style={styles.label}>Driver</Text>
                  </View>
                  <Text style={styles.value}>{billData.driverName}</Text>
                </View>
              )}

              {billData.vehicleType && (
                <View style={styles.row}>
                  <View style={styles.iconLabelContainer}>
                    <MaterialIcons name="directions-car" size={18} color="#666666" />
                    <Text style={styles.label}>Vehicle Type</Text>
                  </View>
                  <Text style={styles.value}>
                    {billData.vehicleType.charAt(0).toUpperCase() + billData.vehicleType.slice(1)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Fare Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fare Breakdown</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Base Fare</Text>
                <Text style={styles.value}>{formatCurrency(billData.fareBreakdown.baseFare)}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Distance Charge</Text>
                <Text style={styles.value}>{formatCurrency(billData.fareBreakdown.distanceCharge)}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Time Charge</Text>
                <Text style={styles.value}>{formatCurrency(billData.fareBreakdown.timeCharge)}</Text>
              </View>

              {(billData.fareBreakdown.surcharge || 0) > 0 && (
                <View style={styles.row}>
                  <Text style={styles.label}>Surcharge</Text>
                  <Text style={styles.value}>{formatCurrency(billData.fareBreakdown.surcharge)}</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Total Amount */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{formatCurrency(billData.totalAmount)}</Text>
            </View>

            {/* Wallet Credit Notification */}
            <View style={styles.walletCredit}>
              <MaterialIcons name="account-balance-wallet" size={24} color="#2E7D32" />
              <View style={styles.walletTextContainer}>
                <Text style={styles.walletText}>
                  {`${formatCurrency(billData.totalAmount)} will be paid from your wallet`}
                </Text>
                <Text style={styles.walletBalance}>
                  {`Current Balance: ${formatCurrency(billData.walletBalance)}`}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onClose}
            >
              <Text style={styles.primaryButtonText}>Pay & Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  alertContainer: {
    width: width * 0.9,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
  },
  detailsContainer: {
    maxHeight: 450,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  walletCredit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
  },
  walletTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  walletText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 15,
    color: '#388E3C',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default BillingAlert;
// D:\EazyGo\easyGofrontend-main\src\Screen1\Taxibooking\RideTypeSelector.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BikeIcon from '../../../assets001/bike.svg';
import LorryIcon from '../../../assets001/lorry.svg';
import TaxiIcon from '../../../assets001/taxi.svg';

interface RideTypeSelectorProps {
  selectedRideType: string;
  setSelectedRideType: (type: string) => void;
  estimatedPrice: number | null;
  distance: string;
  dynamicPrices: {
    bike: number;
    taxi: number;
    port: number;
  };
}

const RideTypeSelector: React.FC<RideTypeSelectorProps> = ({ 
  selectedRideType, 
  setSelectedRideType, 
  estimatedPrice, 
  distance, 
  dynamicPrices 
}) => {
  const renderVehicleIcon = (type: string, size: number = 24, color: string = '#333333') => {
    switch (type) {
      case 'port':
        return <LorryIcon width={size} height={size} fill={color} />;
      case 'taxi':
        return <TaxiIcon width={size} height={size} fill={color} />;
      case 'bike':
        return <BikeIcon width={size} height={size} fill={color} />;
      default:
        return <TaxiIcon width={size} height={size} fill={color} />;
    }
  };

  return (
    <View style={styles.rideTypeContainer}>
      <TouchableOpacity
        style={[
          styles.rideTypeButton,
          selectedRideType === 'port' && styles.selectedRideTypeButton,
        ]}
        onPress={() => setSelectedRideType('port')}
        activeOpacity={0.7}
      >
        <View style={styles.rideIconContainer}>
          {renderVehicleIcon('port', 24, selectedRideType === 'port' ? '#FFFFFF' : '#333333')}
        </View>
        <View style={styles.rideInfoContainer}>
          <Text style={[styles.rideTypeText, selectedRideType === 'port' && styles.selectedRideTypeText]}>CarGo Porter</Text>
          <Text style={[styles.rideDetailsText, selectedRideType === 'port' && styles.selectedRideDetailsText]}>Max 5 ton</Text>
          <Text style={styles.ridePriceText}>
            {dynamicPrices.port > 0 ? `₹${dynamicPrices.port}/km` : 'Loading...'}
          </Text>
        </View>
        {selectedRideType === 'port' && (
          <View style={styles.checkmarkContainer}>
            <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.rideTypeButton,
          selectedRideType === 'taxi' && styles.selectedRideTypeButton,
        ]}
        onPress={() => setSelectedRideType('taxi')}
        activeOpacity={0.7}
      >
        <View style={styles.rideIconContainer}>
          {renderVehicleIcon('taxi', 24, selectedRideType === 'taxi' ? '#FFFFFF' : '#333333')}
        </View>
        <View style={styles.rideInfoContainer}>
          <Text style={[styles.rideTypeText, selectedRideType === 'taxi' && styles.selectedRideTypeText]}>Taxi</Text>
          <Text style={[styles.rideDetailsText, selectedRideType === 'taxi' && styles.selectedRideDetailsText]}>4 seats</Text>
          <Text style={styles.ridePriceText}>
            {dynamicPrices.taxi > 0 ? `₹${dynamicPrices.taxi}/km` : 'Loading...'}
          </Text>
        </View>
        {selectedRideType === 'taxi' && (
          <View style={styles.checkmarkContainer}>
            <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.rideTypeButton,
          selectedRideType === 'bike' && styles.selectedRideTypeButton,
        ]}
        onPress={() => setSelectedRideType('bike')}
        activeOpacity={0.7}
      >
        <View style={styles.rideIconContainer}>
          {renderVehicleIcon('bike', 24, selectedRideType === 'bike' ? '#FFFFFF' : '#333333')}
        </View>
        <View style={styles.rideInfoContainer}>
          <Text style={[styles.rideTypeText, selectedRideType === 'bike' && styles.selectedRideTypeText]}>Motorcycle</Text>
          <Text style={[styles.rideDetailsText, selectedRideType === 'bike' && styles.selectedRideDetailsText]}>1 person</Text>
          <Text style={styles.ridePriceText}>
            {dynamicPrices.bike > 0 ? `₹${dynamicPrices.bike}/km` : 'Loading...'}
          </Text>
        </View>
        {selectedRideType === 'bike' && (
          <View style={styles.checkmarkContainer}>
            <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  rideTypeContainer: { marginBottom: 15 },
  rideTypeButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 5,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  selectedRideTypeButton: {
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: '#4caf50'
  },
  rideIconContainer: {
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rideInfoContainer: { flex: 1 },
  rideTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  selectedRideTypeText: { color: '#FFFFFF' },
  rideDetailsText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 6,
  },
  selectedRideDetailsText: { color: '#FFFFFF' },
  ridePriceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
});

export default RideTypeSelector;
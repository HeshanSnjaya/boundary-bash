import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

export default function QRScanner({ onScan, isScanning = true }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const isFocused = useIsFocused(); // Avoid rendering camera when screen not focused
  const { colors } = useTheme();

  useEffect(() => {
    // Request permission once if not granted
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Reset scanned when screen refocuses
  useEffect(() => {
    if (isFocused) setScanned(false);
  }, [isFocused]);

  const handleBarcodeScanned = useCallback(({ data, type }) => {
    if (!isScanning || scanned) return;
    setScanned(true);
    onScan?.(data);
    // Allow re-scan after short delay
    setTimeout(() => setScanned(false), 1500);
  }, [isScanning, scanned, onScan]);

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>
          Camera permission is required to scan QR codes.
        </Text>
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
          Enable camera permission in system settings and restart the app.
        </Text>
      </View>
    );
  }

  // Important: Only render CameraView while screen is focused
  if (!isFocused) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        // Only attach scanner callback when scanning is active
        onBarcodeScanned={isScanning && !scanned ? handleBarcodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417', 'code128', 'code39', 'ean13'],
        }}
      />
      {/* Minimal overlay with visible scan area */}
      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={[styles.hint, { color: '#fff' }]}>
          Align QR code within the frame
        </Text>
      </View>
    </View>
  );
}

const FRAME_SIZE = 240;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#00E5A8',
    backgroundColor: 'transparent',
  },
  hint: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

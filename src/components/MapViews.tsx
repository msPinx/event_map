// Native-only MapView wrapper. The .web.tsx sibling provides a fallback.
import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { colors } from "@/src/theme";

const GRAYSCALE_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f4f4f4" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#444" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#fff" }] },
  { featureType: "road", stylers: [{ color: "#e8e8e8" }] },
  { featureType: "water", stylers: [{ color: "#dcdcdc" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const PRAGUE_REGION = {
  latitude: 50.0810,
  longitude: 14.4205,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export type MarkerItem = {
  id: string;
  latitude: number;
  longitude: number;
};

export function EventsMap({
  markers,
  onMarkerPress,
}: {
  markers: MarkerItem[];
  onMarkerPress: (id: string) => void;
}) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={PRAGUE_REGION}
      provider={PROVIDER_DEFAULT}
      customMapStyle={GRAYSCALE_STYLE}
      showsPointsOfInterest={false}
      showsCompass={false}
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          onPress={() => onMarkerPress(m.id)}
          testID={`map-marker-${m.id}`}
        >
          <View style={styles.markerSquare} />
        </Marker>
      ))}
    </MapView>
  );
}

export function SingleLocationMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
    >
      <Marker coordinate={{ latitude, longitude }}>
        <View style={styles.markerSquare} />
      </Marker>
    </MapView>
  );
}

export const __isNativeMap = true;

const styles = StyleSheet.create({
  markerSquare: {
    width: 18,
    height: 18,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: colors.surfaceInverse,
  },
});

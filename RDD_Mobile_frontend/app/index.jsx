import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const COGNITO_HOSTED_UI_URL = "XXX";

export const getAccessToken = async () => {
  try {
    const token = await AsyncStorage.getItem("access_token");
    if (token !== null) {
      return token;
    }
    console.log("No token found");
  } catch (e) {
    console.error("Failed to fetch the token", e);
  }
  return null;
};

export const getIdToken = async () => {
  try {
    const token = await AsyncStorage.getItem("id_token");
    if (token !== null) {
      return token;
    }
    console.log("No token found");
  } catch (e) {
    console.error("Failed to fetch the token", e);
  }
  return null;
};

export default function Index() {
  const [showWebView, setShowWebView] = useState(false);
  const router = useRouter();

  const handleLoginRedirect = async (data) => {
    const url = data.url;

    // Check if the URL is the callback URL
    if (url.startsWith("XXX")) {
      // Parse the query string to extract the 'code' parameter
      const params = new URLSearchParams(url.split("?")[1]);
      const code = params.get("code");

      if (!code) {
        Alert.alert("Error", "Authorization code not found in redirect");
        return;
      }

      try {
        const formEncodedData = new FormData();
        formEncodedData.append("code", code);
        formEncodedData.append("type", "mobile");
        const response = await axios.post("XXX", formEncodedData);
        const access_token = response.data.data.access_token;
        const id_token = response.data.data.token;
        // Store the token securely in AsyncStorage
        await AsyncStorage.setItem("access_token", access_token);
        await AsyncStorage.setItem("id_token", id_token);

        // Redirect user to another screen after successful login
        router.push("/PhotoUploadScreen");
      } catch (error) {
        console.error("Error exchanging code for tokens:", error);
        Alert.alert("Error", "Failed to retrieve tokens");
      }
    }
  };

  return (
    <View style={styles.container}>
      {showWebView ? (
        <WebView
          originWhitelist={["*"]}
          source={{ uri: COGNITO_HOSTED_UI_URL }}
          onNavigationStateChange={handleLoginRedirect}
          onError={() => setShowWebView(false)}
          style={styles.webview}
        />
      ) : (
        <>
          <Text style={styles.title}>LOGIN</Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => setShowWebView(true)}
          >
            <Text style={styles.loginButtonText}>LOGIN WITH COGNITO</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  webview: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#D87042",
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: "#D87042",
    borderRadius: 5,
    padding: 15,
    alignItems: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

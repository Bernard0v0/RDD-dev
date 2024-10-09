import React, { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const login = async (username, password) => {
  const formData = new FormData();
  formData.append("name", username);
  formData.append("password", password);

  const URL = "http://"; // Change accordingly

  const response = await axios.post(`${URL}/user/login`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const token = response.data.data;

  if (!token) {
    throw new Error("Token is null or undefined");
  }

  await AsyncStorage.setItem("jwtToken", token);
  return response.data;
};

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const router = useRouter();

  const validateInputs = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your username");
      return;
    }

    if (!password) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    try {
      await login(email, password);
      const token = await getToken();
      console.log("Retrieved Token:", token);

      router.push("/PhotoUploadScreen");
    } catch (error) {
      console.error("Error during login or token retrieval:", error);
      Alert.alert("Login failed", "Invalid credentials or server error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LOGIN</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Please write your email"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secureTextEntry}
        />
        <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}>
          <Icon
            name={secureTextEntry ? "eye-off" : "eye"}
            size={20}
            color="gray"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity>
        <Text style={styles.forgotPassword}>Forgot password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginButton} onPress={validateInputs}>
        <Text style={styles.loginButtonText}>LOGIN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#D87042",
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D87042",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D87042",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  forgotPassword: {
    color: "gray",
    marginBottom: 40,
    alignSelf: "flex-end",
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

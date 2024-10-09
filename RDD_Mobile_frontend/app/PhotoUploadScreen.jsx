import { CameraType } from "expo-camera/build/legacy/Camera.types";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useState, useRef } from "react";
import { Image } from "expo-image";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import AWS from "aws-sdk";
import axios from "axios";
import { getToken } from "../apps/index";

export default function App() {
  const [facing, setFacing] = useState(CameraType.back);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  AWS.config.update({
    accessKeyId: "", // Fill in accordingly
    secretAccessKey: "", // Fill in accordingly
    sessionToken: "", // Fill in accordingly
    region: "", // Fill in accordingly
  });
  const s3 = new AWS.S3();

  const URL = "http://"; // Change accordingly

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
      setIsCameraOpen(false);
    }
  };

  const openCamera = () => {
    setIsCameraOpen(true);
    setPhotoUri(null);
  };

  const retakePhoto = () => {
    setPhotoUri(null);
    setIsCameraOpen(true);
  };

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access location was denied");
      return null;
    }
    let location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };

  const uploadToS3 = async (uri, fileName, location) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const params = {
      Bucket: "", // Fill in your Bucket name
      Key: fileName,
      Body: blob,
      ACL: "public-read",
    };

    const data = await s3.upload(params).promise();
    const objectUrl = data.Location;

    return {
      latitude: location.latitude,
      longitude: location.longitude,
      imgSourceUrl: objectUrl,
    };
  };

  const uploadPhotoFromCamera = async () => {
    try {
      setLoading(true);
      const location = await getLocation();
      if (!location) return;

      const fileName = photoUri.split("/").pop();
      const { latitude, longitude, imgSourceUrl } = await uploadToS3(
        photoUri,
        fileName,
        location
      );

      setPhotoUri(null);

      const token = await getToken();
      if (token) {
        const formEncodedData = new FormData();
        formEncodedData.append("latitude", latitude);
        formEncodedData.append("longitude", longitude);
        formEncodedData.append("imgSourceUrl", imgSourceUrl);
        try {
          const response = await axios.post(
            `${URL}/api/img/update`,
            formEncodedData,
            {
              headers: {
                Authorization: token,
              },
            }
          );
          console.log("Response:", response.data);
          if (response.data.code === 0) {
            Alert.alert(
              "Successful Upload",
              "Your uploaded photo has defect detected!"
            );
          } else if (response.data.code === 1) {
            Alert.alert("Upload failed", `${response.data.message}`);
          }
        } catch {
          console.error("Error in POST request:", error);
        }
      } else {
        console.error("No token found");
      }
    } catch (error) {
      Alert.alert("Error", "Upload failed. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const uploadSelectedPhotos = async () => {
    try {
      setLoading(true);
      const location = await getLocation();
      if (!location) return;

      for (const photo of selectedPhotos) {
        const fileName = photo.uri.split("/").pop();
        const { latitude, longitude, imgSourceUrl } = await uploadToS3(
          photo.uri,
          fileName,
          location
        );

        setSelectedPhotos([]);

        const token = await getToken();
        if (token) {
          const formEncodedData = new FormData();
          formEncodedData.append("latitude", latitude);
          formEncodedData.append("longitude", longitude);
          formEncodedData.append("imgSourceUrl", imgSourceUrl);
          try {
            const response = await axios.post(
              `${URL}/api/img/update`,
              formEncodedData,
              {
                headers: {
                  Authorization: token,
                },
              }
            );
            console.log("Response:", response.data);
            if (response.data.code === 0) {
              Alert.alert(
                "Successful Upload",
                "Your uploaded photo has defect detected!"
              );
            } else if (response.data.code === 1) {
              Alert.alert("Upload failed", `${response.data.message}`);
            }
          } catch (error) {
            console.error("Error in POST request:", error);
          }
        } else {
          console.error("No token found");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Upload failed. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      setSelectedPhotos(result.assets);
    }
  };

  const cancelSelection = () => {
    setSelectedPhotos([]);
  };

  return (
    <View style={styles.container}>
      {isCameraOpen ? (
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={takePhoto}>
              <Text style={styles.text}>Shoot</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setIsCameraOpen(false)}
            >
              <Text style={styles.text}>Close Camera</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : selectedPhotos.length > 0 ? (
        <View style={styles.container}>
          {/* Show spinner if loading */}
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <>
              <View style={styles.imagePreviewContainer}>
                {selectedPhotos.map((photo, index) => (
                  <Image
                    key={index}
                    source={{ uri: photo.uri }}
                    style={styles.multiPreview}
                  />
                ))}
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={cancelSelection}
                >
                  <Text style={styles.text}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={uploadSelectedPhotos}
                >
                  <Text style={styles.text}>Upload</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ) : photoUri ? (
        <View style={styles.container}>
          {/* Show spinner if loading */}
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <>
              <Image source={{ uri: photoUri }} style={styles.preview} />
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={retakePhoto}>
                  <Text style={styles.text}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={uploadPhotoFromCamera}
                >
                  <Text style={styles.text}>Upload</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.mainButton} onPress={openCamera}>
            <Text style={styles.mainButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mainButton} onPress={pickImages}>
            <Text style={styles.mainButtonText}>Upload From Phone</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    height: "90%",
    width: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 10,
    width: "100%",
    justifyContent: "space-around",
  },
  button: {
    padding: 10,
    backgroundColor: "#D87042",
    borderRadius: 5,
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  mainButton: {
    backgroundColor: "#D87042",
    borderRadius: 5,
    padding: 15,
    marginBottom: 20,
    width: "80%",
    alignItems: "center",
  },
  mainButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  preview: {
    flex: 1,
    width: 400,
    height: 200,
    marginBottom: 40,
  },
  multiPreview: {
    width: 150,
    height: 150,
    marginBottom: 20,
    margin: 5,
  },
  imagePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});

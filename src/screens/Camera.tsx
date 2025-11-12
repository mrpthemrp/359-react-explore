import React, {useRef, useState, useEffect} from "react";
import {View, Text, Button, StyleSheet, Alert} from "react-native";
import {CameraView, CameraType, useCameraPermissions} from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImageManipulator from "expo-image-manipulator";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import {decodeJpeg} from "@tensorflow/tfjs-react-native";
import {useNavigation} from "@react-navigation/native";
import type {NativeStackNavigationProp} from "@react-navigation/native-stack";
import {RootStackParamList} from "../../App";

type MemeCameraNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "MemeCamera"
>;

export default function Camera() {
    const navigation = useNavigation<MemeCameraNavigationProp>();
    const cameraRef = useRef<any>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [model, setModel] = useState<any>(null);
    const [facing, setFacing] = useState<CameraType>("back");

    const [permission, requestPermission] = useCameraPermissions();
    const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

    useEffect(() => {
        (async () => {
            await tf.ready();
            console.log("TF ready");
            const loadedModel = await tf.loadGraphModel(
                "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1",
                {fromTFHub: true}
            );
            setModel(loadedModel);
            setModelLoaded(true);
            console.log("Model loaded");
        })();
    }, []);

    const loadImageAsTensor = async (uri: string) => {
        const response = await fetch(uri);
        const buffer = await response.arrayBuffer();
        const u8array = new Uint8Array(buffer);
        let imageTensor = decodeJpeg(u8array);
        imageTensor = tf.image.resizeBilinear(imageTensor, [224, 224]);
        imageTensor = imageTensor.div(255.0);
        imageTensor = imageTensor.expandDims(0);
        return imageTensor;
    };

    const takePictureAndNavigate = async () => {
        if (!cameraRef.current || !model) {
            Alert.alert("Wait", "Camera or model not ready yet.");
            console.log("Camera or model not ready");
            return;
        }

        if (!mediaPermission?.granted) {
            const perm = await requestMediaPermission();
            if (!perm.granted) {
                Alert.alert("Permission required", "Cannot save photo without permission.");
                console.log("Media permission denied");
                return;
            }
        }

        try {
            console.log("Capturing photo...");
            const photo = await cameraRef.current.takePictureAsync({
                quality: 1,
                skipMetadata: true,
                format: "jpeg",
            });

            if (!photo?.uri) {
                console.log("No photo captured");
                return;
            }
            console.log("Photo captured:", photo.uri);

            // Save to camera roll
            const asset = await MediaLibrary.createAssetAsync(photo.uri);
            console.log("Saved photo to camera roll:", asset.uri);

            // Resolve local URI (iOS PH asset)
            const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
            const usableUri = assetInfo.localUri || asset.uri;

            console.log("Navigating with photo URI:", usableUri);
            navigation.navigate("MemeComparison", {photoUri: usableUri});

        } catch (error) {
            console.log("Error capturing photo:", error);
            Alert.alert("Error", "Failed to capture photo");
        }
    };

    if (!permission) return <Text>Requesting camera permission…</Text>;
    if (!permission.granted)
        return <Button title="Grant permission" onPress={requestPermission}/>;

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.cameraStyle}
                facing={facing}
                onCameraReady={() => {
                    setCameraReady(true);
                    console.log("Camera ready");
                }}
                onMountError={(error) => console.log("Camera mount error:", error)}
            />
            <Button
                title="Capture & Recognize"
                onPress={takePictureAndNavigate}
                disabled={!cameraReady || !modelLoaded}
            />
            <Button
                title="Toggle Camera"
                onPress={() => setFacing(facing === "back" ? "front" : "back")}
            />
            {!cameraReady && <Text>Loading camera…</Text>}
            {!modelLoaded && <Text>Loading model…</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    cameraStyle: {
        width: "90%",
        height: "75%",
    },
});

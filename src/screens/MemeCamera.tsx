import React, {useRef, useState, useEffect} from "react";
import {View, Text, Button, StyleSheet, Alert} from "react-native";
import {CameraView, CameraType, useCameraPermissions} from "expo-camera";
import * as ImageManipulator from 'expo-image-manipulator';
import {Asset} from "expo-asset";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import {decodeJpeg} from "@tensorflow/tfjs-react-native";
import {MemeTemplates} from "../../assets/templates/MemeTemplates";
import * as MediaLibrary from "expo-media-library";

export default function MemeCamera() {
    const cameraRef = useRef<any>(null);
    const [captured, setCaptured] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [model, setModel] = useState<any>(null);
    const [facing, setFacing] = useState<CameraType>("back");
    const [cameraReady, setCameraReady] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);

    const [permission, requestPermission] = useCameraPermissions();
    const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

    // Load MobileNet
    useEffect(() => {
        (async () => {
            await tf.ready();
            const loadedModel = await tf.loadGraphModel(
                "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1",
                {fromTFHub: true}
            );
            setModel(loadedModel);
            setModelLoaded(true);
            console.log("Model loaded");
        })();
    }, []);

    const cosineSimilarity = (a: tf.Tensor, b: tf.Tensor) => {
        const dot = tf.sum(tf.mul(a, b));
        const norm = tf.norm(a).mul(tf.norm(b));
        return dot.div(norm).dataSync()[0];
    };

    const loadImageAsTensor = async (uri: string) => {
        const response = await fetch(uri);
        const buffer = await response.arrayBuffer();
        const u8array = new Uint8Array(buffer);
        let imageTensor = decodeJpeg(u8array);
        imageTensor = tf.image.resizeBilinear(imageTensor, [224, 224]);
        imageTensor = imageTensor.div(255.0);
        imageTensor = imageTensor.expandDims(0); // batch dimension
        return imageTensor;
    };

    const takePictureAndRecognize = async () => {
        if (!cameraRef.current || !model) {
            Alert.alert("Wait", "Camera or model not ready yet.");
            return;
        }

        if (!mediaPermission?.granted) {
            const perm = await requestMediaPermission();
            if (!perm.granted) {
                Alert.alert("Permission required", "Cannot save photo without permission.");
                return;
            }
        }

        try {
            console.log("Capturing photo...");
            const photo = await cameraRef.current.takePictureAsync({
                quality: 1,
                skipMetadata: true,
                format: "jpeg"
            });
            if (!photo?.uri) {
                console.log("No photo captured!");
                return;
            }
            console.log("Photo captured:", photo.uri);

            // Save to camera roll
            const asset = await MediaLibrary.createAssetAsync(photo.uri);
            setCaptured(asset.uri);
            console.log("Saved photo to camera roll:", asset.uri);

            // Convert captured photo to JPEG (guarantee)
            const capturedJPEG = await ImageManipulator.manipulateAsync(
                asset.uri,
                [],
                {format: ImageManipulator.SaveFormat.JPEG}
            );
            console.log("Converted captured photo to JPEG:", capturedJPEG.uri);

            // Load tensor
            const imageTensor = await loadImageAsTensor(capturedJPEG.uri);
            console.log("Image tensor shape:", imageTensor.shape);

            const embedding = model.execute(imageTensor) as tf.Tensor;

            // Compare against templates
            let bestScore = -1;
            let bestTemplate: string | null = null;

            for (const t of MemeTemplates) {
                console.log("Processing template:", t.name);
                const assetTemplate = Asset.fromModule(t.src);
                await assetTemplate.downloadAsync();

                // Convert template to JPEG if needed
                const templateJPEG = await ImageManipulator.manipulateAsync(
                    assetTemplate.localUri || assetTemplate.uri,
                    [],
                    {format: ImageManipulator.SaveFormat.JPEG}
                );

                console.log("Template JPEG URI:", templateJPEG.uri);

                const tensor = await loadImageAsTensor(templateJPEG.uri);
                const templateEmbedding = model.execute(tensor) as tf.Tensor;

                const similarity = cosineSimilarity(embedding, templateEmbedding);
                console.log(`Similarity with ${t.name}:`, similarity);

                if (similarity > bestScore) {
                    bestScore = similarity;
                    bestTemplate = t.name;
                }
            }

            const output = bestTemplate
                ? `${bestTemplate} (similarity: ${Math.round(bestScore * 100)}%)`
                : "No match found";

            setResult(output);
            Alert.alert("Result", output);

        } catch (error) {
            console.log("Error in takePictureAndRecognize:", error);
            Alert.alert("Error", "Failed to capture or process photo");
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
                    console.log("Camera ready");
                    setCameraReady(true);
                }}
                onMountError={(error) => console.log("Camera mount error:", error)}
            />
            <Button
                title="Capture & Recognize"
                onPress={takePictureAndRecognize}
                disabled={!cameraReady || !modelLoaded}
            />
            <Button
                title="Toggle Camera"
                onPress={() => setFacing(facing === "back" ? "front" : "back")}
            />
            {!cameraReady && <Text>Loading camera…</Text>}
            {!modelLoaded && <Text>Loading model…</Text>}
            {result && <Text style={{marginTop: 10}}>{result}</Text>}
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

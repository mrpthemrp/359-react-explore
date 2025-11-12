import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";
import { Asset } from "expo-asset";
import { MemeTemplates } from "../../assets/templates/MemeTemplates";
import * as ImageManipulator from "expo-image-manipulator";
import type { RootStackParamList } from "../../App";

type MemeComparisonRouteProp = RouteProp<RootStackParamList, "MemeComparison">;

export default function MemeComparison() {
    const route = useRoute<MemeComparisonRouteProp>();
    const { photoUri } = route.params;

    const [result, setResult] = useState<string | null>(null);
    const [matchedTemplateUri, setMatchedTemplateUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

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
        imageTensor = imageTensor.expandDims(0);
        return imageTensor;
    };

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                await tf.ready();
                const model = await tf.loadGraphModel(
                    "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1",
                    { fromTFHub: true }
                );

                // Convert captured photo to JPEG and tensor
                const capturedJPEG = await ImageManipulator.manipulateAsync(photoUri, [], { format: ImageManipulator.SaveFormat.JPEG });
                const capturedTensor = await loadImageAsTensor(capturedJPEG.uri);
                const capturedEmbedding = model.execute(capturedTensor) as tf.Tensor;

                // Compare against templates
                let bestScore = -1;
                let bestTemplate: typeof MemeTemplates[0] | null = null;

                for (const t of MemeTemplates) {
                    const asset = Asset.fromModule(t.src);
                    await asset.downloadAsync();
                    const templateJPEG = await ImageManipulator.manipulateAsync(
                        asset.localUri || asset.uri,
                        [],
                        { format: ImageManipulator.SaveFormat.JPEG }
                    );
                    const tensor = await loadImageAsTensor(templateJPEG.uri);
                    const templateEmbedding = model.execute(tensor) as tf.Tensor;

                    const similarity = cosineSimilarity(capturedEmbedding, templateEmbedding);
                    console.log(`Similarity with ${t.name}:`, similarity);

                    if (similarity > bestScore) {
                        bestScore = similarity;
                        bestTemplate = t;
                    }
                }

                if (bestTemplate) {
                    setResult(`${bestTemplate.name} (similarity: ${Math.round(bestScore * 100)}%)`);
                    setMatchedTemplateUri(Asset.fromModule(bestTemplate.src).uri);
                } else {
                    setResult("No match found");
                }
            } catch (err) {
                console.log("Error comparing images:", err);
                setResult("Error processing image");
            } finally {
                setLoading(false);
            }
        })();
    }, [photoUri]);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Captured Photo:</Text>
            <Image source={{ uri: photoUri }} style={styles.image} />

            {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}
            {!loading && result && (
                <>
                    <Text style={styles.result}>{result}</Text>
                    {matchedTemplateUri && (
                        <>
                            <Text style={styles.title}>Matched Template:</Text>
                            <Image source={{ uri: matchedTemplateUri }} style={styles.image} />
                        </>
                    )}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        paddingVertical: 20,
        paddingHorizontal: 10,
    },
    image: {
        width: 300,
        height: 300,
        resizeMode: "contain",
        marginVertical: 10,
    },
    result: {
        fontSize: 18,
        fontWeight: "bold",
        marginVertical: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
    },
});

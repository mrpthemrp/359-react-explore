import React, {useEffect, useState} from "react";
import {Text, Image, StyleSheet, ActivityIndicator, ScrollView} from "react-native";
import {useNavigation} from "@react-navigation/native";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import {decodeJpeg} from "@tensorflow/tfjs-react-native";
import {Asset} from "expo-asset";
import {MemeTemplates} from "../../assets/templates/MemeTemplates";
import * as ImageManipulator from "expo-image-manipulator";
import type {RootStackParamList} from "../../App";
import {CTAButton} from "../Components";
import {NativeStackNavigationProp} from "@react-navigation/native-stack";

type MemeComparisonNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "MemeComparison"
>;

type Props = {
    route: { params: { photoUri: string } };
};

export default function MemeComparison({route}: Props) {
    const navigation = useNavigation<MemeComparisonNavigationProp>();
    const {photoUri} = route.params;

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

    const SIMILARITY_THRESHOLD = 0.1;

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                await tf.ready();
                const model = await tf.loadGraphModel(
                    "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1",
                    {fromTFHub: true}
                );

                // Convert captured photo to JPEG (modern API)
                const capturedJPEG = await ImageManipulator.manipulateAsync(photoUri, [], {
                    compress: 1,
                    format: ImageManipulator.SaveFormat.JPEG,
                });

                const capturedTensor = await loadImageAsTensor(capturedJPEG.uri);
                const capturedEmbedding = model.execute(capturedTensor) as tf.Tensor;

                let bestScore = -1;
                let bestTemplate: typeof MemeTemplates[0] | null = null;

                for (const t of MemeTemplates) {
                    const asset = Asset.fromModule(t.src);
                    await asset.downloadAsync();

                    const templateJPEG = await ImageManipulator.manipulateAsync(
                        asset.localUri || asset.uri,
                        [],
                        {compress: 1, format: ImageManipulator.SaveFormat.JPEG} // updated API
                    );

                    const tensor = await loadImageAsTensor(templateJPEG.uri);
                    const templateEmbedding = model.execute(tensor) as tf.Tensor;

                    const similarity = Math.abs(cosineSimilarity(capturedEmbedding, templateEmbedding));
                    console.log(`Similarity with ${t.name}:`, similarity);

                    if (similarity > bestScore) {
                        bestScore = similarity;
                        bestTemplate = t;
                    }
                }

                if (bestTemplate && bestScore >= SIMILARITY_THRESHOLD) {
                    setResult(`${bestTemplate.name} (similarity: ${Math.round(bestScore * 100)}%)`);
                    setMatchedTemplateUri(Asset.fromModule(bestTemplate.src).uri);
                } else {
                    setResult("No match found");
                    setMatchedTemplateUri(null);
                }
            } catch (err) {
                console.log("Error comparing images:", err);
                setResult("Error processing image");
                setMatchedTemplateUri(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [photoUri]);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Captured Photo:</Text>
            <Image source={{uri: photoUri}} style={styles.image}/>

            {loading && <ActivityIndicator size="large" color="#007AFF" style={styles.loader}/>}
            {!loading && result && (
                <>
                    <Text style={styles.result}>{result}</Text>
                    {matchedTemplateUri && (
                        <>
                            <Text style={styles.title}>Matched Template:</Text>
                            <Image source={{uri: matchedTemplateUri}} style={styles.meme}/>
                        </>
                    )}
                </>
            )}
            <CTAButton title={"Go Back"} onPress={() => navigation.navigate("MemeCamera")}/>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        paddingVertical: 30,
        paddingHorizontal: 10,
        marginVertical: 60,
    },
    loader: {
        margin: 50,
    },
    image: {
        width: 200,
        height: 200,
        resizeMode: "cover",
        overflow: "hidden",
        marginVertical: 10,
    }, meme: {
        width: "80%",
        height: "80%",
        resizeMode: "contain",
        overflow: "hidden",
        marginVertical: 10,
    },
    result: {
        fontSize: 18,
        fontWeight: "bold",
        marginVertical: 10,
        fontFamily: "ComicSans",
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        fontFamily: "ComicSans",
    },
});

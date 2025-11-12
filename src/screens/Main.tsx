import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {useNavigation} from '@react-navigation/native';
import {StyleSheet, View, Text, Image} from "react-native";
import {CTAButton} from "../Components";

export default function Main() {
    const navigation = useNavigation();
    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View style={styles.container2}>
                    <Text style={styles.text}>Meme Recognizer App</Text>
                    <Image style={styles.img} source={require("../../assets/imgs/cat.jpg")}/>
                    <CTAButton title={"Open Meme Recognizer Camera"} onPress={() =>
                        // @ts-ignore
                        navigation.navigate("MemeCamera")
                    }/>
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container2: {
        flexDirection: "column",
        gap: 50,
        alignItems: 'center',
    },
    img: {
        resizeMode: "cover",
        alignSelf: "center",
    },
    text: {
        fontFamily: "ComicSans",
        fontSize: 25
    }
});

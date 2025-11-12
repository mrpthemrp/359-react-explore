import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {useNavigation} from '@react-navigation/native';
import {StyleSheet, View, Text, Image} from "react-native";
import {CTAButton} from "../Components";

export default function Main() {
    const navigation = useNavigation();
    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View>
                    <Image style={styles.img} source={require("../../assets/imgs/cat.jpg")}/>
                    <Text style={{fontFamily: "ComicSans"}}>Open up App.tsx to start working on your app!</Text>
                    <CTAButton title={"go to screen1"} onPress={() =>
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
    img: {
        resizeMode: "cover",
        alignSelf: "center",
    }
});

import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {StyleSheet, View, Text} from "react-native";
import {StatusBar} from "expo-status-bar";
import {theme} from "../utils/Theme";

export default function Main() {
    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View>
                    <Text style={{fontFamily: "ComicSans"}}>Open up App.tsx to start working on your app!</Text>
                    <StatusBar style="auto"/>
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
});

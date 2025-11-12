import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {useNavigation} from '@react-navigation/native';
import {StyleSheet, View, Text} from "react-native";
import {CTAButton} from "../Components";

// @ts-ignore
export default function Screen1() {
    const navigation = useNavigation();
    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View>
                    <Text style={{fontFamily: "ComicSans"}}>Screen 1</Text>
                    <CTAButton title={"go home"} onPress={() => {
                    // @ts-ignore
                        navigation.navigate("Main");
                }}/>
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

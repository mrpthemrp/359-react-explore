import {useFonts} from "expo-font";
import * as React from 'react';
import Main from "./src/screens/Main";
import {useEffect} from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import Camera from "./src/screens/Camera";
import MemeComparison from "./src/screens/MemeComparison";

export type RootStackParamList = {
    Main: undefined;
    MemeCamera: undefined;
    MemeComparison: { photoUri: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
    const [loaded, error] = useFonts({
        ComicSans: require("./assets/fonts/ComicSans.ttf"),
    });
    useEffect(() => {
        if (loaded || error) {
            console.log("font ", loaded);
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }
    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{headerShown: false}}>
                <RootStack.Screen name="Main" component={Main}/>
                <RootStack.Screen name="MemeCamera" component={Camera}/>
                <RootStack.Screen name="MemeComparison" component={MemeComparison}/>
            </RootStack.Navigator>
        </NavigationContainer>
    );
}
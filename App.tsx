import {useFonts} from "expo-font";
import * as React from 'react';
import Main from "./src/screens/Main";
import {theme} from "./src/utils/Theme";
import {useEffect} from "react";
import MemeCamera from "./src/screens/MemeCamera";
import {createStaticNavigation} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";


const RootStack = createNativeStackNavigator({
    screens: {
        Main: {
            screen: Main,
            options: {headerShown: false},
        },
        MemeCamera: {
            screen: MemeCamera,
            options: {headerShown: false},
        }
    },
});

const Navigation = createStaticNavigation(RootStack);

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
        <Navigation theme={theme}/>
    );
}
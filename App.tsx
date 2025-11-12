import {useFonts} from "expo-font";
import * as React from 'react';
import {createStaticNavigation} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Main from "./src/screens/Main";
import {theme} from "./src/utils/Theme";
import {useEffect} from "react";

const RootStack = createNativeStackNavigator({
    screens: {
        Home: {
            screen: Main,
            options: {headerShown: false, title: 'Main'},
        },
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
    return <Navigation theme={theme}/>;
}
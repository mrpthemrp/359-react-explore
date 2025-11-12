import {Text, TouchableOpacity, StyleSheet} from "react-native";

interface CTAButtonProps {
    title: string;
    onPress: () => void;
}

export const CTAButton = (props: CTAButtonProps) => {
    return (
        <TouchableOpacity style={styles.ctaBtn_container} onPress={props.onPress}>
            <Text style={styles.ctaBtnText}>
                {props.title}
            </Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    ctaBtn_container: {
        borderRadius: 10,
        backgroundColor: "blue",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 15,
    },
    ctaBtnText: {
        fontFamily: "ComicSans",
        color: "#ffffff",
    }
})
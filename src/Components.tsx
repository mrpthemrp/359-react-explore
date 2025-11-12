import {Text, TouchableOpacity, StyleSheet} from "react-native";
import React, {ComponentType} from "react";

interface CTAButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
}

export const CTAButton = (props: CTAButtonProps) => {
    return (
        <TouchableOpacity disabled={props.disabled ?? false} style={styles.ctaBtn_container} onPress={props.onPress}>
            <Text style={styles.ctaBtnText}>
                {props.title}
            </Text>
        </TouchableOpacity>
    )
}


export interface IconButtonProps {
    onPress: any;
    icon: ComponentType;
    title?: string;
    functionValue?: any;
}

export const IconButton: React.FC<IconButtonProps> = ({title, onPress, icon: Icon, functionValue, ...props}) => {
    return (
        <TouchableOpacity style={styles.iconContainer} onPress={onPress}>
            {Icon && <Icon/>}
            {title ? <Text style={styles.iconBtnText}>{title}</Text> : <></>}
        </TouchableOpacity>
    )
}


const styles = StyleSheet.create({
    ctaBtn_container: {
        borderRadius: 10,
        backgroundColor: "teal",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 15,
    },
    ctaBtnText: {
        fontFamily: "ComicSans",
        color: "#ffffff",
    },
    iconBtnText: {
        fontFamily: "ComicSans",
        color: "#000000",
        fontSize: 10,
    },
    iconContainer: {
        flexDirection: "row",
        gap: 5,
        alignItems: "center",
        width: "100%",
    }
})
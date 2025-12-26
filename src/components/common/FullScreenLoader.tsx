import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal, Dimensions } from 'react-native';
import { useTheme } from '@theme';

interface FullScreenLoaderProps {
    visible: boolean;
    message?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ visible, message }) => {
    const { colors } = useTheme();

    if (!visible) return null;

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            statusBarTranslucent
        >
            <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
                <View style={[styles.content, { backgroundColor: colors.card }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    {message && (
                        <Text style={[styles.message, { color: colors.text }]}>
                            {message}
                        </Text>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        minWidth: 150,
    },
    message: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
});

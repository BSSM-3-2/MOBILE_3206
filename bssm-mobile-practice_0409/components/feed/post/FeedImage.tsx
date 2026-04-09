import { Ionicons } from '@expo/vector-icons';
import { Image, ImageLoadEventData } from 'expo-image';
import { useState } from 'react';
import { Dimensions, ImageSourcePropType, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_SCALE = 3;

export default function FeedImage({
    image,
    onDoubleTap,
}: {
    image: ImageSourcePropType;
    onDoubleTap?: () => void;
}) {
    const [imageHeight, setImageHeight] = useState(SCREEN_WIDTH);

    // TODO: scale, savedScale 선언 (실습 2-1)
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const heartOpacity = useSharedValue(0);
    const heartScale = useSharedValue(0);

    // TODO: pinchGesture 정의 (실습 2-2)
    const pinchGesture = Gesture.Pinch()
        .onUpdate(e => {
            scale.value = Math.max(
                1,
                Math.min(savedScale.value * e.scale, MAX_SCALE),
            );
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            if (scale.value <= 1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
            }
        });

    // TODO: doubleTapGesture 정의 (실습 3-2)
    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            heartOpacity.value = withSequence(withTiming(1), withTiming(0));
            heartScale.value = withSequence(withSpring(1.2), withSpring(1));
            if (onDoubleTap) runOnJS(onDoubleTap)();
        });

    // TODO: Gesture.Simultaneous로 합성 (실습 3-3)
    const composedGesture = Gesture.Simultaneous(
        pinchGesture,
        doubleTapGesture,
    );

    // TODO: imageAnimatedStyle 정의 (실습 2-3)
    const imageAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    // TODO: heartAnimatedStyle 정의 (실습 3-4)
    const heartAnimatedStyle = useAnimatedStyle(() => ({
        opacity: heartOpacity.value,
        transform: [{ scale: heartScale.value }],
    }));

    const handleImageLoad = (e: ImageLoadEventData) => {
        const { width, height } = e.source;
        const ratio = height / width;
        setImageHeight(SCREEN_WIDTH * ratio);
    };

    return (
        // TODO: GestureDetector + Animated.View 감싸기 (실습 2-4)
        <GestureDetector gesture={composedGesture}>
            <Animated.View style={imageAnimatedStyle}>
                {/*// TODO: 하트 오버레이 추가 (실습 3-5)*/}
                <Image
                    source={image}
                    style={{ width: SCREEN_WIDTH, height: imageHeight }}
                    onLoad={handleImageLoad}
                />
                <Animated.View
                    style={[styles.heartOverlay, heartAnimatedStyle]}
                >
                    <Ionicons name='heart' size={80} color='white' />
                </Animated.View>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    heartOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

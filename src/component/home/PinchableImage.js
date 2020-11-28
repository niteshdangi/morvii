import React, { Component } from "react";
import { Animated, Dimensions, Image } from "react-native";
import {
  PinchGestureHandler,
  State,
  TouchableWithoutFeedback,
  TouchableOpacity,
  PanGestureHandler,
} from "react-native-gesture-handler";
import FlexImage from "react-native-flex-image";
import DoubleClick from "react-native-double-tap";
import { Video } from "expo-av";
import { Layout, Text } from "@ui-kitten/components";
import * as VideoThumbnails from "expo-video-thumbnails";
import VideoPlayer from "../utils/VideoPlayer";

const screen = Dimensions.get("window");

const PinchableBox = ({
  media,
  doubleTap,
  singleTap,
  autoplay = false,
  style = {
    width: Dimensions.get("screen").width - 30,
    height: Dimensions.get("screen").width - 30,
  },
  navigation,
}) => {
  const scale = new Animated.Value(1);
  const moveX = new Animated.Value(0);
  const moveY = new Animated.Value(0);

  const onPinchEvent = (e) => {
    Animated.timing(scale, {
      toValue: e.nativeEvent.scale,
      duration: 0,
      useNativeDriver: true,
    }).start();
  };

  const onPinchStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };
  const onPanEvent = (e) => {
    // console.log(e.nativeEvent);
    Animated.timing(moveX, {
      toValue: e.nativeEvent.translationX / 2,
      duration: 0,
      useNativeDriver: true,
    }).start();
    Animated.timing(moveY, {
      toValue: e.nativeEvent.translationY / 2,
      duration: 0,
      useNativeDriver: true,
    }).start();
  };

  const onPanStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      Animated.spring(moveX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      Animated.spring(moveY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };
  const pan = React.useRef();
  const pinch = React.useRef();
  return (
    <PanGestureHandler
      onGestureEvent={onPanEvent}
      onHandlerStateChange={onPanStateChange}
      minDist={20}
      ref={pan}
      minPointers={2}
      simultaneousHandlers={pinch}>
      <PinchGestureHandler
        onGestureEvent={onPinchEvent}
        ref={pinch}
        simultaneousHandlers={pan}
        onHandlerStateChange={onPinchStateChange}>
        <Animated.View
          style={{
            transform: [
              { scale: scale },
              { translateX: moveX },
              { translateY: moveY },
            ],
          }}
          resizeMode="contain">
          <DoubleClick doubleTap={doubleTap}>
            {media.mimetype.includes("video") ? (
              <Layout>
                <VideoPlayer
                  uri={media.uri}
                  thumbnail={media.thumbnail}
                  doubleTap={doubleTap}
                  style={style}
                  navigation={navigation}
                />
              </Layout>
            ) : (
              <Image
                style={{
                  ...style,
                }}
                resizeMode="contain"
                source={{ uri: media.uri }}
              />
            )}
          </DoubleClick>
        </Animated.View>
      </PinchGestureHandler>
    </PanGestureHandler>
  );
};

export default PinchableBox;

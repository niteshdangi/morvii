import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, Layout, Text } from "@ui-kitten/components";
import { TouchableRipple } from "react-native-paper";
import { connect } from "react-redux";
import { setShortModal, setShortModalProps } from "../../actions/ShortModal";
import { Dimensions, RefreshControl, Image, Animated } from "react-native";
import {
  ScrollView,
  TouchableWithoutFeedback,
  LongPressGestureHandler,
  State,
} from "react-native-gesture-handler";
import { Easing } from "react-native-reanimated";
export default class MopicsObj extends Component {
  render() {
    let scaleValue = new Animated.Value(0);
    const cardScale = scaleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.98, 0.95],
    });
    let transformStyle = {
      transform: [{ scale: cardScale }],
    };
    return (
      <TouchableWithoutFeedback
        style={{ width: "100%" }}
        onPressIn={() => {
          scaleValue.setValue(0);
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 150,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.timing(scaleValue, {
            toValue: 0,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start();
        }}>
        <Animated.View style={transformStyle}>
          <Layout
            style={[
              {
                width: this.props.width - 2,
                height: this.props.width - 2,
                margin: 1,
                backgroundColor: "transparent",
                overflow: "hidden",
                marginBottom: this.props.isLast ? 50 : 1,
              },
              this.props.style ? { ...this.props.style } : {},
            ]}>
            <Image
              source={{ uri: "https://source.unsplash.com/random" }}
              resizeMode="cover"
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          </Layout>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
}

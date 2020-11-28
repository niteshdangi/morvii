import React, { Component } from "react";
import {
  StyleService,
  useStyleSheet,
  Text,
  Layout,
  Icon,
} from "@ui-kitten/components";
import { connect } from "react-redux";
import {
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import { View, Image, Animated, Dimensions, Platform } from "react-native";
import { Easing } from "react-native-reanimated";
import styled from "styled-components";

class StoryItem extends Component {
  render() {
    const { props } = this;
    const width = props.size ? props.size : 60;
    const height = width;
    const borderRadius = width;

    let scaleValue = new Animated.Value(0);
    const cardScale = scaleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.95, 0.9],
    });
    let transformStyle = { transform: [{ scale: cardScale }] };

    return (
      <TouchableWithoutFeedback
        style={
          ({
            margin: 5,
          },
          props.style)
        }
        onPress={() => {
          props.onPress ? props.onPress() : null;
        }}
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
          <View
            style={{
              padding: props.borderPadding ? props.borderPadding : 2,
              borderRadius,
              borderWidth: props.border ? props.border : 2,
              borderColor: props.borderColor
                ? props.borderColor
                : "rgba(0,0,255,0.2)",
              ...props.styleIn,
            }}>
            <Image
              style={{ width, height, borderRadius }}
              source={{ uri: props.item.user.profile.image }}
            />
          </View>
          {props.item?.time ? (
            <Layout
              style={{
                flex: 1,
                marginTop: -15,
                backgroundColor: "transparent",
                alignItems: "flex-end",
                elevation: 2,
              }}>
              {/* <Icon
            name="clock"
            style={{ width: 13, height: 13, tintColor: "black" }}
          /> */}
              <Text
                style={{
                  backgroundColor: "white",
                  borderRadius: 50,
                  paddingHorizontal: 5,
                  paddingLeft: 7,
                  borderWidth: 1,
                  fontSize: 12,
                }}>
                {props.item.time}h
              </Text>
            </Layout>
          ) : null}
          <Layout
            style={{
              width: width + 5,
              justifyContent: "center",
              alignItems: "center",
            }}>
            {props.auth.user.username === props.item.user.username ? (
              <Text
                numberOfLines={1}
                style={{
                  overflow: "hidden",
                  flexWrap: "wrap",
                  flex: 1,
                  height: 17,
                  fontSize: 14,
                  fontWeight: "bold",
                }}>
                You
              </Text>
            ) : (
              <Text
                numberOfLines={1}
                style={{
                  overflow: "hidden",
                  flexWrap: "wrap",
                  flex: 1,
                  height: 17,
                  fontSize: 14,
                }}>
                {props.item.user.username}
              </Text>
            )}
          </Layout>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
}
const OverlayAdd = styled.View`
  position: absolute;
  top: 0;
  left: 0;
`;
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
});
export default connect(mapStateToProps, null)(StoryItem);

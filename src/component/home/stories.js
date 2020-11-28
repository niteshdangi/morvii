import React from "react";
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
import { View, Image } from "react-native";
import Animated, { Easing } from "react-native-reanimated";
import styled from "styled-components";

const StoryView = (props) => {
  const width = props.size ? props.size : 60;
  const height = width;
  const borderRadius = width;
  const styles = useStyleSheet(stylesThemed);
  let scaleValue = new Animated.Value(0);
  const cardScale = scaleValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.95, 0.9],
  });
  let transformStyle = { ...styles.card, transform: [{ scale: cardScale }] };
  const Time = () =>
    props.time ? (
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
          {props.time}h
        </Text>
      </Layout>
    ) : null;

  return (
    <TouchableWithoutFeedback
      style={
        ({
          margin: 5,
        },
        props.style)
      }
      onPress={() => {
        props.onPress ? props.onPress(true, "Profile") : null;
      }}
      onLongPress={() => {
        props.onLongPress ? props.onLongPress() : null;
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
            ...styles.StoryImageView,
            padding: props.borderPadding ? props.borderPadding : 2,
            borderRadius,
            borderWidth: props.border ? props.border : 2,
            borderColor: props.borderColor
              ? props.borderColor
              : styles.StoryImageView.borderColor,
            ...props.styleIn,
          }}>
          <Image
            style={{ width, height, borderRadius }}
            source={{ uri: props.image }}
          />
          {props.new ? (
            <OverlayAdd>
              <Icon
                name="plus"
                style={{
                  tintColor: "blue",
                  backgroundColor: "rgba(255,255,255,0.5)",
                  width: width + 5,
                  height: height + 5,
                  borderRadius,
                }}
              />
            </OverlayAdd>
          ) : null}
        </View>
        <Time />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
const OverlayAdd = styled.View`
  position: absolute;
  top: 0;
  left: 0;
`;
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
});
export default connect(mapStateToProps, null)(StoryView);
const stylesThemed = StyleService.create({
  StoryImageView: {
    borderColor: "color-primary-200",
  },
});

import React, { Component } from "react";
import PropTypes from "prop-types";
import { View, Animated, StyleSheet } from "react-native";

export default class SelectedPhoto extends Component {
  static contextTypes = {
    gesturePosition: PropTypes.object,
    scrollValue: PropTypes.object,
    scaleValue: PropTypes.object,
  };
  state = { isLoaded: false };
  render() {
    let { selectedPhoto } = this.props;
    let { isLoaded } = this.state;

    let { gesturePosition, scaleValue } = this.context;

    let animatedStyle = {
      transform: gesturePosition.getTranslateTransform(),
    };
    animatedStyle.transform.push({
      scale: scaleValue,
    });

    let imageStyle = [
      {
        position: "absolute",
        zIndex: 10,
        width: selectedPhoto.measurement.w,
        height: selectedPhoto.measurement.h,
        opacity: isLoaded ? 1 : 0,
      },
      animatedStyle,
    ];

    let backgroundOpacityValue = scaleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.4, 0.6],
    });

    return (
      <View style={styles.root}>
        <Animated.View
          style={[
            styles.background,
            {
              opacity: backgroundOpacityValue,
            },
          ]}
        />
        <Animated.Image
          style={imageStyle}
          onLoad={() => this.setState({ isLoaded: true })}
          source={{
            uri: selectedPhoto.photoURI,
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: "black",
  },
});

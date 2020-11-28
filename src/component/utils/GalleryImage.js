import React, { Component } from "react";
import { setShortModal, setShortModalProps } from "../../actions/ShortModal";

import {
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native-gesture-handler";
import { connect } from "react-redux";
import { Image, Dimensions } from "react-native";
import Animated, { Easing } from "react-native-reanimated";
import { Layout, Icon } from "@ui-kitten/components";
import { Video } from "expo-av";
import * as VideoThumbnails from "expo-video-thumbnails";
class GalleryImage extends Component {
  state = { selected: false };

  shouldComponentUpdate(p, s) {
    if (s.selected != this.state.selected) return true;
    return false;
  }
  render() {
    const item = { ...this.props.item, thumbnail: this.state.image };
    const { selected } = this.state;
    // console.log(this.props);

    let scaleValue = new Animated.Value(0);
    const cardScale = scaleValue.interpolate({
      inputRange: [0, 0.25, 0.5, 1],
      outputRange: [1, 0.95, 0.9, 0.85],
    });
    let transformStyle = { transform: [{ scale: cardScale }] };
    return (
      <TouchableWithoutFeedback
        key={item.id}
        onPress={() => {
          if (this.state.selected) {
            this.setState({ selected: false });
            this.props.onUnselect(item);
          } else {
            this.setState({ selected: true });
            this.props.onSelect(item);
          }
        }}
        style={{
          padding: 2,
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
        }}
        onLongPress={() => {
          this.props.setShortModalProps({ item: item });
          this.props.setShortModal(true, "GalleryQuick");
        }}>
        <Animated.View style={transformStyle}>
          {item.mediaType == "photo" ? (
            <Image
              style={{
                width: Dimensions.get("window").width / 4 - 4,
                height: 100,
                borderWidth: 5,
                borderRadius: selected ? 5 : 0,
                borderColor: selected ? "blue" : "transparent",
                transform: [{ scale: selected ? 0.85 : 1 }],
              }}
              resizeMode="cover"
              source={{ uri: item.uri }}
            />
          ) : (
            <Layout>
              <Image
                style={{
                  width: Dimensions.get("window").width / 4 - 4,
                  height: 100,
                  borderWidth: 5,
                  borderRadius: selected ? 5 : 0,
                  borderColor: selected ? "blue" : "transparent",
                  transform: [{ scale: selected ? 0.85 : 1 }],
                }}
                resizeMode="cover"
                source={{ uri: item.uri }}
              />
              <Icon
                name="video"
                style={{
                  width: 20,
                  height: 20,
                  tintColor: "blue",
                  marginTop: -20,
                  backgroundColor: "white",
                  borderRadius: 20,
                }}
              />
            </Layout>
          )}
          {selected ? (
            <Icon
              name="checkmark-circle-outline"
              style={{
                width: 20,
                height: 20,
                tintColor: "blue",
                marginTop: -20,
                backgroundColor: "white",
                borderRadius: 20,
              }}
            />
          ) : null}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
}

export default connect(null, { setShortModal, setShortModalProps })(
  GalleryImage
);

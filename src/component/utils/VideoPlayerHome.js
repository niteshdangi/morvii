import React, { Component } from "react";
import { View, StyleSheet, Dimensions, Image } from "react-native";
import { Video } from "expo-av";
import InViewPort from "./InViewport";
import styled from "styled-components";
import { Icon } from "@ui-kitten/components";

export default class VideoPlayerHome extends React.Component {
  pauseVideo = () => {
    if (this.video) {
      this.video.pauseAsync();
    }
  };

  playVideo = () => {
    if (this.video) {
      this.video.playAsync();
    }
  };
  isVisible() {
    this?.viewPort?.isInViewPort();
  }
  state = {
    image: this.props.thumbnail,
    videoStatus: { isBuffering: true, isMuted: false },
    updateTime: new Date(),
    MutedOpacity: 0,
    isVisible: true,
  };
  handlePlaying = (isVisible) => {
    isVisible ? this.playVideo() : this.pauseVideo();
    // this.setState({ isVisible });
  };
  componentWillUnmount() {
    this.pauseVideo();
  }
  render() {
    return (
      <InViewPort
        ref={(ref) => {
          this.viewPort = ref;
        }}
        onChange={this.props.shouldPlay ? () => {} : this.handlePlaying}>
        <View
          style={{
            position: "absolute",
            top: 0,
            padding: 5,
            margin: 5,
            borderRadius: 20,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 500,
            elevation: 3,
          }}>
          <Icon
            name="video"
            style={{ width: 15, height: 15, tintColor: "#fff" }}
          />
        </View>
        <Video
          ref={(ref) => {
            this.video = ref;
          }}
          posterSource={
            this.state.image
              ? { uri: this.state.image }
              : require("../../../assets/videoPoster.png")
          }
          posterStyle={{
            width: this.props?.style?.width
              ? this.props?.style?.width
              : Dimensions.get("screen").width,
            height: "100%",
            backgroundColor: "white",
          }}
          usePoster
          {...this.props}
        />
      </InViewPort>
    );
  }
}
const Vtime = styled.View`
  position: absolute;
  bottom: 0;
  right: 10px;
`;
const IsMuted = styled.View`
  position: absolute;
  bottom: 0;
  left: 10px;
`;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});

import React, { Component } from "react";
import { View, StyleSheet, Dimensions, Animated } from "react-native";
import { Video } from "expo-av";
import InViewPort from "./InViewport";
import styled from "styled-components";
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import { Layout, Text, Icon } from "@ui-kitten/components";
import { Easing } from "react-native-reanimated";
import DoubleClick from "react-native-double-tap";
import { connect } from "react-redux";
import { setVideoMuted } from "../../actions/HomeActions";

class VideoPlayer extends React.Component {
  pauseVideo = () => {
    if (this.video) {
      this.video.pauseAsync();
    }
  };

  playVideo = () => {
    if (this.video) {
      this.video.setProgressUpdateIntervalAsync(5000);

      this.video.playAsync();
    }
  };
  state = {
    image: null,
    videoStatus: { isBuffering: true },
    updateTime: new Date(),
    MutedOpacity: new Animated.Value(0),
    TimerOpacity: new Animated.Value(0),
    focus: true,
  };
  handlePlaying = (isVisible) => {
    isVisible
      ? this.state.focus
        ? this.playVideo()
        : this.pauseVideo()
      : this.pauseVideo();
  };
  componentDidMount() {
    this.props.navigation.addListener("focus", () => {
      this.setState({ focus: true });
    });
    this.props.navigation.addListener("blur", () => {
      this.setState({ focus: false });
    });
    this.generateThumbnail();
    this.video.setOnPlaybackStatusUpdate((status) => {
      if (
        new Date() - this.state.updateTime >= 5000 ||
        this.state.videoStatus.isBuffering !== status.isBuffering
      ) {
        Animated.timing(this.state.TimerOpacity, {
          duration: 500,
          toValue: 1,
          useNativeDriver: true,

          easing: Easing.linear,
        }).start();

        setTimeout(
          () =>
            Animated.timing(this.state.TimerOpacity, {
              duration: 500,
              toValue: 0,
              useNativeDriver: true,
              easing: Easing.linear,
            }).start(),
          1000
        );
        this.setState({ videoStatus: status, updateTime: new Date() });
      }
    });
  }
  generateThumbnail = async () => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        this.props.item.uri,
        {
          time: 15000,
        }
      );
      this.setState({ image: uri });
    } catch (e) {
      this.setState({ image: null });
    }
  };
  render() {
    function msToTime(s) {
      function pad(n, z) {
        z = z || 2;
        return ("00" + n).slice(-z);
      }
      var ms = s % 1000;
      s = (s - ms) / 1000;
      var secs = s % 60;
      s = (s - secs) / 60;
      var mins = s % 60;
      var hrs = (s - mins) / 60;
      if (hrs == 0) return pad(mins) + ":" + pad(secs);
      return pad(hrs) + ":" + pad(mins) + ":" + pad(secs);
    }
    const { videoStatus } = this.state;
    return (
      <View style={styles.container}>
        <InViewPort
          onChange={this.props.shouldPlay ? () => {} : this.handlePlaying}>
          <DoubleClick
            doubleTap={this.props.doubleTap}
            singleTap={() => {
              // console.log("click");
              if (this?.video)
                try {
                  const isMuted = !this.props.muted;
                  this?.video?.setIsMutedAsync(isMuted);
                  this.props.setVideoMuted(isMuted);
                  clearTimeout(this.MutedOpacityTimer);
                  Animated.spring(this.state.MutedOpacity, {
                    toValue: 1,
                    useNativeDriver: true,
                  }).start();
                  this.MutedOpacityTimer = setTimeout(() => {
                    Animated.timing(this.state.MutedOpacity, {
                      toValue: 0,
                      duration: 100,
                      useNativeDriver: true,
                    }).start();
                  }, 2000);
                } catch (e) {}
            }}>
            <Video
              ref={(ref) => {
                this.video = ref;
              }}
              source={{ uri: this.props.uri }}
              style={{
                width: Dimensions.get("screen").width - 30,
                height: Dimensions.get("screen").width - 30,
              }}
              shouldPlay={this.props.autoplay ? this.props.autoplay : true}
              resizeMode="contain"
              progressUpdateIntervalMillis={2000}
              posterSource={
                this.props?.thumbnail
                  ? { uri: this.props.thumbnail }
                  : this.state.image
                  ? { uri: this.state.image }
                  : require("../../../assets/videoPoster.png")
              }
              posterStyle={{
                width: Dimensions.get("screen").width,
                height: "100%",
                backgroundColor: "white",
              }}
              usePoster
              isLooping
              isMuted={this.props.muted}
              {...this.props}
            />
          </DoubleClick>
          <IsMuted>
            <Animated.View style={{ opacity: this.state.MutedOpacity }}>
              <Layout
                style={{
                  backgroundColor: "rgba(0,0,0,0.5)",
                  padding: 5,
                  borderRadius: 50,
                  elevation: 10,
                  margin: 10,
                  marginBottom: 20,
                }}>
                <Icon
                  name={this.props.muted ? "volume-off" : "volume-up"}
                  style={{
                    width: 15,
                    height: 15,
                    tintColor: "white",
                  }}
                />
              </Layout>
            </Animated.View>
          </IsMuted>
          <Vtime>
            <Animated.View style={{ opacity: this.state.TimerOpacity }}>
              <TouchableOpacity
                style={{
                  padding: 5,
                  margin: 10,
                  marginBottom: 20,
                  backgroundColor: "rgba(255,255,255,0.5)",
                  borderRadius: 50,
                  elevation: 10,
                }}>
                <Layout
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    backgroundColor: "transparent",
                  }}>
                  <Text style={{ fontSize: 12 }}>
                    {videoStatus.isBuffering
                      ? videoStatus.isPlaying
                        ? msToTime(videoStatus.positionMillis) +
                          " / " +
                          msToTime(videoStatus.durationMillis)
                        : "Buffering..."
                      : msToTime(videoStatus.positionMillis) +
                        " / " +
                        msToTime(videoStatus.durationMillis)}
                  </Text>
                </Layout>
              </TouchableOpacity>
            </Animated.View>
          </Vtime>
        </InViewPort>
      </View>
    );
  }
}
const Vtime = styled.View`
  position: absolute;
  bottom: 0;
  right: 15px;
`;
const IsMuted = styled.View`
  position: absolute;
  bottom: 0;
  left: 15px;
`;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});
const mapStateToProps = (state) => ({
  muted: state.main.HomeReducer.mutedVideo,
});
export default connect(mapStateToProps, { setVideoMuted })(VideoPlayer);

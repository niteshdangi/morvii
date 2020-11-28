import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import VideoPlayer from "./utils/VideoPlayer";
import FlexImage from "react-native-flex-image";
import PinchZoomView from "react-native-pinch-zoom-view-movable";
import styled from "styled-components";
import { Text, Layout, Icon } from "@ui-kitten/components";
import {
  Dimensions,
  Image,
  Animated,
  StatusBar,
  ScrollView,
  Keyboard,
  ToastAndroid,
  BackHandler,
} from "react-native";
import GestureHandler from "./utils/GestureHandler";
import { LinearGradient } from "expo-linear-gradient";
import Ripple from "react-native-material-ripple";
import { ImageManipulator } from "expo-image-crop";
import { TextInput } from "react-native-gesture-handler";
import * as MediaLibrary from "expo-media-library";
class EditText extends Component {
  state = { text: "", color: "#fff", bg: "transparent" };
  componentDidMount() {
    StatusBar.setBarStyle("light-content", true);

    this.keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      this._keyboardDidHide.bind(this)
    );
  }
  _keyboardDidHide() {
    if (this.state.text !== "") {
      this.props.addText(this.state.text, this.state.color, this.state.bg);
    }
  }
  componentWillUnmount() {
    this.keyboardDidHideListener.remove();
  }
  getRandomColor() {
    var letters = "0123456789ABCDEF";
    var color = "#";
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  TextColor = ({
    color = this.getRandomColor(),
    bg = this.getRandomColor(),
  }) => (
    <Ripple
      onPress={() => {
        this.setState({ color, bg });
      }}
      style={{
        backgroundColor: bg,
        paddingHorizontal: 7,
        paddingBottom: 2,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#fff",
        margin: 5,
        elevation: 4,
        zIndex: 4000,
      }}>
      <Text style={{ color }}>A</Text>
    </Ripple>
  );
  render() {
    return (
      <>
        <Layout
          style={{
            marginLeft: 70,
            zIndex: 30005,
            justifyContent: "space-around",
            flexDirection: "row",
            elevation: 3,
            backgroundColor: "transparent",
            marginTop: -43,
          }}>
          {/* <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardDismissMode="none"> */}
          <this.TextColor bg="transparent" color="#fff" />
          <this.TextColor />
          <this.TextColor />
          <this.TextColor />
          <this.TextColor />
          <this.TextColor />
          <this.TextColor />
          {/* </ScrollView> */}
        </Layout>
        <Layout
          style={{
            width: Dimensions.get("screen").width,
            height: Dimensions.get("screen").height,
            backgroundColor: "rgba(0,0,0,0.5)",
            position: "absolute",
            zIndex: 200,
            elevation: 2,
            justifyContent: "center",
            alignItems: "center",
          }}>
          <TextInput
            ref={(ref) => ref?.focus()}
            multiline
            placeholderTextColor="#e9e9e9"
            returnKeyType="done"
            placeholder="Enter Something..."
            onChangeText={(v) => {
              this.setState({
                text: v,
              });
            }}
            style={{
              maxHeight: 150,
              color: this.state.color,
              backgroundColor: this.state.bg,
              paddingHorizontal: 5,
              paddingVertical: 2,
            }}
          />
        </Layout>
      </>
    );
  }
}
export default class Captured extends Component {
  state = {
    uri: this.props?.route?.params
      ? this.props?.route?.params.uri
      : this.props.uri
      ? this.props.uri
      : null,
    mediaType: this.props?.route?.params
      ? this.props?.route?.params.mediaType
      : this.props.mediaType
      ? this.props.mediaType
      : null,
    editor: false,
    text: [],
    editText: false,
  };

  deletion = new Animated.Value(100);
  imageView = React.createRef();
  changed = false;
  componentDidMount() {
    StatusBar.setBarStyle("light-content", true);
  }
  onToggleModal() {
    this.setState({ editor: false });
  }
  addText() {
    // this.setState({ text: [...this.state.text, { text: "", edit: true }] });
    this.setState({ editText: true });
  }
  componentDidUpdate() {
    if (this.state.editText) this.props.onDelete(true);
    else this.props.onDelete(false);
  }

  render() {
    return (
      <Layout style={{ height: Dimensions.get("screen").height }}>
        <ImageManipulator
          photo={{ uri: this.state.uri }}
          isVisible={this.state.editor}
          onPictureChoosed={({ uri: uriM }) => {
            this.setState({
              uri: uriM,
            });
          }}
          onToggleModal={this.onToggleModal.bind(this)}
        />
        <LinearGradient
          colors={["#000", "transparent"]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 90,
            zIndex: 2000,
            elevation: 1,
          }}
        />
        <Layout
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            elevation: 10,
            backgroundColor: "transparent",
            marginTop: StatusBar.currentHeight,
            padding: 5,
            paddingHorizontal: 10,
            zIndex: 20001,
          }}>
          {this.state.editText ? (
            <Ripple onPress={() => this.setState({ editText: false })}>
              <Icon
                name="arrow-back-outline"
                style={{ width: 40, height: 40, tintColor: "#fff" }}
              />
            </Ripple>
          ) : (
            <>
              <Ripple onPress={() => this.props.cancel()}>
                <Icon
                  name="close-outline"
                  style={{ width: 40, height: 40, tintColor: "#fff" }}
                />
              </Ripple>
              <Layout
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  alignItems: "center",
                  backgroundColor: "transparent",
                  paddingRight: 5,
                  width: 90,
                }}>
                <Ripple
                  onPress={() => {
                    this.state.mediaType.includes("video")
                      ? ToastAndroid.show(
                          "Video Editor will be Available Soon",
                          ToastAndroid.LONG
                        )
                      : this.setState({ editor: true });
                  }}>
                  <Icon
                    name="edit-outline"
                    style={{ width: 35, height: 35, tintColor: "#fff" }}
                  />
                </Ripple>
                <Ripple
                  onPress={() => {
                    this.state.mediaType.includes("video")
                      ? ToastAndroid.show(
                          "Video Editor will be Available Soon",
                          ToastAndroid.LONG
                        )
                      : this.addText();
                  }}>
                  <Icon
                    name="text-outline"
                    style={{ width: 30, height: 30, tintColor: "#fff" }}
                  />
                </Ripple>
              </Layout>
            </>
          )}
        </Layout>
        {this.state.editText && (
          <EditText
            addText={(text, color, bg) => {
              this.setState({
                text: [...this.state.text, { text, color, bg }],
                editText: false,
              });
            }}
          />
        )}
        <Layout style={{ position: "absolute" }} ref={this.imageView}>
          {this.state.text?.map((text, index) => {
            return (
              <GestureHandler
                key={index}
                deletion={(deletion_) => {
                  this.props?.onDelete(deletion_);
                  Animated.spring(this.deletion, {
                    toValue: deletion_ ? 10 : 100,
                    useNativeDriver: false,
                  }).start();
                }}
                delete={() => {
                  this.props?.onDelete(false);
                  Animated.spring(this.deletion, {
                    toValue: 100,
                    useNativeDriver: false,
                  }).start();
                  this.setState({
                    text: this.state.text.filter((item, ind) =>
                      ind !== index ? item : null
                    ),
                  });
                }}
                style={{
                  position: "absolute",
                  zIndex: 100,
                  top: Dimensions.get("screen").width,
                  backgroundColor: "transparent",
                }}>
                <Layout style={{ backgroundColor: "transparent", padding: 5 }}>
                  <Text
                    style={{
                      color: text.color,
                      backgroundColor: text.bg,
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                    }}>
                    {text.text}
                  </Text>
                </Layout>
              </GestureHandler>
            );
          })}
          <GestureHandler
            onChange={() => {
              this.changed = true;
            }}>
            {this.state.mediaType === "video" ? (
              <VideoPlayer
                style={{
                  width: Dimensions.get("screen").width,
                  height: Dimensions.get("window").height,
                  marginTop: 10,
                }}
                uri={this.state.uri}
                shouldPlay={true}
              />
            ) : (
              <Image
                resizeMode="contain"
                style={{
                  width: Dimensions.get("screen").width,
                  height: Dimensions.get("screen").height,
                }}
                source={{ uri: this.state.uri }}
              />
            )}
          </GestureHandler>
        </Layout>
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000,
            elevation: 1,
            transform: [
              {
                translateY: this.deletion,
              },
            ],
          }}>
          <LinearGradient
            colors={["transparent", "#000"]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 70,
              zIndex: 2000,
              elevation: 1,
            }}
          />
          <Layout
            style={{
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "transparent",
              height: 80,
            }}>
            <Icon
              name="trash-2-outline"
              style={{ width: 40, height: 40, tintColor: "red" }}
            />
          </Layout>
        </Animated.View>
      </Layout>
    );
  }
}

import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import VideoPlayer from "./utils/VideoPlayer";
import FlexImage from "react-native-flex-image";
import PinchZoomView from "react-native-pinch-zoom-view-movable";
import styled from "styled-components";
import { Text, Layout, Icon, Spinner } from "@ui-kitten/components";
import { captureRef } from "react-native-view-shot";
import {
  Dimensions,
  Image,
  Animated,
  StatusBar,
  ScrollView,
  Keyboard,
  ToastAndroid,
} from "react-native";
import GestureHandler from "./utils/GestureHandler";
import { LinearGradient } from "expo-linear-gradient";
import Ripple from "react-native-material-ripple";
import { ImageManipulator } from "expo-image-crop";
import { TextInput } from "react-native-gesture-handler";
import * as MediaLibrary from "expo-media-library";
import Captured from "./Captured";
import changeNavigationBarColor from "react-native-navigation-bar-color";

export default class ImageEditor extends Component {
  state = {
    data: this.props?.route?.params ? this.props.route?.params?.images : null,
    current: 0,
  };
  refs_ = [];
  ScrollView = React.createRef();
  bottomAnim = new Animated.Value(10);
  loader = new Animated.Value(Dimensions.get("screen").height);
  componentDidMount() {
    // changeNavigationBarColor("transparent", true);
    this.props.navigation.addListener("blur", () => {
      changeNavigationBarColor("#ffffff", true);
    });
    this.props.navigation.addListener("focus", () => {
      changeNavigationBarColor("transparent", true);
    });
  }
  render() {
    if (this.state.data === null) {
      this.props.navigation.goBack();
    }
    return (
      <Layout>
        <ScrollView
          ref={this.ScrollView}
          horizontal
          scrollEnabled={false}
          keyboardDismissMode="none"
          showsHorizontalScrollIndicator={false}>
          {this.state.data?.map((item, index) => {
            return (
              <Layout
                key={index}
                style={{ width: Dimensions.get("screen").width }}>
                <Captured
                  ref={(ref) => {
                    this.refs_.push(ref);
                  }}
                  onDelete={(del) => {
                    if (del)
                      Animated.spring(this.bottomAnim, {
                        toValue: 200,
                        useNativeDriver: false,
                      }).start();
                    else
                      Animated.spring(this.bottomAnim, {
                        toValue: 10,
                        useNativeDriver: false,
                      }).start();
                  }}
                  cancel={() => {
                    this.props.navigation.goBack();
                  }}
                  uri={item?.uri}
                  mediaType={item?.mediaType}
                />
              </Layout>
            );
          })}
        </ScrollView>
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 3000,
            elevation: 10,
            height: 80,
            width: "100%",
            transform: [{ translateY: this.bottomAnim }],
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
              height: 70,
              elevation: 1,
              zIndex: 2001,
              marginBottom: 10,
              marginLeft: 10,
              backgroundColor: "transparent",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{
                width: Dimensions.get("screen").width - 100,
              }}>
              {this.state.data?.length > 1 &&
                this.state.data?.map((item, index) => (
                  <Ripple
                    key={index}
                    onPress={() => {
                      this.ScrollView.current.scrollTo({
                        x: Dimensions.get("screen").width * index,
                      });
                    }}
                    style={{
                      width: 40,
                      height: 60,
                      borderWidth: 2,
                      borderColor: "#fff",
                      elevation: 5,
                      margin: 2.5,
                      borderRadius: 10,
                      overflow: "hidden",
                    }}>
                    <Image
                      source={{ uri: item?.uri }}
                      style={{ width: 40, height: 60 }}
                      resizeMode="contain"
                    />
                  </Ripple>
                ))}
            </ScrollView>
            <Ripple
              onPress={() => {
                // this.setState({ processing: true });
                Animated.spring(this.loader, {
                  toValue: 0,
                  useNativeDriver: false,
                }).start();
                setTimeout(() => {
                  var media = [];
                  var error = 0;
                  this.refs_?.map((item) => {
                    if (
                      item.props.mediaType?.includes("photo") &&
                      item.state?.text?.length == 0 &&
                      item.changed
                    ) {
                      captureRef(item.imageView)
                        .then((uri) => {
                          media.push({ uri, mediaType: item.props.mediaType });
                        })
                        .catch((e) => {
                          error++;
                        });
                    } else {
                      media.push({
                        uri: item.props.uri,
                        mediaType: item.props.mediaType,
                      });
                    }
                    const startTime = new Date();
                    const timer = setInterval(() => {
                      if (this.refs_.length === media.length + error) {
                        clearInterval(timer);
                        // this.setState({ processing: false });
                        Animated.spring(this.loader, {
                          toValue: Dimensions.get("screen").height,
                          useNativeDriver: false,
                        }).start();
                        if (
                          this.props.route.params?.type === "NEW_MESSAGE" &&
                          this.props.route.params?.user
                        ) {
                          this.props.navigation.navigate("MessageScreen", {
                            media: media,
                            user: this.props.route.params?.user,
                            time: new Date(),
                          });
                        } else if (
                          this.props.route.params?.type === "STORY" &&
                          this.props.route.params?.postStory
                        ) {
                          this.props.route.params?.postStory(media);
                          this.props.navigation.navigate("BaseApp", {
                            screenName: "Explore",
                          });
                        }
                      } else {
                        if (new Date() - startTime > 60000) {
                          clearInterval(timer);
                          ToastAndroid.show(
                            "Failed Image Generation Plz try again",
                            ToastAndroid.SHORT
                          );
                        }
                      }
                    }, 1000);
                  });
                }, 500);
              }}>
              <Icon
                name="arrow-forward-outline"
                style={{ width: 40, height: 40, tintColor: "#fff" }}
              />
            </Ripple>
          </Layout>
        </Animated.View>
        <Animated.View
          style={{
            position: "absolute",
            zIndex: 50000,
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            justifyContent: "center",
            alignItems: "center",
            transform: [{ translateY: this.loader }],
            backgroundColor: "rgba(0,0,0,0.5)",
          }}>
          <Spinner />
        </Animated.View>
      </Layout>
    );
  }
}

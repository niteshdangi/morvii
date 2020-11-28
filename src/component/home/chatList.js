import React, { Component } from "react";
import { Icon, Layout, Text } from "@ui-kitten/components";
import StoryView from "./stories";
import { connect } from "react-redux";
import { View, Animated, Image, Dimensions } from "react-native";
import {
  LongPressGestureHandler,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import { Easing } from "react-native-reanimated";
import timeSince from "../utils/TimeSince";
import LastActiveTimer from "../messenger/LastActiveTimer";

class ChatList extends Component {
  chatPreview = new Animated.Value(-400);
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
        }}
        onPress={() => {
          this.props.navigation.navigate("MessageScreen", {
            user: this.props.item.user,
          });
        }}>
        <LongPressGestureHandler
          minDurationMs={1000}
          maxDist={300}
          shouldCancelWhenOutside={false}
          onGestureEvent={(e) => {
            // if (e.nativeEvent.state === 4) {
            //   Animated.timing(this.chatPreview, {
            //     toValue: e.nativeEvent.y - 400,
            //     duration: 0,
            //     useNativeDriver: false,
            //   }).start();
            // }
          }}
          onHandlerStateChange={(e) => {}}>
          <Layout style={{ backgroundColor: "transparent" }}>
            <Animated.View style={transformStyle}>
              <Layout
                style={{
                  margin: 15,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  backgroundColor: "transparent",
                }}>
                <Image
                  style={{ width: 45, height: 45, borderRadius: 13 }}
                  source={{ uri: this.props?.item?.user?.profile?.image }}
                  resizeMode="cover"
                />
                {this.props.item.user.profile?.activity_status && (
                  <Layout
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 10,
                      backgroundColor: this.props.item.user.profile?.viewer
                        ? "rgba(0,0,255,0.8)"
                        : "green",
                      marginTop: 35,
                      marginLeft: -10,
                      borderWidth: 2,
                      borderColor: this.props.theme.bg.backgroundColor,
                      elevation: 2,
                    }}
                  />
                )}
                <Layout
                  style={{
                    marginLeft: 10,
                    width: Dimensions.get("screen").width - 90,
                    backgroundColor: "transparent",
                  }}>
                  <Text category="h6" style={this.props.theme.color}>
                    {this.props?.item?.user?.username}
                  </Text>
                  {this.props?.typing ? (
                    <Text
                      appearance="hint"
                      style={{ fontSize: 14, ...this.props.theme.hint }}>
                      Typing...
                    </Text>
                  ) : this.props.item?.message ? (
                    <Layout
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "transparent",
                      }}>
                      {this.props.item.message.sender ===
                      this.props.username ? (
                        this.props.item.message.seen ? (
                          <Text
                            appearance="hint"
                            style={{
                              fontSize: 14,
                              width: "50%",
                              ...this.props.theme.hint,
                            }}
                            numberOfLines={1}>
                            <Text
                              style={{
                                fontWeight: "700",
                                ...this.props.theme.hint,
                              }}
                              appearance="hint">
                              You:
                            </Text>{" "}
                            {this.props.item.message.sticker
                              ? "Sticker"
                              : this.props.item.message.gif
                              ? "GIF"
                              : this.props.item.message.message &&
                                this.props.item.message.story
                              ? "Replied to " +
                                this.props.item.message.story.user.username +
                                "'s story"
                              : this.props.item.message.story &&
                                this.props.item.message.story.user.username ===
                                  this.props.username
                              ? "Sent Your's story"
                              : this.props.item.message.story
                              ? "Sent " +
                                this.props.item.message.story.user.username +
                                "'s story"
                              : this.props.item.message.message &&
                                this.props.item.message.mopic
                              ? "Replied to " +
                                this.props.item.message.mopic.user.username +
                                "'s mopic"
                              : this.props.item.message.mopic &&
                                this.props.item.message.mopic.user.username ===
                                  this.props.username
                              ? "Sent Your's mopic"
                              : this.props.item.message.mopic
                              ? "Sent " +
                                this.props.item.message.mopic.user.username +
                                "'s mopic"
                              : this.props.item.message?.media?.mediaType?.includes(
                                  "image"
                                )
                              ? "Photo"
                              : this.props.item.message?.media?.mediaType?.includes(
                                  "video"
                                )
                              ? "Video"
                              : this.props.item.message?.media?.mediaType?.includes(
                                  "audio"
                                )
                              ? "Audio"
                              : this.props.item.message?.media
                              ? "Document"
                              : this.props.item.message.message}
                          </Text>
                        ) : this.props.item.message.sent ? (
                          <Text
                            appearance="hint"
                            style={{
                              fontSize: 14,
                              color: "rgba(0,0,255,0.8)",
                            }}>
                            {this.props.item.message.sticker
                              ? "Sticker Delivered"
                              : this.props.item.message.gif
                              ? "GIF Delivered"
                              : this.props.item.message.message &&
                                this.props.item.message.story
                              ? "Story Reply Delivered"
                              : this.props.item.message.story
                              ? "Story Delivered"
                              : this.props.item.message.message &&
                                this.props.item.message.mopic
                              ? "Mopic Reply Delivered"
                              : this.props.item.message.mopic
                              ? "Mopic Delivered"
                              : "Delivered"}
                          </Text>
                        ) : (
                          <Text
                            appearance="hint"
                            style={{
                              fontSize: 14,
                              color: "rgba(0,0,255,0.8)",
                            }}>
                            {this.props.item.message.sticker
                              ? "Sticker Sent"
                              : this.props.item.message.gif
                              ? "GIF Sent"
                              : this.props.item.message.message &&
                                this.props.item.message.story
                              ? "Story Reply Sent"
                              : this.props.item.message.story
                              ? "Story Sent"
                              : this.props.item.message.message &&
                                this.props.item.message.mopic
                              ? "Mopic Reply Sent"
                              : this.props.item.message.mopic
                              ? "Mopic Sent"
                              : "Sent"}
                          </Text>
                        )
                      ) : this.props.item.message.seen ? (
                        <Text
                          appearance="hint"
                          style={{
                            fontSize: 14,
                            width: "50%",
                            ...this.props.theme.hint,
                          }}
                          numberOfLines={1}>
                          {this.props.item.message.sticker
                            ? "Sticker"
                            : this.props.item.message.gif
                            ? "GIF"
                            : this.props.item.message.message &&
                              this.props.item.message.story
                            ? this.props.username
                              ? "Replied to your Story"
                              : "Replied " +
                                this.props.item.message.story.user.username +
                                "'s Story"
                            : this.props.item.message.story
                            ? this.props.username
                              ? "Your Story"
                              : this.props.item.message.story.user.username +
                                "'s Story"
                            : this.props.item.message.message &&
                              this.props.item.message.mopic
                            ? this.props.username
                              ? "Replied to your Mopic"
                              : "Replied " +
                                this.props.item.message.mopic.user.username +
                                "'s Mopic"
                            : this.props.item.message.mopic
                            ? this.props.username
                              ? "Your Mopic"
                              : this.props.item.message.mopic.user.username +
                                "'s Mopic"
                            : this.props.item.message?.media?.mediaType?.includes(
                                "image"
                              )
                            ? "Photo"
                            : this.props.item.message?.media?.mediaType?.includes(
                                "video"
                              )
                            ? "Video"
                            : this.props.item.message?.media?.mediaType?.includes(
                                "audio"
                              )
                            ? "Audio"
                            : this.props.item.message?.media
                            ? "Document"
                            : this.props.item.message.message}
                        </Text>
                      ) : this.props.item.message?.media?.mediaType?.includes(
                          "image"
                        ) ? (
                        <Text
                          appearance="hint"
                          style={{
                            fontSize: 14,
                            color: "rgba(0,0,255,0.8)",
                            fontWeight: "bold",
                          }}>
                          New Image Received
                        </Text>
                      ) : this.props.item.message?.media?.mediaType?.includes(
                          "video"
                        ) ? (
                        <Text
                          appearance="hint"
                          style={{
                            fontSize: 14,
                            color: "rgba(0,0,255,0.8)",
                            fontWeight: "bold",
                          }}>
                          New Video Received
                        </Text>
                      ) : this.props.item.message?.media?.mediaType?.includes(
                          "audio"
                        ) ? (
                        <Text
                          appearance="hint"
                          style={{
                            fontSize: 14,
                            color: "rgba(0,0,255,0.8)",
                            fontWeight: "bold",
                          }}>
                          New Audio Received
                        </Text>
                      ) : this.props.item.message?.media?.mediaType ? (
                        <Text
                          appearance="hint"
                          style={{
                            fontSize: 14,
                            color: "rgba(0,0,255,0.8)",
                            fontWeight: "bold",
                          }}>
                          New Document Received
                        </Text>
                      ) : (
                        <Text
                          appearance="hint"
                          style={{
                            fontSize: 14,
                            color: "rgba(0,0,255,0.8)",
                            fontWeight: "bold",
                          }}>
                          {this.props.item.message.sticker
                            ? "Sticker"
                            : this.props.item.message.gif
                            ? "GIF"
                            : this.props.item.message.message &&
                              this.props.item.message.story
                            ? this.props.item.message.story.user.username ===
                              this.props.username
                              ? "Replied to your Story"
                              : "Replied to a story"
                            : this.props.item.message.story
                            ? this.props.username
                              ? "Sent your Story"
                              : "Sent you a Story"
                            : this.props.item.message.message &&
                              this.props.item.message.mopic
                            ? this.props.item.message.mopic.user.username ===
                              this.props.username
                              ? "Replied to your Mopic"
                              : "Replied to a Mopic"
                            : this.props.item.message.mopic
                            ? this.props.username
                              ? "Sent your Mopic"
                              : "Sent you a Mopic"
                            : "New Message"}
                        </Text>
                      )}
                      {this.props.item.message.datetime ? (
                        <LastActiveTimer
                          color={this.props.theme.hint.color}
                          time={
                            new Date(
                              this.props.item.message.datetime.replace(" ", "T")
                            )
                          }
                        />
                      ) : null}
                    </Layout>
                  ) : (
                    <>
                      {this.props.item.user.profile?.activity_status ? (
                        <Text appearance="hint" style={{ fontSize: 14 }}>
                          Online
                        </Text>
                      ) : this.props.item.user.profile?.last_active ? (
                        <LastActiveTimer
                          color={this.props.theme.hint.color}
                          time={
                            new Date(
                              this.props.item.user.profile?.last_active.replace(
                                " ",
                                "T"
                              )
                            )
                          }
                        />
                      ) : null}
                    </>
                  )}
                </Layout>
              </Layout>
            </Animated.View>
            {/* <Animated.View
              style={{
                transform: [{ translateY: this.chatPreview }],
              }}>
              <Layout style={{ height: 300, backgroundColor: "red" }} />
            </Animated.View> */}
          </Layout>
        </LongPressGestureHandler>
      </TouchableWithoutFeedback>
    );
  }
}
export default connect(null, null)(ChatList);

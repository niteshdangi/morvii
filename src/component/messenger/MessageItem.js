import React, { Component, PureComponent } from "react";
import { Text, Icon, Layout, Spinner } from "@ui-kitten/components";
import Ripple from "react-native-material-ripple";
import ParsedText from "react-native-parsed-text";
import * as Contacts from "expo-contacts";
import Communications from "react-native-communications";
import Lightbox from "react-native-lightbox";
import { getLinkPreview } from "link-preview-js";
import Image from "react-native-image-progress";
import { Bar } from "react-native-progress";
import {
  Dimensions,
  Animated,
  Linking,
  PermissionsAndroid,
  View,
  Vibration,
  Slider,
} from "react-native";

import {
  PanGestureHandler,
  State,
  TapGestureHandler,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import { Divider, ProgressBar } from "react-native-paper";
import FlexImage from "react-native-flex-image";
import { Video, Audio } from "expo-av";
import * as Constants from "../Constants";
import { RecommendationObj } from "../home/recommendations";
import { LinearGradient } from "expo-linear-gradient";
const WWW_URL_PATTERN = /^www\./i;

export default class MessageItem extends Component {
  state = {
    interactive: { show: false, component: null, text: "" },
    animate: new Animated.Value(100),
    opacity: new Animated.Value(0),
    lightbox: false,
    deleted: false,
  };
  replyPan = new Animated.Value(0);
  replyTranslate = new Animated.Value(100);
  deleteTranslate = new Animated.Value(150);
  deleteAnim = new Animated.Value(0);
  onUrlPress = (url) => {
    if (WWW_URL_PATTERN.test(url)) {
      this.onUrlPress(`http://${url}`);
    } else {
      Linking.canOpenURL(url).then((supported) => {
        if (!supported) {
          console.error("No handler for URL:", url);
        } else {
          Linking.openURL(url);
        }
      });
    }
  };
  shouldComponentUpdate(p, s) {
    if (s != this.state || p != this.props) {
      return true;
    }
    return false;
  }
  animate() {
    setTimeout(() => {
      Animated.spring(this.state.animate, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      Animated.spring(this.state.opacity, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }, 100);
  }
  delete() {
    Animated.timing(this.deleteAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
    setTimeout(() => this.setState({ deleted: true }), 250);
    fetch(Constants.API_URL + "/messenger/send/", {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mid: this.props.item.id }),
    });
  }
  componentDidUpdate() {
    if (
      this.state.interactive.show &&
      this.state.interactive.text !== this.props.item.message
    ) {
      this.setState({
        interactive: { show: false, component: null, text: "" },
      });
    }
  }
  gradientRef = new Animated.Value(Dimensions.get("screen").height);
  componentDidMount() {
    this.animate();

    // console.log(this.gradientRef.current);
  }
  // componentDidUpdate() {
  //   this.animate();
  // }
  // shouldComponentUpdate(p, s) {
  //   if (
  //     this.state.interactive !== s.interactive ||
  //     p.item !== this.props.item
  //   ) {
  //     return true;
  //   }
  //   return false;
  // }
  onPhonePress = (phone) => {
    Communications.phonecall(phone, true);

    // Communications.text(phone);
  };
  onEmailPress = (email) => {
    Communications.email([email], null, null, null, null);
  };
  renderIteractive = (text, type) => {
    if (type === "phone") {
      var phone = null;
      this.props.numbers?.forEach((element) => {
        element.phoneNumbers?.forEach((number) => {
          if (
            number.number.replace(" ", "") === text ||
            number.number.replace(" ", "") === "+91" + text
          ) {
            phone = element;
          }
        });
      });

      const Component = () => (
        <>
          <MobileCard
            onPress={() => this.onPhonePress(text)}
            mobile={{ ...phone, number: text }}
          />
          {text !== this.props.item.message && (
            <Text>{this.props.item.message.replace(text, "")}</Text>
          )}
        </>
      );
      this.setState({
        interactive: { show: true, component: Component, text },
      });
    } else if (type == "url") {
      const Component = () => (
        <>
          <LinkPreview
            text={WWW_URL_PATTERN.test(text) ? "http://" + text : text}
          />
          {text !== this.props?.item?.message && (
            <Text>{this.props?.item?.message?.replace(text, "")}</Text>
          )}
        </>
      );
      this.setState({
        interactive: { show: true, component: Component, text: text },
      });
    }
    return text;
  };

  getTime(time) {
    time = new Date(time);
    var hour = time.getHours() > 12 ? time.getHours() - 12 : time.getHours();
    var minutes = time.getMinutes();
    var ampm = time.getHours() >= 12 ? "PM" : "AM";
    return `${hour}:${minutes} ${ampm}`;
  }
  formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };
  render() {
    const { item } = this.props;
    const linkStyle = {
      color: "blue",
      textDecorationLine: "underline",
    };
    if (item.xhr) {
      var self = this;
      item.xhr.upload.onprogress = function ({ total, loaded }) {
        total = self.formatBytes(total);
        loaded = self.formatBytes(loaded);
        self.setState({ xhr: { total, loaded } });
      };
    }
    if (this.state.deleted) return null;
    return (
      <Animated.View
        style={{
          transform: [
            {
              scale: this.deleteAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 0.5, 0.5],
              }),
            },
            {
              translateX: this.deleteAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -Dimensions.get("screen").width * 2],
              }),
            },
            {
              translateY: this.deleteAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -Dimensions.get("screen").width],
              }),
            },
          ],
          opacity: this.deleteAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.2],
          }),
        }}>
        <View style={{ transform: [{ scale: -1 }] }}>
          {this.state?.longPress && (
            <TapGestureHandler
              minPointers={1}
              numberOfTaps={1}
              onHandlerStateChange={({ nativeEvent }) => {
                if (this.state?.longPress) {
                  const width = Dimensions.get("screen").width;
                  const click = width - nativeEvent.absoluteX;
                  if (click < 50) {
                    this.delete();
                  } else if (click < 100) {
                    this.props.setReply(item);
                  }
                }
              }}>
              <Layout
                style={{
                  height: "100%",
                  position: "absolute",
                  width: 100,
                  right: 0,
                  zIndex: 1000,
                  elevation: 5,
                  backgroundColor: "transparent",
                }}
              />
            </TapGestureHandler>
          )}
          {this.props.date && (
            <Layout
              style={{
                backgroundColor: "transparent",
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Ripple
                style={{
                  padding: 5,
                  backgroundColor: "rgba(255,255,255,0.5)",
                  borderRadius: 50,
                  paddingHorizontal: 10,
                  margin: 5,
                }}>
                <Text>{this.props.date.toDateString()}</Text>
              </Ripple>
            </Layout>
          )}
          {this.props.item.new_message && (
            <Layout
              style={{
                backgroundColor: "transparent",
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Ripple
                style={{
                  padding: 5,
                  backgroundColor: "rgba(255,255,255,0.8)",
                  borderRadius: 50,
                  paddingHorizontal: 10,
                  margin: 5,
                }}>
                <Text>New Messages</Text>
              </Ripple>
            </Layout>
          )}
          <TouchableWithoutFeedback
            onLongPress={() => {
              this.setState({ longPress: true });
              Animated.spring(this.replyTranslate, {
                toValue: 50,
                useNativeDriver: false,
              }).start();
              Animated.spring(this.replyPan, {
                toValue: -100,
                useNativeDriver: false,
              }).start();
              Animated.spring(this.deleteTranslate, {
                toValue: 100,
                useNativeDriver: false,
              }).start();
            }}
            onPressIn={() => {
              this.setState({ pressed: true });
            }}
            onPress={() => {
              if (this.state?.longPress) {
                this.setState({ longPress: false });
                Animated.spring(this.replyTranslate, {
                  toValue: 100,
                  useNativeDriver: false,
                }).start();
                Animated.spring(this.replyPan, {
                  toValue: 0,
                  useNativeDriver: false,
                }).start();
                Animated.spring(this.deleteTranslate, {
                  toValue: 150,
                  useNativeDriver: false,
                }).start();
              }
            }}
            onPressOut={() => {
              this.setState({ pressed: false });
            }}>
            <PanGestureHandler
              minDist={20}
              activeOffsetX={20}
              onGestureEvent={(e) => {
                if (!this.state?.longPress) {
                  if (e.nativeEvent.state === State.ACTIVE) {
                    if (e.nativeEvent.translationX > 0 && !item.me)
                      Animated.timing(this.replyPan, {
                        toValue: e.nativeEvent.translationX * 0.4,
                        duration: 0,
                        useNativeDriver: false,
                      }).start();
                    else if (e.nativeEvent.translationX < 0 && item.me) {
                      Animated.timing(this.replyPan, {
                        toValue: e.nativeEvent.translationX * 0.4,
                        duration: 0,
                        useNativeDriver: false,
                      }).start();
                      Animated.timing(this.replyTranslate, {
                        toValue: e.nativeEvent.translationX * 0.4 + 100,
                        duration: 0,
                        useNativeDriver: false,
                      }).start();
                    }
                  }
                }
              }}
              onHandlerStateChange={(e) => {
                if (!this.state?.longPress) {
                  if (e.nativeEvent.state !== State.ACTIVE) {
                    Animated.spring(this.replyPan, {
                      toValue: 0,
                      useNativeDriver: false,
                    }).start();
                    Animated.timing(this.replyTranslate, {
                      toValue: 100,
                      duration: 0,
                      useNativeDriver: false,
                    }).start();
                  }
                  if (e.nativeEvent.state === State.END) {
                    if (e.nativeEvent.translationX > 150 && !item.me) {
                      this.props.setReply(this.props.item);
                      Vibration.vibrate(50);
                    } else if (e.nativeEvent.translationX < -150 && item.me) {
                      this.props.setReply(this.props.item);
                      Vibration.vibrate(50);
                    }
                  }
                }
              }}>
              <Animated.View
                style={{ transform: [{ translateX: this.replyPan }] }}>
                <Layout
                  style={{
                    alignItems: item.me ? "flex-end" : "flex-start",
                    backgroundColor: this.state.pressed
                      ? this.props.theme.bgDark.backgroundColor.startsWith("r")
                        ? this.props.theme.bgDark.backgroundColor
                        : this.props.theme.bgDark.backgroundColor + "30"
                      : "transparent",
                    marginHorizontal: 5,
                    padding: 2,
                  }}>
                  <Layout
                    style={{
                      flexDirection: "row",
                      backgroundColor: "transparent",
                      alignItems: "flex-end",
                    }}>
                    {!item.me ? (
                      !item.prev ? (
                        <Layout
                          style={{
                            borderRadius: 30,
                            overflow: "hidden",
                            marginRight: 5,
                          }}>
                          <Image
                            source={{ uri: this.props.primg }}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 30,
                            }}
                          />
                        </Layout>
                      ) : (
                        <Layout
                          style={{
                            width: 30,
                            backgroundColor: "transparent",
                            marginRight: 5,
                          }}
                        />
                      )
                    ) : null}

                    <Layout
                      style={{
                        padding: 5,
                        paddingHorizontal: 10,
                        overflow: "hidden",
                        backgroundColor:
                          item.sticker && !item.message & !item.reply
                            ? "transparent"
                            : !item.me
                            ? this.props.theme.secondary
                            : this.props.theme.primary,
                        borderBottomLeftRadius: item.me
                          ? 10
                          : item.prev
                          ? 0
                          : 10,
                        borderBottomRightRadius: item.me
                          ? item.prev
                            ? 0
                            : 10
                          : 10,
                        borderTopLeftRadius: item.me ? 10 : item.next ? 0 : 10,
                        borderTopRightRadius: item.me
                          ? item.next
                            ? 0
                            : 10
                          : 10,
                        alignItems: this.props.item.me
                          ? "flex-end"
                          : "flex-start",
                      }}>
                      {item.reply && (
                        <Layout
                          style={{
                            backgroundColor: !item.me
                              ? this.props.theme.bgLight.backgroundColor
                              : this.props.theme.bgDark.backgroundColor,
                            borderLeftWidth: 5,
                            borderRightWidth: 3,
                            borderColor: this.props.theme.bg.backgroundColor,
                            borderRadius: 10,
                            marginBottom: 2.5,
                            marginTop: 5,
                            marginRight: 2.5,
                          }}>
                          <MessageReply
                            theme={this.props.theme}
                            item={item.reply}
                            sender={item.sender}
                            me={this.props.selfUsername}
                            color={!item.me}
                            navigation={this.props.navigation}
                            token={this.props.token}
                          />
                        </Layout>
                      )}
                      {item.mopic ? (
                        <RecommendationObj
                          item={item.mopic}
                          navigation={this.props.navigation}
                          token={this.props.token}
                        />
                      ) : null}
                      {item.story ? (
                        <Layout
                          style={{
                            backgroundColor: "transparent",
                            justifyContent: "center",
                            alignItems: item.me ? "flex-end" : "flex-start",
                          }}>
                          <Layout
                            style={{
                              backgroundColor: "transparent",
                              flexDirection: "row",
                            }}>
                            {item.me && (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: !item.me
                                    ? this.props.theme.secondaryAccent
                                    : this.props.theme.primaryAccent,
                                }}>
                                You{" "}
                              </Text>
                            )}
                            {this.props.item.message ? (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: !item.me
                                    ? this.props.theme.secondaryAccentHint
                                    : this.props.theme.primaryAccentHint,
                                  maxWidth: Dimensions.get("screen").width / 2,
                                }}>
                                {item.story.user.username ===
                                this.props.selfUsername
                                  ? "Replied to your Story"
                                  : "Replied to " +
                                    item.story.user.username +
                                    "'s story"}
                              </Text>
                            ) : (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: !item.me
                                    ? this.props.theme.secondaryAccentHint
                                    : this.props.theme.primaryAccentHint,
                                  maxWidth: Dimensions.get("screen").width / 2,
                                }}>
                                {item.story.user.username ===
                                this.props.selfUsername
                                  ? "Sent your Story"
                                  : "Sent " +
                                    item.story.user.username +
                                    "'s story"}
                              </Text>
                            )}
                          </Layout>

                          {item.story.media ? (
                            <Layout
                              style={{
                                backgroundColor: "transparent",
                                marginTop: 5,
                                borderRadius: 10,
                              }}>
                              <Layout
                                style={{
                                  backgroundColor: "transparent",
                                  flexDirection: "row",
                                  alignItems: "center",
                                  marginBottom: -35,
                                  elevation: 2,
                                  marginLeft: 5,
                                }}>
                                <Layout
                                  style={{
                                    borderRadius: 40,
                                    overflow: "hidden",
                                  }}>
                                  <Image
                                    source={{
                                      uri: item.story.user?.profile.image,
                                    }}
                                    style={{
                                      width: 30,
                                      height: 30,
                                      borderRadius: 40,
                                    }}
                                  />
                                </Layout>
                                <Text
                                  numberOfLines={1}
                                  style={{
                                    fontSize: 13,
                                    width:
                                      Dimensions.get("screen").width / 3 - 35,
                                    marginLeft: 5,
                                    color: this.props.theme.primaryAccent,
                                  }}>
                                  {item.story.user.username}
                                </Text>
                              </Layout>
                              <Layout
                                style={{
                                  borderRadius: 10,
                                  overflow: "hidden",
                                  width: Dimensions.get("screen").width / 3,
                                  backgroundColor: "transparent",
                                }}>
                                <FlexImage
                                  source={{ uri: item.story.media.uri }}
                                  style={{
                                    width: Dimensions.get("screen").width / 3,
                                    borderRadius: 10,
                                  }}
                                />
                              </Layout>
                            </Layout>
                          ) : null}
                        </Layout>
                      ) : null}
                      {item.sticker ? (
                        <FlexImage
                          source={{ uri: item.sticker }}
                          style={{ width: 120, marginTop: 10 }}
                          resizeMode="contain"
                        />
                      ) : null}
                      {this.state.interactive.show ? (
                        <this.state.interactive.component />
                      ) : (
                        <ParsedText
                          parse={[
                            {
                              type: "url",
                              style: linkStyle,
                              onPress: this.onUrlPress,
                              renderText: (text) =>
                                this.renderIteractive(text, "url"),
                            },
                            {
                              type: "phone",
                              style: linkStyle,
                              onPress: this.onPhonePress,
                              renderText: (text) =>
                                this.renderIteractive(text, "phone"),
                            },
                            {
                              type: "email",
                              style: linkStyle,
                              onPress: this.onEmailPress,
                              renderText: (text) =>
                                this.renderIteractive(text, "email"),
                            },
                          ]}
                          style={{
                            color: !item.me
                              ? this.props.theme.secondaryAccent
                              : this.props.theme.primaryAccent,
                            maxWidth: Dimensions.get("window").width - 150,
                          }}>
                          {this.props.item.message}
                        </ParsedText>
                      )}
                      {item.gif ? (
                        <Lightbox
                          swipeToDismiss={true}
                          onOpen={() => this.setState({ lightbox: true })}
                          willClose={() => this.setState({ lightbox: false })}
                          activeProps={{}}>
                          {this.state.lightbox ? (
                            <Image
                              style={{
                                width: Dimensions.get("screen").width,
                                height: Dimensions.get("screen").height,
                                borderRadius: 13,
                                resizeMode: "contain",
                              }}
                              resizeMode="contain"
                              source={{ uri: item.gif }}
                            />
                          ) : (
                            <FlexImage
                              style={{
                                width:
                                  Dimensions.get("screen").width -
                                  Dimensions.get("screen").width / 2,
                                borderRadius: 13,
                                resizeMode: "contain",
                              }}
                              source={{ uri: item.gif }}
                            />
                          )}
                        </Lightbox>
                      ) : null}
                      {item.media &&
                        (item.media.mediaType?.includes("audio") ? (
                          <AudioPlayer
                            theme={this.props.theme}
                            source={item.media?.uri}
                          />
                        ) : (
                          <Lightbox
                            swipeToDismiss={true}
                            onOpen={() => this.setState({ lightbox: true })}
                            willClose={() => this.setState({ lightbox: false })}
                            activeProps={{
                              style: {
                                resizeMode: "contain",
                                height: Dimensions.get("screen").height,
                              },
                            }}>
                            {this.state.lightbox ? (
                              item?.media?.mediaType?.includes("video") ? (
                                <Video
                                  style={{
                                    width: Dimensions.get("screen").width,
                                    height: Dimensions.get("screen").width,
                                    borderRadius: 13,
                                    resizeMode: "contain",
                                  }}
                                  source={{ uri: item.media.uri }}
                                  shouldPlay
                                  isMuted={false}
                                  isLooping
                                />
                              ) : (
                                <Image
                                  style={{
                                    width: Dimensions.get("screen").width,
                                    height: Dimensions.get("screen").width,
                                    borderRadius: 13,
                                    resizeMode: "contain",
                                  }}
                                  source={{ uri: item.media.uri }}
                                />
                              )
                            ) : (
                              <>
                                <Image
                                  style={{
                                    width:
                                      Dimensions.get("screen").width -
                                      Dimensions.get("screen").width / 2,
                                    height:
                                      Dimensions.get("screen").width -
                                      Dimensions.get("screen").width / 2,
                                    borderRadius: 13,
                                    resizeMode: "cover",
                                  }}
                                  source={{ uri: item.media.uri }}
                                />
                                {item.xhr && !this.state.xhr && (
                                  <Layout
                                    style={{
                                      position: "absolute",
                                      width: "100%",
                                      height: "100%",
                                      top: 0,
                                      left: 0,
                                      backgroundColor: "rgba(0,0,0,0.2)",
                                      borderRadius: 13,
                                      justifyContent: "center",
                                      alignItems: "center",
                                    }}>
                                    <Spinner size="large" />
                                  </Layout>
                                )}
                                {item.xhr && this.state.xhr && (
                                  <Layout
                                    style={{
                                      position: "absolute",
                                      width: "100%",
                                      height: "100%",
                                      top: 0,
                                      left: 0,
                                      backgroundColor: "rgba(0,0,0,0.2)",
                                      borderRadius: 13,
                                      justifyContent: "center",
                                      alignItems: "center",
                                    }}>
                                    <Text>
                                      {this.state.xhr.loaded}/
                                      {this.state.xhr.total}
                                    </Text>
                                  </Layout>
                                )}
                                {item.media?.mediaType?.includes("video") && (
                                  <Layout
                                    style={{
                                      position: "absolute",
                                      width: "100%",
                                      height: "100%",
                                      top: 0,
                                      left: 0,
                                      backgroundColor: "rgba(0,0,0,0.2)",
                                      borderRadius: 13,
                                      justifyContent: "center",
                                      alignItems: "center",
                                    }}>
                                    <Icon
                                      name="play-circle-outline"
                                      style={{
                                        width: 60,
                                        height: 60,
                                        tintColor: "#d6d6d6",
                                      }}
                                    />
                                  </Layout>
                                )}
                              </>
                            )}
                          </Lightbox>
                        ))}
                      <Layout
                        style={{
                          backgroundColor: "transparent",
                          flexDirection: "row",
                          justifyContent: "center",
                          alignItems: "center",
                        }}>
                        {item.datetime && (
                          <Text
                            appearance="hint"
                            style={{
                              color: this.props.theme.hint.color,
                              fontSize: 12,
                            }}>
                            {this.getTime(new Date(item.datetime))}
                          </Text>
                        )}
                        {item.me && item?.sending && !item.failed && (
                          <Icon
                            name="clock-outline"
                            style={{
                              width: 15,
                              height: 15,
                              tintColor: "rgba(0,0,0,0.3)",
                            }}
                          />
                        )}
                        {item.me && !item?.sending && item.failed && (
                          <Icon
                            name="alert-circle-outline"
                            style={{
                              width: 15,
                              height: 15,
                              tintColor: "rgba(255,0,0,0.3)",
                            }}
                          />
                        )}
                      </Layout>
                    </Layout>
                    {item.me && (
                      <>
                        <Animated.View
                          style={{
                            justifyContent: "center",
                            alignItems: "center",
                            width: 50,
                            transform: [
                              {
                                translateX: this.replyTranslate.interpolate({
                                  inputRange: [-100, 50, 70],
                                  outputRange: [50, 50, 70],
                                }),
                              },
                              {
                                scale: this.replyTranslate.interpolate({
                                  inputRange: [-100, 50, 70],
                                  outputRange: [1, 1, 0],
                                }),
                              },
                            ],
                            marginLeft: -50,
                          }}>
                          <Ripple
                            style={{
                              padding: 5,
                              backgroundColor: "rgba(255,255,255,0.3)",
                              borderRadius: 50,
                            }}>
                            <Icon
                              style={{
                                width: 25,
                                height: 25,
                                tintColor: "blue",
                              }}
                              name="corner-down-right-outline"
                            />
                          </Ripple>
                        </Animated.View>
                        <Animated.View
                          style={{
                            justifyContent: "center",
                            alignItems: "center",
                            width: 50,
                            transform: [
                              { translateX: this.deleteTranslate },
                              {
                                scale: this.deleteTranslate.interpolate({
                                  inputRange: [100, 150],
                                  outputRange: [1, 0],
                                }),
                              },
                            ],
                            marginLeft: -50,
                          }}>
                          <Ripple
                            style={{
                              padding: 5,
                              backgroundColor: "rgba(255,255,255,0.3)",
                              borderRadius: 50,
                            }}>
                            <Icon
                              style={{
                                width: 25,
                                height: 25,
                                tintColor: "red",
                              }}
                              name="trash-2-outline"
                            />
                          </Ripple>
                        </Animated.View>
                      </>
                    )}
                  </Layout>
                </Layout>
              </Animated.View>
            </PanGestureHandler>
          </TouchableWithoutFeedback>
          {this.props.seen && item.me && this.props.isLast && (
            <Layout
              style={{
                backgroundColor: "transparent",
                justifyContent: "flex-end",
              }}>
              <Text
                style={{
                  textAlign: "right",
                  fontSize: 12,
                  marginRight: 5,
                  ...this.props.theme.hint,
                }}
                appearance="hint">
                Seen
              </Text>
            </Layout>
          )}
          {!this.props.seen && this.props.sent && item.me && this.props.isLast && (
            <Layout
              style={{
                backgroundColor: "transparent",
                justifyContent: "flex-end",
              }}>
              <Text
                style={{
                  textAlign: "right",
                  fontSize: 12,
                  marginRight: 5,
                  ...this.props.theme.hint,
                }}
                appearance="hint">
                Delivered
              </Text>
            </Layout>
          )}
        </View>
      </Animated.View>
    );
  }
}
class LinkPreview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isUri: false,
      linkTitle: undefined,
      linkDesc: undefined,
      linkFavicon: undefined,
      linkImg: undefined,
    };
    this.getPreview(props.text);
  }

  componentDidUpdate(nextProps) {
    if (nextProps.text !== this.props.text) {
      this.getPreview(nextProps.text);
    } else if (nextProps.text == null) {
      this.setState({ isUri: false });
    }
  }
  getPreview = (text) => {
    // const { onError, onLoad } = this.props;
    getLinkPreview(text)
      .then((data) => {
        // onLoad(data);
        this.setState({
          isUri: true,
          linkTitle: data.title ? data.title : undefined,
          linkDesc: data.description ? data.description : undefined,
          linkImg:
            data.images && data.images.length > 0
              ? data.images.find(function (element) {
                  return (
                    element.includes(".png") ||
                    element.includes(".jpg") ||
                    element.includes(".jpeg")
                  );
                })
              : undefined,
          linkFavicon:
            data.favicons && data.favicons.length > 0
              ? data.favicons[data.favicons.length - 1]
              : undefined,
        });
      })
      .catch((error) => {
        this.setState({ isUri: false });
      });
  };
  onLinkPress = () => {
    setTimeout(() => {
      var url = this.props.text;
      if (WWW_URL_PATTERN.test(url)) {
        this.onUrlPress(`http://${url}`);
      } else {
        Linking.canOpenURL(url).then((supported) => {
          if (!supported) {
            console.error("No handler for URL:", url);
          } else {
            Linking.openURL(url);
          }
        });
      }
    }, 200);
  };
  render() {
    return this.state.isUri ? (
      this.props.reply ? (
        <Layout
          style={{
            backgroundColor: "#fff",
            elevation: 5,
            borderRadius: 10,
            padding: 5,
            width: Dimensions.get("screen").width - 100,
          }}>
          <Ripple onPress={this.onLinkPress}>
            <Layout
              style={{
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
              }}>
              {this.state.linkFavicon && (
                <Image
                  source={{
                    uri: this.state.linkFavicon,
                  }}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 30,
                    borderWidth: 1,
                  }}
                  resizeMode="contain"
                />
              )}
              <Text category="h6" style={{ padding: 5 }}>
                {this.state.linkTitle ? this.state.linkTitle : this.props.text}
              </Text>
            </Layout>

            {this.state.linkDesc && (
              <>
                <Divider />
                <Text numberOfLines={1}>{this.state.linkDesc}</Text>
              </>
            )}
            {this.state.linkTitle && (
              <>
                <Divider />
                <Text
                  style={{ color: "blue", textDecorationLine: "underline" }}>
                  {this.props.text}
                </Text>
              </>
            )}
          </Ripple>
        </Layout>
      ) : (
        <Layout
          style={{
            backgroundColor: "#fff",
            elevation: 5,
            borderRadius: 10,
            padding: 5,
            width: Dimensions.get("screen").width - 100,
          }}>
          <Ripple
            onPress={this.onLinkPress}
            style={{ flexDirection: "row", overflow: "hidden" }}>
            {this.state.linkImg || this.state.linkFavicon ? (
              <Layout style={{ backgroundColor: "#e5e5e5" }}>
                <Image
                  source={{
                    uri: this.state.linkImg
                      ? this.state.linkImg
                      : this.state.linkFavicon,
                  }}
                  style={{
                    width: 100,
                    height: 100,
                  }}
                  resizeMode="cover"
                />
              </Layout>
            ) : null}
            <Layout
              style={{
                justifyContent: "space-between",
                width: Dimensions.get("screen").width - 210,
              }}>
              {this.state.linkDesc && (
                <>
                  <Text numberOfLines={3}>{this.state.linkDesc}</Text>
                </>
              )}
              {this.state.linkTitle && (
                <>
                  <Divider />
                  <Text
                    style={{ color: "blue", textDecorationLine: "underline" }}>
                    {this.props.text}
                  </Text>
                </>
              )}
            </Layout>
          </Ripple>
        </Layout>
      )
    ) : (
      <TouchableWithoutFeedback onPress={this.onLinkPress}>
        <Text style={{ color: "blue", textDecorationLine: "underline" }}>
          {this.props.text}
        </Text>
      </TouchableWithoutFeedback>
    );
  }
}
class MessageReply extends Component {
  render() {
    return (
      <Layout style={{ padding: 5, backgroundColor: "transparent" }}>
        <Text
          style={[
            {
              fontSize: 11,
              fontWeight: "bold",
            },
            !this.props.color ? { color: "#e8e8e8" } : {},
          ]}
          appearance="hint">
          {this.props.item.receiver === this.props.me
            ? "Replied to You"
            : this.props.item.sender
            ? "Replied to " + this.props.item.sender
            : "Replied"}
        </Text>
        <Divider />
        <Layout style={{ padding: 5, backgroundColor: "transparent" }}>
          {this.props.item.message ? (
            <Text
              style={[
                { fontSize: 13 },
                !this.props.color ? { color: "#e8e8e8" } : {},
              ]}>
              {this.props.item.message}
            </Text>
          ) : this.props.item.mopic ? (
            <RecommendationObj
              item={this.props.item.mopic}
              navigation={this.props.navigation}
              token={this.props.token}
            />
          ) : this.props.item.story ? (
            <Layout
              style={{
                backgroundColor: "transparent",
                marginTop: 5,
                borderRadius: 10,
              }}>
              <Layout
                style={{
                  backgroundColor: "transparent",
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: -35,
                  elevation: 2,
                  marginLeft: 5,
                }}>
                <Image
                  source={{
                    uri: this.props.item.story.user?.profile.image,
                  }}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 40,
                  }}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 13,
                    width: Dimensions.get("screen").width / 3 - 35,
                    marginLeft: 5,
                    color: "#fff",
                  }}>
                  {this.props.item.story.user.username}
                </Text>
              </Layout>
              <Image
                source={{ uri: this.props.item.story.media.uri }}
                style={{
                  width: Dimensions.get("screen").width / 3,
                  aspectRatio: 9 / 16,
                  borderRadius: 10,
                }}
              />
            </Layout>
          ) : this.props.item?.media?.mediaType?.includes("video") ? (
            <Video
              source={{ uri: this.props.item?.media.uri }}
              style={{ width: 100, height: 50 }}
              resizeMode="cover"
              shouldPlay
              isMuted
              isLooping
            />
          ) : this.props.item?.media?.mediaType?.includes("image") ? (
            <Image
              source={{ uri: this.props.item?.media.uri }}
              style={{ width: 100, aspectRatio: 3 / 4, borderRadius: 10 }}
              resizeMode="cover"
            />
          ) : this.props.item?.media?.mediaType?.includes("audio") ? (
            <Text>Audio</Text>
          ) : this.props.item?.sticker ? (
            <Image
              source={{ uri: this.props.item?.sticker }}
              style={{ width: 100, aspectRatio: 1 / 1, borderRadius: 10 }}
              resizeMode="cover"
            />
          ) : this.props.item?.gif ? (
            <Image
              source={{ uri: this.props.item?.gif }}
              style={{ width: 100, aspectRatio: 1 / 1, borderRadius: 10 }}
              resizeMode="cover"
            />
          ) : null}
        </Layout>
      </Layout>
    );
  }
}
class MobileCard extends Component {
  render() {
    const { mobile } = this.props;
    return mobile ? (
      <Layout
        style={{
          backgroundColor: "#fff",
          elevation: 5,
          borderRadius: 10,
          padding: 5,
        }}>
        <Ripple
          onPress={() => {
            this.props?.onPress();
          }}>
          <Layout
            style={{
              justifyContent: "space-between",
              flexDirection: "row",
              alignItems: "center",
            }}>
            {mobile.imageAvailable ? (
              <Image
                source={{ uri: mobile.image.uri }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 50,
                  borderWidth: 1,
                }}
              />
            ) : (
              <Layout
                style={{
                  backgroundColor: "transparent",
                  borderRadius: 50,
                  borderWidth: 1,
                  padding: 10,
                }}>
                <Icon
                  name="phone-outline"
                  style={{
                    width: 30,
                    height: 30,
                    tintColor: "#000",
                  }}
                />
              </Layout>
            )}
            <Layout style={{ marginLeft: 5 }}>
              {mobile.name ? <Text>{mobile.name}</Text> : null}
              <Text appearance={mobile.name ? "hint" : "default"}>
                {mobile.number}
              </Text>
            </Layout>
          </Layout>
        </Ripple>
        {this.props.add ? (
          <Layout style={{ paddingVertical: 5, alignItems: "center" }}>
            <Ripple
              onPress={async () => {
                try {
                  const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS
                  );
                  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    console.log("You can use the camera");
                    Contacts.addContactAsync({ phoneNumbers: [mobile.number] });
                  } else {
                    console.log("Camera permission denied");
                  }
                } catch (err) {
                  console.warn(err);
                }
              }}>
              <Text style={{ color: "blue" }}>Add to Contacts</Text>
            </Ripple>
          </Layout>
        ) : null}
      </Layout>
    ) : null;
  }
}
class AudioPlayer extends PureComponent {
  state = { error: false };
  async componentDidMount() {
    try {
      this.audio = new Audio.Sound();
      await this.audio.loadAsync({ uri: this.props.source });
      this.audio.setOnPlaybackStatusUpdate((e) => {
        if (e.didJustFinish) {
          this.audio.stopAsync();
        }
        this.setState({ ...e });
      });
    } catch (error) {
      this.setState({ error: true });
      console.log(error);
    }
  }
  componentWillUnmount() {
    this.audio?.unloadAsync();
  }
  render() {
    return (
      <Layout
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "transparent",
        }}>
        {this.state.isBuffering ? (
          <Spinner />
        ) : (
          <Ripple
            onPress={async () => {
              this.state.isPlaying
                ? await this.audio.pauseAsync()
                : await this.audio.playAsync();
            }}>
            <Icon
              style={{ width: 30, height: 30, ...this.props.theme.color }}
              name={
                this.state.isPlaying
                  ? "pause-circle-outline"
                  : "play-circle-outline"
              }
            />
          </Ripple>
        )}
        <Slider
          thumbTintColor={this.props.theme.bg.backgroundColor}
          minimumTrackTintColor={this.props.theme.hint.color}
          maximumTrackTintColor={this.props.theme.hint.color}
          style={{
            width: Dimensions.get("screen").width / 3,
            tintColor: "blue",
          }}
          value={this.state.positionMillis}
          maximumValue={this.state.durationMillis}
          onValueChange={(v) => {
            this.audio.setPositionAsync(v);
          }}
        />
      </Layout>
    );
  }
}

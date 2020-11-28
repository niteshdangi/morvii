import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { setShortModal, setShortModalProps } from "../../actions/ShortModal";
import { connect } from "react-redux";
import * as Progress from "react-native-progress";
import {
  StatusBar,
  Dimensions,
  Image,
  Animated,
  View,
  PanResponder,
  Keyboard,
  ToastAndroid,
  Alert,
} from "react-native";
import {
  Layout,
  Text,
  Button,
  Icon,
  Input,
  Spinner,
} from "@ui-kitten/components";
import StoryView from "../home/stories";
import {
  TouchableWithoutFeedback,
  FlatList,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
  PanGestureHandler,
} from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { Easing } from "react-native-reanimated";
import DoubleClick from "react-native-double-tap";
import { ProgressBar } from "react-native-paper";
import InViewPort from "./InViewport";
import Ripple from "react-native-material-ripple";
import * as Constants from "../Constants";
import { Video } from "expo-av";
import { Modalize } from "react-native-modalize";
import LastActiveTimer from "../messenger/LastActiveTimer";
const screenHeight = Dimensions.get("window").height * 1.2;
export default class StoryMopic extends Component {
  state = {
    index: 0,
    loading: false,
    paused: false,
    input: false,
    story: [],
    loading: true,
  };
  progress = 0;
  progressInterval = null;
  paused = false;
  videoRef = React.createRef();
  InputRef = React.createRef();
  progressAnim = new Animated.Value(-Dimensions.get("screen").width / 2);
  keyboardAnim = new Animated.Value(0);
  _LongPressGestureHandler = React.createRef();
  _PanGestureHandlerX = React.createRef();
  _PanGestureHandlerY = React.createRef();
  shouldOpenKeyboard = false;
  componentDidMount() {
    this.keyboardShow = Keyboard.addListener(
      "keyboardDidShow",
      this.handleShow.bind(this)
    );
    this.keyboardHide = Keyboard.addListener(
      "keyboardDidHide",
      this.handleHide.bind(this)
    );
  }
  handleHide = () => {
    this.setState({ input: false, paused: false });
    this.videoRef?.current?.playAsync();
    this.InputRef?.current?.blur();
  };
  handleShow = (e) => {
    this.setState({ input: true, paused: true });
    this.videoRef?.current?.pauseAsync();
  };

  componentWillUnmount() {
    this.keyboardHide.remove();
    this.keyboardShow.remove();
  }
  UNSAFE_componentWillReceiveProps(props) {
    if (props.index !== this.props.index) {
      clearInterval(this.progressInterval);
      this.progress = 0;
      Animated.timing(this.progressAnim, {
        toValue:
          this.props?.story.length === 1
            ? -Dimensions.get("screen").width
            : -Dimensions.get("screen").width / 2,
        duration: 100,
        useNativeDriver: false,
      }).start();
      this.setState({ index: 0 });
    }
  }
  startTimer(timer = 10) {
    clearInterval(this.progressInterval);
    this.progress = 0;
    Animated.timing(this.progressAnim, {
      toValue:
        this.props?.story.length === 1
          ? -Dimensions.get("screen").width
          : -Dimensions.get("screen").width / 2,
      duration: 100,
      useNativeDriver: false,
    }).start();
    this.progressInterval = setInterval(() => {
      if (this.progress <= timer && !this.state.paused) {
        this.progress = this.progress + 1;
        Animated.timing(this.progressAnim, {
          toValue:
            this.props?.story.length === 1
              ? -Dimensions.get("screen").width +
                (Dimensions.get("screen").width / timer) * (this.progress - 1)
              : -Dimensions.get("screen").width / 2 +
                (Dimensions.get("screen").width / (2 * timer)) *
                  (this.progress - 1),
          duration: 1000,
          easing: Easing.linear(),
          useNativeDriver: false,
        }).start();
      } else if (!this.state.paused && this.progress > timer) {
        this.progress = 0;
        clearInterval(this.progressInterval);
        if (this.state.index < this.props?.story?.length - 1) {
          Animated.timing(this.progressAnim, {
            toValue:
              this.props?.story.length === 1
                ? -Dimensions.get("screen").width
                : -Dimensions.get("screen").width / 2,
            duration: 100,
            useNativeDriver: false,
          }).start();
          this.setState({ index: this.state.index + 1 });
        } else {
          this.props?.next();
        }
      }
    }, 1000);
  }
  viewModal = React.createRef();
  getViews() {
    fetch(
      Constants.API_URL +
        "/story/view/" +
        this.props.story[this.state.index]?.sid +
        "/",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Token " + this.props.token,
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        this.setState({ views: data.views });
      })
      .catch(() => {});
  }
  render() {
    const { item, story, loading } = this.props;
    var pBars = [];
    var lBars = [];
    for (let index = 0; index < this.state.index; index++) {
      pBars.push(
        <Layout
          style={{
            width:
              (Dimensions.get("screen").width -
                Dimensions.get("screen").width / 2) /
                story.length -
              1,
            height: 2,
            borderRadius: 5,
          }}
        />
      );
    }
    for (let index = 0; index < story.length - this.state.index - 1; index++) {
      lBars.push(
        <Layout
          style={{
            width:
              (Dimensions.get("screen").width -
                Dimensions.get("screen").width / 2) /
                story.length -
              1,
            height: 2,
            borderRadius: 5,
            backgroundColor: "rgba(255,255,255,0.5)",
          }}
        />
      );
    }
    return (
      <Layout style={{ flex: 1, backgroundColor: "transparent" }}>
        <Modalize
          onOpened={() => {
            this.getViews();
            this.setState({ paused: true });
          }}
          snapPoint={Dimensions.get("screen").height / 2}
          HeaderComponent={
            <Layout
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                padding: 10,
                flexDirection: "row",
                borderTopRightRadius: 10,
                borderTopLeftRadius: 10,
                elevation: 3,
                paddingHorizontal: 20,
              }}>
              <Text category="h6">Views</Text>
              <Text category="h6">{this.state?.views?.length}</Text>
              <Ripple
                style={{ padding: 5, zIndex: 100 }}
                onPress={() => {
                  Alert.alert("", "Delete Story?", [
                    {
                      text: "Delete",
                      onPress: () => {
                        fetch(
                          Constants.API_URL +
                            "/story/view/" +
                            story[this.state.index]?.sid +
                            "/",
                          {
                            method: "DELETE",
                            headers: {
                              Accept: "application/json",
                              Authorization: "Token " + this.props.token,
                              "Content-Type": "application/json",
                            },
                          }
                        );
                        this.props.delete();
                      },
                      style: "cancel",
                    },
                    { text: "Cancel" },
                  ]);
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
            </Layout>
          }
          onClosed={() => this.setState({ paused: false })}
          ref={this.viewModal}>
          {this.state?.views ? (
            this.state.views?.map((item, index) => {
              return (
                <Layout
                  key={index}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    padding: 5,
                    margin: 5,
                    alignItems: "center",
                  }}>
                  <TouchableWithoutFeedback
                    onPress={() => {
                      this.props.close();
                      this.props.navigation.navigate("ProfileScreen", {
                        username: item.user.username,
                      });
                    }}
                    style={{ flexDirection: "row", alignItems: "center" }}>
                    <Layout style={{ borderWidth: 1, borderRadius: 50 }}>
                      <Image
                        style={{ width: 50, height: 50, borderRadius: 50 }}
                        source={{ uri: item.user.profile.image }}
                      />
                    </Layout>
                    {item.user.first_name + item.user.last_name !== "" ? (
                      <Layout style={{ marginLeft: 10, width: "60%" }}>
                        <Text numberOfLines={1}>
                          {item.user.first_name + " " + item.user.last_name}
                        </Text>
                        <Text numberOfLines={1} appearance="hint">
                          {item.user.username}
                        </Text>
                      </Layout>
                    ) : (
                      <Text
                        numberOfLines={1}
                        style={{ marginLeft: 10, width: "60%" }}>
                        {item.user.username}
                      </Text>
                    )}
                  </TouchableWithoutFeedback>
                  <Layout
                    style={{
                      justifyContent: "flex-end",
                      alignItems: "flex-end",
                    }}>
                    <Layout style={{ padding: 5 }}>
                      <LastActiveTimer time={item.datetime} />
                    </Layout>
                    <Button
                      size="small"
                      style={{ height: 20 }}
                      appearance="filled"
                      onPress={() => {
                        this.props.close();
                        this.props.navigation.navigate("MessageScreen", {
                          user: item.user,
                        });
                      }}>
                      Message
                    </Button>
                  </Layout>
                </Layout>
              );
            })
          ) : (
            <Layout
              style={{
                height: 150,
                justifyContent: "flex-end",
                alignItems: "center",
              }}>
              <Spinner />
            </Layout>
          )}
        </Modalize>
        <PanGestureHandler
          activeOffsetX={[-20, 20]}
          ref={this._PanGestureHandlerX}
          simultaneousHandlers={[this._LongPressGestureHandler]}
          onHandlerStateChange={(e) => {
            if (e.nativeEvent.state === State.ACTIVE) {
              this.setState({ paused: true });
              this.props.self
                ? this.viewModal.current.close()
                : this.InputRef.current?.blur();
            } else {
              if (!this.state.input) {
                story[this.state.index]?.media?.mediaType?.includes("video") &&
                  this.videoRef?.current?.playAsync();
                this.setState({ paused: false });
              }
            }
            this.props?.onHandlerStateChangeX(e);
          }}
          onGestureEvent={(e) => {
            this.props?.PanResponderX(e);
          }}>
          <PanGestureHandler
            activeOffsetY={[-50, 50]}
            ref={this._PanGestureHandlerY}
            simultaneousHandlers={[this._LongPressGestureHandler]}
            onHandlerStateChange={(e) => {
              if (
                e.nativeEvent.state === State.ACTIVE &&
                e.nativeEvent.oldState == State.BEGAN
              ) {
                if (e.nativeEvent.velocityY < 0) {
                  this.shouldOpenKeyboard = true;
                } else {
                  this.shouldOpenKeyboard = false;
                }
              }
              if (e.nativeEvent.state === State.ACTIVE) {
                this.setState({ paused: true });
                this.InputRef.current?.blur();
              } else {
                if (!this.state.input) {
                  story[this.state.index]?.media?.mediaType?.includes(
                    "video"
                  ) && this.videoRef?.current?.playAsync();
                  this.setState({ paused: false });
                }
              }
              this.props?.onHandlerStateChangeY(e);
            }}
            onGestureEvent={(e) => {
              if (
                e.nativeEvent.translationY < -100 &&
                this.shouldOpenKeyboard
              ) {
                this.props.self
                  ? this.viewModal.current.open()
                  : this.InputRef.current.focus();
                story[this.state.index]?.media?.mediaType?.includes("video") &&
                  this.videoRef?.current?.pauseAsync();
                this.setState({ paused: true });
              }
              if (e.nativeEvent.translationY > 50 && this.shouldOpenKeyboard) {
                this.shouldOpenKeyboard = false;
              }

              this.props?.PanResponderY(e);
            }}>
            <LongPressGestureHandler
              minDurationMs={100}
              ref={this._LongPressGestureHandler}
              simultaneousHandlers={[
                this._PanGestureHandlerX,
                this._PanGestureHandlerY,
              ]}
              // waitFor={this._TapGestureHandler}
              onHandlerStateChange={(e) => {
                if (e.nativeEvent.state === State.ACTIVE) {
                  story[this.state.index]?.media?.mediaType?.includes(
                    "video"
                  ) && this.videoRef?.current?.pauseAsync();
                  this.setState({ paused: true });
                } else {
                  if (!this.state.input) {
                    story[this.state.index]?.media?.mediaType?.includes(
                      "video"
                    ) && this.videoRef?.current?.playAsync();
                    this.setState({ paused: false });
                  }
                }
              }}>
              <TapGestureHandler
                minPointers={1}
                numberOfTaps={1}
                onHandlerStateChange={(e) => {
                  if (e.nativeEvent.state === 5) {
                    const { x, y } = e.nativeEvent;
                    if (y < Dimensions.get("screen").height - 70) {
                      if (x < 50) {
                        if (this.state.index > 0) {
                          clearInterval(this.progressInterval);
                          this.progress = 0;
                          Animated.timing(this.progressAnim, {
                            toValue: -Dimensions.get("screen").width / 2,
                            duration: 100,
                            useNativeDriver: false,
                          }).start();
                          this.setState({
                            index: this.state.index - 1,
                            loading: false,
                          });
                        } else {
                          this.props.prev();
                        }
                      } else {
                        if (this.state.index < story.length - 1) {
                          clearInterval(this.progressInterval);
                          this.progress = 0;
                          Animated.timing(this.progressAnim, {
                            toValue: -Dimensions.get("screen").width / 2,
                            duration: 100,
                            useNativeDriver: false,
                          }).start();
                          this.setState({
                            index: this.state.index + 1,
                            loading: false,
                          });
                        } else {
                          this.props?.next();
                        }
                      }
                    } else {
                      console.log("bottom");
                    }
                  }
                }}>
                {loading && story.length === 0 ? (
                  <Layout
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "transparent",
                      width: Dimensions.get("screen").width,
                    }}>
                    <Layout
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        width: Dimensions.get("screen").width,
                        height: "100%",
                        position: "absolute",
                        zIndex: 2000,
                        backgroundColor: "rgba(0,0,0,0.5)",
                      }}>
                      <Spinner />
                    </Layout>
                    <StoryView size={100} image={item.user.profile.image} />
                    {/* <Text category="h6" style={{ color: "#fff", marginTop: 10 }}>
            {item.user.username}
          </Text> */}
                  </Layout>
                ) : (
                  <Animated.View style={{ flex: 1 }}>
                    <SafeAreaView style={{ flex: 1 }}>
                      <Layout
                        style={{
                          flex: 1,
                          backgroundColor: "#111",
                          width: Dimensions.get("screen").width,
                          borderRadius: 10,
                          overflow: "hidden",
                        }}>
                        <LinearGradient
                          colors={["#111", "transparent"]}
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: StatusBar.currentHeight,
                            height: 70,
                            elevation: 1,
                          }}
                        />
                        <Layout
                          style={{
                            elevation: 2,
                            backgroundColor: "transparent",
                          }}>
                          <Layout
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-around",
                              alignItems: "center",
                              elevation: 3,
                              height: 10,
                              backgroundColor: "transparent",
                              padding: 3,
                            }}>
                            {pBars}
                            <Layout
                              style={{
                                width:
                                  this.props?.story.length === 1
                                    ? Dimensions.get("screen").width - 20
                                    : Dimensions.get("screen").width / 2,
                                height: 3,
                                borderRadius: 5,
                                backgroundColor: "rgba(255,255,255,0.5)",
                                overflow: "hidden",
                              }}>
                              <Animated.View
                                style={{
                                  backgroundColor: "#fff",
                                  height: 3,
                                  width:
                                    this.props?.story.length === 1
                                      ? Dimensions.get("screen").width - 20
                                      : Dimensions.get("screen").width / 2,
                                  transform: [
                                    { translateX: this.progressAnim },
                                  ],
                                }}
                              />
                            </Layout>
                            {lBars}
                          </Layout>
                          <Layout
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: 10,
                              height: 50,
                              backgroundColor: "transparent",
                              elevation: 2,
                            }}>
                            <TouchableWithoutFeedback onPress={() => {}}>
                              <Layout
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "center",
                                  backgroundColor: "transparent",
                                  alignItems: "center",
                                }}>
                                <StoryView
                                  size={30}
                                  image={item.user.profile.image}
                                />
                                <Text
                                  category="h6"
                                  style={{ marginLeft: 10, color: "#fff" }}>
                                  {item.user.username}
                                </Text>
                              </Layout>
                            </TouchableWithoutFeedback>
                            <Layout
                              style={{
                                flexDirection: "row",
                                justifyContent: "center",
                                backgroundColor: "transparent",
                                alignItems: "center",
                              }}>
                              {this.state.loading && <Spinner />}
                            </Layout>
                          </Layout>
                        </Layout>

                        <Layout
                          style={{
                            backgroundColor: "transparent",
                            height:
                              Dimensions.get("screen").height -
                              StatusBar.currentHeight,
                            position: "absolute",
                            top: StatusBar.currentHeight,
                            left: 0,
                            right: 0,
                            bottom: 0,
                          }}>
                          {story[this.state.index]?.media?.mediaType?.includes(
                            "video"
                          ) ? (
                            <Video
                              ref={this.videoRef}
                              source={story[this.state.index]?.media}
                              style={{
                                width: Dimensions.get("screen").width,
                                height: Dimensions.get("screen").height - 60,
                              }}
                              shouldPlay
                              onLoad={(e) => {
                                this.setState({ loading: false });

                                this.startTimer(e.durationMillis / 1000);
                                fetch(
                                  Constants.API_URL +
                                    "/story/view/" +
                                    story[this.state.index]?.sid +
                                    "/",
                                  {
                                    method: "POST",
                                    headers: {
                                      Accept: "application/json",
                                      Authorization:
                                        "Token " + this.props.token,
                                      "Content-Type": "application/json",
                                    },
                                  }
                                );
                              }}
                              onLoadStart={() => {
                                this.setState({ loading: true });
                              }}
                              resizeMode="contain"
                            />
                          ) : (
                            <Image
                              onLoadStart={() => {
                                this.setState({ loading: true });
                              }}
                              onLoad={() => {
                                this.startTimer();
                                this.setState({ loading: false });
                                fetch(
                                  Constants.API_URL +
                                    "/story/view/" +
                                    story[this.state.index]?.sid +
                                    "/",
                                  {
                                    method: "POST",
                                    headers: {
                                      Accept: "application/json",
                                      Authorization:
                                        "Token " + this.props.token,
                                      "Content-Type": "application/json",
                                    },
                                  }
                                );
                              }}
                              source={story[this.state.index]?.media}
                              style={{
                                width: Dimensions.get("screen").width,
                                height: Dimensions.get("screen").height - 60,
                              }}
                              resizeMode="contain"
                            />
                          )}
                        </Layout>
                        <Animated.View
                          style={{
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            backgroundColor: "transparent",
                            flex: 1,
                            elevation: 1,
                            justifyContent: "flex-end",
                          }}>
                          {this.props.self ? (
                            <TouchableWithoutFeedback
                              onPress={() => this.viewModal.current.open()}
                              style={{
                                justifyContent: "center",
                                alignItems: "center",
                                backgroundColor: "transparent",
                                marginBottom: 20,
                              }}>
                              <Icon
                                style={{
                                  width: 25,
                                  height: 25,
                                  tintColor: "#fff",
                                }}
                                name="arrow-ios-upward-outline"
                              />
                              <Layout
                                style={{
                                  flexDirection: "row",
                                  backgroundColor: "transparent",
                                  alignItems: "center",
                                }}>
                                <Text
                                  style={{ color: "#fff", marginRight: 10 }}>
                                  {story[this.state.index]?.views}
                                </Text>
                                <Icon
                                  style={{
                                    width: 20,
                                    height: 20,
                                    tintColor: "#fff",
                                  }}
                                  name="eye-outline"
                                />
                              </Layout>
                            </TouchableWithoutFeedback>
                          ) : (
                            <ReplyInput
                              ref={this.InputRef}
                              onSubmitEditing={(v) => {
                                const message = v?.trim();
                                if (message) {
                                  ToastAndroid.show(
                                    "Message Sent",
                                    ToastAndroid.SHORT
                                  );
                                  fetch(
                                    Constants.API_URL + "/messenger/send/",
                                    {
                                      method: "PUT",
                                      headers: {
                                        Accept: "application/json",
                                        Authorization:
                                          "Token " + this.props.token,
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        receiver: this.props.item.user
                                          ?.username,
                                        message,
                                        storyReply: this.state.index,
                                      }),
                                    }
                                  );
                                }
                              }}
                            />
                          )}
                          <LinearGradient
                            colors={["transparent", "#111"]}
                            style={{
                              position: "absolute",
                              left: 0,
                              right: 0,
                              bottom: 0,
                              height: 50,
                              zIndex: -1,
                            }}
                          />
                        </Animated.View>
                      </Layout>
                    </SafeAreaView>
                  </Animated.View>
                )}
              </TapGestureHandler>
            </LongPressGestureHandler>
          </PanGestureHandler>
        </PanGestureHandler>
      </Layout>
    );
  }
}
class ReplyInput extends Component {
  InputRef = React.createRef();
  state = { value: "" };
  blur() {
    this.InputRef.current?.blur();
  }
  focus = () => {
    this.InputRef.current?.focus();
  };
  setValue(v) {
    this.setState({ value: v });
  }
  render() {
    return (
      <Input
        ref={this.InputRef}
        style={{
          borderRadius: 50,
          width: "100%",
          paddingHorizontal: 10,
          backgroundColor: "rgba(0,0,0,0.2)",
        }}
        textStyle={{ color: "#fff" }}
        onChangeText={(v) => this.setValue(v)}
        returnKeyType="send"
        placeholder="Send a Reply..."
        onSubmitEditing={() => {
          this.props.onSubmitEditing(this.state.value);
          this.setState({ value: "" });
          this.InputRef.current.clear();
        }}
      />
    );
  }
}

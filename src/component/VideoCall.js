import React, { Component } from "react";
import { connect } from "react-redux";
import { Icon, Layout, Spinner, Text } from "@ui-kitten/components";
import * as Constants from "./Constants";
import changeNavigationBarColor from "react-native-navigation-bar-color";
import MessengerTheme from "./messenger/Theme";
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  RTCIceCandidateType,
  RTCSessionDescriptionType,
} from "react-native-webrtc";
import notifee, {
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
  EventType,
} from "@notifee/react-native";
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  ToastAndroid,
  View,
} from "react-native";
import CallType from "./utils/CallType";
import { setCallStatus } from "../actions/CallActions";
import { LinearGradient } from "expo-linear-gradient";
import Ripple from "react-native-material-ripple";
class VideoCall extends Component {
  state = {
    loading: true,
    stream: null,
    remoteStream: null,
    status: null,
    cameraFront: true,
  };
  calleeLogo = new Animated.Value(0);
  calleeLogoScale = new Animated.Value(1.5);
  callerLogo = new Animated.Value(0);
  loader = new Animated.Value(0);
  STATUS = [
    "Please wait...",
    "Connecting...",
    "Incoming Call...",
    "Ringing...",
    "Connected",
  ];
  constructor(props) {
    super(props);
  }
  makingOffer = false;
  ignoreOffer = false;

  makeCall() {
    const username =
      typeof this.props?.route?.params?.user === "string"
        ? this.props?.route?.params?.user
        : this.props?.route?.params?.user.username;
    fetch(Constants.API_URL + "/messenger/call/" + username + "/", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.auth.token,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        this.props.setCallStatus({
          status: CallType.OUTGOING,
          user: {
            username: this.state?.user?.username,
            name:
              this.state?.user?.first_name + " " + this.state?.user?.last_name,
            image: this.state?.user?.profile?.image,
          },
        });
      })
      .catch((e) => {
        console.log(e);
        fetch(
          Constants.API_URL +
            "/messenger/call/" +
            this.props.callStatus.user?.username +
            "/",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: "Token " + this.props.auth.token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              response: "REJECT_CALL",
            }),
          }
        );
        this.props.setCallStatus({ status: CallType.IDLE, user: null });
        this.setState({ status: "Call Failed" });
        this.goBack();
      });
  }
  componentDidMount() {
    if (this.props.route.params.socket)
      this.props.route.params.socket.onmessage = async (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "ANSWER_CALL") {
          this.accepted();
          this.props.setCallStatus({
            status: CallType.ACCEPTED,
            user: {
              username: this.state.user.username,
              name:
                this.state.user.first_name + " " + this.state.user.last_name,
              image: this.state.user.profile.image,
            },
          });
        } else if (data.type === "REJECT_CALL") {
          this.props.setCallStatus({ status: CallType.IDLE, user: null });
          this.setState({ status: "Call Rejected" });
          this.goBack();
        } else if (data.type === "BUSY") {
          this.setState({ status: "Busy" });
          this.goBack();
          this.props.setCallStatus({ status: CallType.IDLE, user: null });
        } else if (data.type === "HANG_UP") {
          this.goBack();
          this.setState({ status: "Call Ended" });
          this.props.setCallStatus({ status: CallType.IDLE, user: null });
        } else if (
          data.type === "status" &&
          data.user === this.state.user?.username
        ) {
          this.props.setCallStatus({ status: CallType.IDLE, user: null });
          this.setState({ status: "Offline" });
          this.goBack();
        } else if (data.type === "ice_candidate") {
        } else if (data.type === "ice_description") {
        }
      };
    if (this.props?.route?.params?.user) {
      if (typeof this.props?.route?.params?.user === "string") {
        fetch(
          Constants.API_URL +
            "/accounts/profile/" +
            this.props?.route?.params?.user +
            "/",
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: "Token " + this.props.auth.token,
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
            this.setState({ user: data });
            this.props.setCallStatus({
              status: this.props.callStatus.status,
              user: {
                username: this.state?.user?.username,
                name:
                  this.state?.user?.first_name +
                  " " +
                  this.state?.user?.last_name,
                image: this.state?.user?.profile?.image,
              },
            });
            if (this.props?.route?.params?.type !== "MAKE_CALL") {
              if (!data?.profile?.activity_status) {
                this.props.setCallStatus({ status: CallType.IDLE, user: null });
                this.setState({ status: "Offline" });
                this.goBack();
              }
            }
          });
      } else {
        this.setState({ user: this.props?.route?.params?.user });
      }

      if (this.props?.route?.params?.type === "MAKE_CALL") {
        this.makeCall();
        this.backHandler = BackHandler.addEventListener(
          "hardwareBackPress",
          () => {
            ToastAndroid.show("Call in Connecting Mode!", ToastAndroid.SHORT);
            return true;
          }
        );
      }
    } else {
      this.props.navigation.goBack();
    }

    // this.getStream();
    this.props.navigation.addListener("focus", () => {
      activateKeepAwake();
    });
    this.props.navigation.addListener("blur", () => {
      this?.backHandler?.remove();
      deactivateKeepAwake();
      changeNavigationBarColor(
        this.props.HomeBasic.darkTheme ? "#000000" : "#ffffff",
        true
      );
    });
  }
  componentWillUnmount() {
    this?.backHandler?.remove();
  }
  goBack() {
    notifee.cancelNotification(this.state?.user?.username + "_call");
    setTimeout(() => {
      this.props.navigation.goBack();
    }, 1000);
  }
  getStream() {
    mediaDevices.enumerateDevices().then((sourceInfos) => {
      let videoSourceId;
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (
          sourceInfo.kind == "videoinput" &&
          sourceInfo.facing ==
            (this.state.cameraFront ? "front" : "environment")
        ) {
          videoSourceId = sourceInfo.deviceId;
        }
      }
      mediaDevices
        .getUserMedia({
          audio: true,
          video: {
            mandatory: {
              minWidth: Dimensions.get("screen").width, // Provide your own width, height and frame rate here
              minHeight: Dimensions.get("screen").height,
              minFrameRate: 60,
            },
            facingMode: this.state.cameraFront ? "user" : "environment",
            optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
          },
        })
        .then((stream) => {
          // this.pc.addStream(stream);
          this.setState({ stream });
        })
        .catch((error) => {
          this.props.setCallStatus({ status: CallType.IDLE, user: null });
          this.props.navigation.goBack();
        });
    });
  }
  componentDidUpdate() {
    if (this.props.callStatus.status === CallType.IDLE) {
      this.logoDeNormalise();
    }
    if (this.props.callStatus.user === undefined) {
      this.props.setCallStatus({
        status: CallType.IDLE,
        user: null,
      });
      this.goBack();
    }
  }
  accepted() {
    if (this.props.route.params.type === "MAKE_CALL") {
      notifee.displayNotification({
        id: this.props.callStatus.user?.username + "_call",
        title: "Video Call in progress",
        body: this.props.callStatus.user?.username,
        android: {
          channelId: "call",
          smallIcon: "ic_stat_name",
          color: "blue",
          importance: AndroidImportance.LOW,
          timestamp: Date.now(),
          showChronometer: true,
          colorized: true,
          pressAction: { id: "open_caller" },
          ongoing: true,
          actions: [
            {
              title: "Hang up",
              pressAction: {
                id: "hang_call",
              },
            },
          ],
        },
      });
    }
    this.logoNormalise();
    this.props.setCallStatus({
      status: CallType.CONNECTED,
      user: this.props.callStatus.user,
    });
  }
  logoNormalise() {
    Animated.spring(this.calleeLogo, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    Animated.spring(this.callerLogo, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }
  logoDeNormalise() {
    Animated.spring(this.calleeLogo, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    Animated.spring(this.callerLogo, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }
  render() {
    const ThemeMessenger = this.props?.theme?.[this.state?.user?.username]
      ? this.props?.theme[this.state?.user?.username].id === "default"
        ? this.props.HomeBasic?.darkTheme
          ? MessengerTheme.dark
          : MessengerTheme.light
        : this.props?.theme[this.state?.user?.username]
      : this.props.HomeBasic?.darkTheme
      ? MessengerTheme.dark
      : MessengerTheme.light;
    changeNavigationBarColor("transparent", true);
    return (
      <Layout style={{ backgroundColor: "#000", flex: 1 }}>
        <RTCView
          streamURL={this.state.remoteStream?.toURL()}
          mirror={this.state.cameraFront}
          style={{
            height: Dimensions.get("screen").height / 2,
            width: Dimensions.get("screen").width,
          }}
        />

        <Layout
          style={{
            backgroundColor: ThemeMessenger.bg.backgroundColor,
            height: 3,
            elevation: 1,
            zIndex: 100,
          }}
        />
        <Layout
          style={{
            zIndex: 101,
            width: Dimensions.get("screen").width,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "transparent",
            elevation: 1,
            flexDirection: "row",
          }}>
          <Animated.View
            style={{
              position: "absolute",
              zIndex: 1,
              transform: [
                {
                  translateX: this.calleeLogo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -22.5],
                  }),
                },
                {
                  translateY: this.calleeLogo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-Dimensions.get("screen").height / 4, 0],
                  }),
                },
                {
                  scale: this.calleeLogo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.5, 1],
                  }),
                },
              ],
            }}>
            <View>
              {this.props.callStatus.status !== CallType.IDLE && (
                <Animated.View
                  style={{
                    position: "absolute",
                    zIndex: 1,
                    opacity: this.calleeLogo.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                  }}>
                  <Image
                    source={require("../../assets/fadeAnim.gif")}
                    style={{
                      width: 150,
                      height: 150,
                      position: "absolute",
                      top: -45,
                      left: -45,
                    }}
                  />
                </Animated.View>
              )}
              <Image
                progressiveRenderingEnabled
                source={{ uri: this.state?.user?.profile?.image }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 50,
                  borderWidth: 2,
                  borderColor: ThemeMessenger.bg.backgroundColor,
                  elevation: 1,
                }}
              />
            </View>
          </Animated.View>
          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              zIndex: 1,
              transform: [
                {
                  translateX: this.calleeLogo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [Dimensions.get("screen").width / 2 - 50, 10],
                  }),
                },
                {
                  translateY: this.calleeLogo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      -Dimensions.get("screen").height / 4 + 90,
                      -20,
                    ],
                  }),
                },
              ],
            }}>
            <Text
              style={{ width: 100, textAlign: "center" }}
              appearance="hint"
              numberOfLines={1}
              category="h6">
              {this.state?.user?.username}
            </Text>
          </Animated.View>
          <Animated.View
            style={{
              position: "absolute",
              right: 0,
              zIndex: 1,
              transform: [
                {
                  translateX: this.calleeLogo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      -Dimensions.get("screen").width / 2 + 55,
                      -10,
                    ],
                  }),
                },
                {
                  translateY: this.calleeLogo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      -Dimensions.get("screen").height / 4 + 120,
                      10,
                    ],
                  }),
                },
              ],
            }}>
            <Text
              numberOfLines={1}
              style={{ color: "#fff", width: 110, textAlign: "center" }}>
              {this.props.callStatus.status === CallType.IDLE
                ? this.state.status
                : this.STATUS[this.props.callStatus.status]}
            </Text>
          </Animated.View>
          <Animated.View
            style={{
              position: "absolute",
              transform: [
                {
                  translateX: this.callerLogo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 22.5],
                  }),
                },
              ],
            }}>
            <Image
              source={{ uri: this.props.auth?.user?.profile?.image }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 50,
                borderWidth: 2,
                borderColor: ThemeMessenger.bg.backgroundColor,
              }}
            />
          </Animated.View>
        </Layout>
        <RTCView
          streamURL={this.state.stream?.toURL()}
          mirror={this.state.cameraFront}
          style={{
            height: Dimensions.get("screen").height / 2,
            width: Dimensions.get("screen").width,
          }}
        />

        <Layout
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            backgroundColor: "transparent",
            height: "100%",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingBottom: 50,
            width: "100%",
          }}>
          <Layout
            style={{
              flexDirection: "row",
              backgroundColor: "transparent",
              justifyContent: "space-around",
              alignItems: "center",
              width: "80%",
            }}>
            <Ripple
              onPress={() => {
                this.setState({ cameraFront: !this.state.cameraFront });
                this.getStream();
                // this.logoNormalise();
              }}
              style={{
                width: 50,
                height: 50,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 50,
                overflow: "hidden",
                elevation: 5,
                ...ThemeMessenger.bg,
              }}>
              <Icon
                name="flip-outline"
                style={{
                  width: 30,
                  height: 30,
                  tintColor: ThemeMessenger.color.color,
                  padding: 10,
                }}
              />
            </Ripple>
            {this.props.callStatus.status === CallType.INCOMING && (
              <Ripple
                onPress={() => {
                  if (
                    this.props.callStatus.status === CallType.IDLE ||
                    !this.props.callStatus.user?.username
                  ) {
                    notifee.cancelAllNotifications();
                    this.props.setCallStatus({
                      status: CallType.IDLE,
                      user: null,
                    });
                  } else {
                    fetch(
                      Constants.API_URL +
                        "/messenger/call/" +
                        this.props.callStatus.user?.username +
                        "/",
                      {
                        method: "POST",
                        headers: {
                          Accept: "application/json",
                          Authorization: "Token " + this.props.auth.token,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ response: "ANSWER_CALL" }),
                      }
                    )
                      .then((resp) => {
                        this.accepted();
                        notifee.displayNotification({
                          id: this.props.callStatus.user?.username + "_call",
                          title: "Video Call in progress",
                          body: this.props.callStatus.user?.username,
                          android: {
                            channelId: "call",
                            smallIcon: "ic_stat_name",
                            color: "blue",
                            sound: "default",
                            onlyAlertOnce: true,
                            timestamp: Date.now(),
                            showChronometer: true,
                            colorized: true,
                            pressAction: { id: "open_caller" },
                            ongoing: true,
                            actions: [
                              {
                                title: "Hang up",
                                pressAction: {
                                  id: "hang_call",
                                },
                              },
                            ],
                          },
                        });
                        this.props.setCallStatus({
                          status: CallType.ACCEPTED,
                          user: this.props.callStatus.user,
                        });
                      })
                      .catch(() => {
                        this.props.setCallStatus({
                          status: CallType.IDLE,
                          user: null,
                        });
                        notifee.cancelNotification(
                          this.props.callStatus.user?.username + "_call"
                        );
                      });
                  }
                }}
                style={{
                  width: 50,
                  height: 50,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 50,
                  overflow: "hidden",
                  elevation: 5,
                  backgroundColor: "green",
                }}>
                <Icon
                  name="phone-outline"
                  style={{
                    width: 30,
                    height: 30,
                    tintColor: "#fff",
                    padding: 10,
                  }}
                />
              </Ripple>
            )}
            {this.props.callStatus.status !== CallType.IDLE && (
              <Ripple
                onPress={() => {
                  fetch(
                    Constants.API_URL +
                      "/messenger/call/" +
                      this.props.callStatus.user?.username +
                      "/",
                    {
                      method: "POST",
                      headers: {
                        Accept: "application/json",
                        Authorization: "Token " + this.props.auth.token,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        response:
                          this.props.callStatus.status === CallType.INCOMING
                            ? "REJECT_CALL"
                            : "HANG_UP",
                      }),
                    }
                  );
                  this.setState({
                    status:
                      this.props.callStatus.status === CallType.INCOMING
                        ? "Call Rejected"
                        : "Call Ended",
                  });
                  this.goBack();

                  notifee.cancelNotification(
                    this.props.callStatus.user?.username + "_call"
                  );
                  this.props.setCallStatus({
                    status: CallType.IDLE,
                    user: null,
                  });
                }}
                style={{
                  width: 50,
                  height: 50,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 50,
                  overflow: "hidden",
                  elevation: 5,
                  backgroundColor: "red",
                }}>
                <Icon
                  name="phone-off-outline"
                  style={{
                    width: 30,
                    height: 30,
                    tintColor: "#fff",
                    padding: 10,
                  }}
                />
              </Ripple>
            )}
            <Ripple
              onPress={() => {}}
              style={{
                width: 50,
                height: 50,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 50,
                overflow: "hidden",
                elevation: 5,
                backgroundColor: ThemeMessenger.bg.backgroundColor,
              }}>
              <Icon
                name="mic-off-outline"
                style={{
                  width: 30,
                  height: 30,
                  tintColor: ThemeMessenger.color.color,

                  padding: 10,
                }}
              />
            </Ripple>
            <Ripple
              onPress={() => {}}
              style={{
                width: 50,
                height: 50,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 50,
                overflow: "hidden",
                elevation: 5,
                backgroundColor: ThemeMessenger.bg.backgroundColor,
              }}>
              <Icon
                name="video-off-outline"
                style={{
                  width: 30,
                  height: 30,
                  tintColor: ThemeMessenger.color.color,

                  padding: 10,
                }}
              />
            </Ripple>
          </Layout>
        </Layout>
      </Layout>
    );
  }
}
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
  HomeBasic: state.main.HomeReducer,
  theme: state.main.ChatReducer.theme,
  callStatus: state.main.CallReducer,
});
export default connect(mapStateToProps, { setCallStatus })(VideoCall);

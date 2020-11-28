import React, { Component, createRef, PureComponent } from "react";
import { connect } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { setShortModal, setShortModalProps } from "../actions/ShortModal";
import {
  Text,
  Icon,
  Layout,
  Spinner,
  RadioGroup,
  Radio,
  Input,
} from "@ui-kitten/components";
import Ripple from "react-native-material-ripple";
import * as Contacts from "expo-contacts";
import * as Constants from "./Constants";
import { v4 as uuidv4 } from "uuid";
import InvertibleScrollView from "react-native-invertible-scroll-view";
import {
  Dimensions,
  TextInput,
  Keyboard,
  StatusBar,
  Animated,
  Image,
  PanResponder,
  BackHandler,
  KeyboardAvoidingView,
  Vibration,
  Alert,
  View,
} from "react-native";
import timeSince from "./utils/TimeSince";
import * as MediaLibrary from "expo-media-library";
import * as Permissions from "expo-permissions";
import {
  ScrollView,
  FlatList,
  TouchableWithoutFeedback,
  PanGestureHandler,
  TapGestureHandler,
  State,
} from "react-native-gesture-handler";
import { Divider } from "react-native-paper";
import MessageItem from "./messenger/MessageItem";
import ReconnectingWebSocket from "reconnecting-websocket";
import LastActiveTimer from "./messenger/LastActiveTimer";
import { Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import messaging from "@react-native-firebase/messaging";
import { Modalize } from "react-native-modalize";
import Giphy from "./messenger/Giphy";
import { Camera } from "expo-camera";
import { Audio } from "expo-av";
import notifee, {
  AndroidBadgeIconType,
  AndroidStyle,
} from "@notifee/react-native";
import PushNotification from "react-native-push-notification";
import { setActiveChat, setChatTheme } from "../actions/ChatActions";
import styled from "styled-components";
import changeNavigationBarColor from "react-native-navigation-bar-color";
import MessengerTheme from "./messenger/Theme";

class MessageScreen extends Component {
  state = {
    keyboardOffset: new Animated.Value(0),
    mobileNumbers: [],
    loading: true,
    gallery: false,
    reply: null,
    messages: [],
    user: null,
    prevLoad: true,
    previous: true,
    scrollY: new Animated.Value(0),
    themes: { themes: [], trends: [] },
    themeLoad: false,
    themeSearch: [],
  };
  sendbtAnim = new Animated.Value(0);
  inputbtAnim = new Animated.Value(0);
  constructor(props) {
    super(props);
  }
  mobiles = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync();
      return data;
    }
  };
  componentDidUpdate() {
    if (this.state.reply) {
      this.messageInput.focus();
    }
  }

  fetchHistory(dt_lt) {
    var body = dt_lt
      ? JSON.stringify({
          previous: this.state.messages[0].datetime,
        })
      : JSON.stringify({ latest: true });
    if (dt_lt) {
      this.setState({ prevLoad: true });
    }
    const uri =
      typeof this.props?.route?.params?.user === "string"
        ? Constants.API_URL +
          "/messenger/messages/" +
          this.props?.route?.params?.user +
          "/"
        : Constants.API_URL +
          "/messenger/messages/" +
          this.props?.route?.params?.user?.username +
          "/";
    fetch(uri, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.auth.token,
        "Content-Type": "application/json",
      },
      body: body,
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        var messages = [];

        data?.history?.map((item, index) => {
          messages.push({
            ...item,
            new_message:
              index === 0
                ? false
                : data.history[index - 1].seen &&
                  !data.history[index - 1].me &&
                  !item.seen &&
                  item.sender !== this.props.auth.user.username,
            me: item.sender === this.props.auth.user.username,
            next:
              index === data.history.length - 1
                ? false
                : item.sender === data.history[index + 1].sender,
            prev:
              index === 0
                ? false
                : item.sender === data.history[index - 1].sender,
          });
        });

        messages.reverse();
        if (
          !messages[messages.length - 1].seen &&
          !messages[messages.length - 1].me
        )
          fetch(Constants.API_URL + "/messenger/send/", {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: "Token " + this.props.auth.token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sender: this.state.user?.username }),
          });
        this.setState({
          messages: dt_lt ? [...messages, ...this.state.messages] : messages,
          loading: false,
          prevLoad: false,
          previous: messages.length > 0,
        });
        this.props.route.params.socket.send(
          JSON.stringify({
            type: "viewer_request",
            user: this.state.user?.username,
          })
        );
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }
  componentDidMount() {
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
          });
      } else {
        this.setState({ user: this.props?.route?.params?.user });
      }
    } else {
      this.props.navigation.goBack();
    }
    Animated.spring(this.inputbtAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    this.fetchHistory(false);
    this.messaging = () => {};

    this.props.navigation.addListener("focus", () => {
      this.props.setActiveChat(
        typeof this.props?.route?.params?.user === "string"
          ? this.props?.route?.params?.user
          : this.props?.route?.params?.user?.username
      );
      this.props.route.params.socket.send(
        JSON.stringify({
          type: "viewer_request",
          value: false,
          user: this.state.user?.username,
        })
      );
      this.props.route.params.socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "viewer") {
          this.setState({
            viewer: data.value,
          });
        } else if (data.type === "viewer_request") {
          this.props.route.params.socket.send(
            JSON.stringify({
              type: "viewer",
              value: true,
              user: this.state.user?.username,
            })
          );
        } else if (
          data.type === "seen_message" &&
          data.message.receiver === this.props.auth.user.username
        ) {
          console.log(
            this.state.user.username,
            data.message.receiver,
            this.props.auth.user.username
          );
          this.setState({
            seen: true,
          });
        } else if (
          data.type === "sent_message" &&
          data.message.receiver === this.props.auth.user.username
        ) {
          this.setState({
            sent: true,
          });
        } else if (data.type === "typing") {
          this.setState({
            typing: data.value,
          });
        } else if (
          data.type === "status" &&
          data.user === this.state.user?.username
        ) {
          this.setState({
            online: data.value,
            lastActive: new Date(),
          });
        } else if (
          data.type === "new_message" &&
          data.message.receiver === this.props.auth.user.username
        ) {
          fetch(Constants.API_URL + "/messenger/send/", {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: "Token " + this.props.auth.token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sender: this.state.user?.username }),
          });
          if (this.props.auth.user.username !== this.state?.user?.username)
            this.state.messages.length > 0
              ? this.setState({
                  messages: [
                    ...this.state.messages.slice(
                      0,
                      this.state.messages.length - 1
                    ),

                    {
                      ...this.state.messages[this.state.messages.length - 1],
                      prev: !this.state.messages[this.state.messages.length - 1]
                        .me,
                    },
                    {
                      ...data.message,
                      me: false,
                      prev: false,
                      next: !this.state.messages[this.state.messages.length - 1]
                        .me,
                    },
                  ],
                })
              : this.setState({
                  messages: [
                    {
                      id: data.message.id,
                      message: data.message.message,
                      media: data.message.media,
                      me: false,
                      next: false,
                      datetime: new Date(data.message.datetime),
                      next: false,
                      prev: false,
                    },
                  ],
                });
        }
      };
      if (this.props?.route?.params?.user) {
        this.props.route.params?.socket.send(
          JSON.stringify({
            user:
              typeof this.props?.route?.params?.user === "string"
                ? this.props?.route?.params?.user
                : this.props?.route?.params?.user?.username,
            value: true,
            type: "viewer",
          })
        );
      }
    });
    this.props.navigation.addListener("blur", () => {
      changeNavigationBarColor(
        this.props.HomeBasic.darkTheme ? "#000000" : "#ffffff",
        true
      );
      this.messaging();
      this.props.setActiveChat(null);
      if (this.state?.user) {
        this.props.route.params?.socket.send(
          JSON.stringify({
            user: this.state.user?.username,
            value: false,
            type: "viewer",
          })
        );
      }
    });

    this.messageInput = createRef();

    this.backhandler = BackHandler.addEventListener(
      "hardwareBackPress",
      this._backPress.bind(this)
    );

    this.mobiles().then((numbers) => {
      this.setState({ mobileNumbers: numbers, loading: false });
    });
  }
  componentWillUnmount() {
    this.backhandler.remove();
  }

  _backPress() {
    if (this.state.reply) {
      this.setState({ reply: null });
      return true;
    }
    return false;
  }
  typingTimer = null;
  giphyModal = React.createRef();
  cameraModal = React.createRef();
  themeModal = React.createRef();
  pan = new Animated.Value(0);
  sendMedia(item) {
    const xhr = new XMLHttpRequest();
    const reply = this.state.reply
      ? { ...this.state.reply, reply: null }
      : null;
    const mid = uuidv4();
    this.state.messages.length > 0
      ? this.setState({
          seen: false,
          sent: false,
          messages: [
            ...this.state.messages.slice(0, this.state.messages.length - 1),

            {
              ...this.state.messages[this.state.messages.length - 1],
              prev: this.state.messages[this.state.messages.length - 1].me,
            },
            {
              id: mid,
              me: true,
              prev: false,
              datetime: new Date(),
              reply,
              next: this.state.messages[this.state.messages.length - 1].me,
              sending: true,
              media: item,
              xhr,
            },
          ],
        })
      : this.setState({
          seen: false,
          sent: false,
          messages: [
            {
              id: mid,
              me: true,
              datetime: new Date(),
              reply,
              next: false,
              prev: false,
              sending: true,
              media: item,
              xhr,
            },
          ],
        });

    let formData = new FormData();
    let uriParts = item.uri.split(".");
    let fileType = uriParts[uriParts.length - 1];
    formData.append("media", {
      uri: item.uri,
      name: `photo.${fileType}`,
      type: `${item.mediaType}/${fileType}`,
    });
    formData.append("receiver", this.state.user?.username);
    const self = this;
    if (this.state.reply) {
      formData.append("reply_mid", self.state.reply.id);
      self.setState({ reply: null });
    }
    xhr.open("PUT", Constants.API_URL + "/messenger/send/");

    xhr.onload = function () {
      var msgs = [];
      self.state.messages.forEach((item) => {
        if (item.id === mid) {
          msgs.push({
            ...item,
            sending: false,
            id: JSON.parse(xhr.response).id,
            xhr: null,
          });
        } else {
          msgs.push(item);
        }
      });
      self.setState({
        messages: msgs,
      });
    };
    xhr.onerror = function () {
      var msgs = [];
      self.state.messages.forEach((item) => {
        if (item.id === mid) {
          msgs.push({ ...item, sending: false, failed: true, xhr: null });
        } else {
          msgs.push(item);
        }
      });
      self.setState({
        messages: msgs,
      });
    };
    xhr.setRequestHeader("Authorization", "Token " + this.props.auth.token);
    xhr.send(formData);
  }
  sendMessage = (value = "", sticker = null, gif = null) => {
    const message = value?.trim();
    if (message || sticker || gif) {
      this.messageInput.clear();
      Animated.spring(this.sendbtAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      Animated.spring(this.inputbtAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      const reply = this.state.reply
        ? { ...this.state.reply, reply: null }
        : null;
      const mid = uuidv4();
      console.log(
        "next",
        this.state.messages[this.state.messages.length - 1].message
      );
      this.state.messages.length > 0
        ? this.setState({
            seen: false,
            sent: false,
            messages: [
              ...this.state.messages.slice(0, this.state.messages.length - 1),

              {
                ...this.state.messages[this.state.messages.length - 1],
                prev: this.state.messages[this.state.messages.length - 1].me,
              },
              {
                id: mid,
                message,
                me: true,
                prev: false,
                datetime: new Date(),
                reply,
                next: this.state.messages[this.state.messages.length - 1].me,
                sending: true,
                sticker,
                gif,
              },
            ],
            reply: null,
          })
        : this.setState({
            seen: false,
            sent: false,
            messages: [
              {
                id: mid,
                message,
                me: true,
                datetime: new Date(),
                reply,
                next: false,
                prev: false,
                sending: true,
                sticker,
                gif,
              },
            ],
            reply: null,
          });
      fetch(Constants.API_URL + "/messenger/send/", {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: "Token " + this.props.auth.token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          reply
            ? {
                receiver: this.state.user?.username,
                message,
                reply_mid: reply.id,
                sticker,
                gif,
              }
            : {
                receiver: this.state.user?.username,
                message,
                sticker,
                gif,
              }
        ),
      })
        .then((response) => {
          const statusCode = response.status;
          const data = response.json();
          return Promise.all([statusCode, data]);
        })
        .then(([statusCode, data]) => {
          var msgs = [];
          this.state.messages.forEach((item) => {
            if (item.id === mid) {
              msgs.push({ ...item, sending: false, id: data.id });
            } else {
              msgs.push(item);
            }
          });
          this.setState({
            messages: msgs,
          });
        })
        .catch(() => {
          var msgs = [];
          this.state.messages.forEach((item) => {
            if (item.id === mid) {
              msgs.push({ ...item, sending: false, failed: true });
            } else {
              msgs.push(item);
            }
          });
          this.setState({
            messages: msgs,
          });
        });
    }
  };
  setReply(item) {
    this.setState({ reply: item });
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
    const Themes =
      this.state.themeSearch.length > 0
        ? [...this.state.themeSearch]
        : [
            this.props.HomeBasic?.darkTheme
              ? MessengerTheme.dark
              : MessengerTheme.light,
            ThemeMessenger,
            ...this.state.themes.themes,
          ];
    changeNavigationBarColor(ThemeMessenger.bg.backgroundColor, true);
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS == "ios" ? "padding" : "height"}
        style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <LinearGradient
            colors={ThemeMessenger.gradient}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: Dimensions.get("screen").height,
            }}
          />
          {ThemeMessenger.image !== null && (
            <Image
              source={{ uri: ThemeMessenger.image }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: Dimensions.get("screen").height,
                opacity: 0.5,
              }}
              resizeMode="contain"
            />
          )}

          <Layout
            style={{
              width: "100%",
              height: 50 + StatusBar.currentHeight,
              justifyContent: "space-between",
              alignItems: "center",
              flexDirection: "row",
              paddingRight: 10,
              paddingLeft: 10,
              elevation: 5,
              position: "absolute",
              paddingTop: StatusBar.currentHeight,
              zIndex: 500,
              ...ThemeMessenger.bg,
            }}>
            {ThemeMessenger.headerImage !== null && (
              <Image
                source={{ uri: ThemeMessenger.headerImage }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  width: Dimensions.get("screen").width,
                  height: 50 + StatusBar.currentHeight,
                }}
                resizeMode="cover"
              />
            )}
            <Layout
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "transparent",
              }}>
              <Ripple
                style={{ padding: 10 }}
                onPress={() => this.props.navigation.goBack()}>
                <Icon
                  name="arrow-back-outline"
                  style={{
                    width: 27,
                    height: 27,
                    ...ThemeMessenger.color,
                  }}
                />
              </Ripple>
              <Ripple
                onPress={() =>
                  // this.props.setShortModal(true, "Profile", this.state.user)
                  this.props.navigation.navigate("ProfileScreen", {
                    username: this.state.user.username,
                  })
                }
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Image
                  style={{ width: 35, height: 35, borderRadius: 13 }}
                  source={{ uri: this.state?.user?.profile?.image }}
                  resizeMode="cover"
                />
                <Animated.View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 15,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingVertical: 1.5,
                    marginLeft: -15,
                    elevation: 2,
                    padding: 2.5,
                    top: 14,
                    opacity: this.state.viewer ? 1 : 0,
                    ...ThemeMessenger.bgLight,
                  }}>
                  <Icon
                    style={{
                      ...ThemeMessenger.color,
                      width: 15,
                      height: 15,
                    }}
                    name="eye-outline"
                  />
                </Animated.View>
                <Layout style={{ backgroundColor: "transparent" }}>
                  <Text
                    style={{ marginLeft: 10, ...ThemeMessenger.color }}
                    category="h6">
                    {this.state?.user?.username}
                  </Text>

                  {this.state.typing ? (
                    <Text
                      style={{
                        marginLeft: 10,
                        marginTop: 0,
                        fontSize: 12,
                        ...ThemeMessenger.hint,
                      }}
                      appearance="hint">
                      Typing...
                    </Text>
                  ) : this.state.online ||
                    this.state.user?.profile?.activity_status ? (
                    <Text
                      style={{
                        marginLeft: 10,
                        marginTop: 0,
                        fontSize: 12,
                        ...ThemeMessenger.hint,
                      }}
                      appearance="hint">
                      Online
                    </Text>
                  ) : this.state.lastActive ? (
                    <LastActiveTimer time={this.state.lastActive} />
                  ) : this.state.user?.profile?.last_active ? (
                    <LastActiveTimer
                      time={new Date(this.state.user?.profile?.last_active)}
                    />
                  ) : null}
                </Layout>
              </Ripple>
            </Layout>
            <Layout
              style={{
                backgroundColor: "transparent",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Ripple
                onPress={() => {
                  this.props.navigation.navigate("VideoCall", {
                    user: this.state.user.username,
                    type: "MAKE_CALL",
                  });
                }}>
                <Icon
                  style={{
                    ...ThemeMessenger.color,
                    width: 25,
                    height: 25,
                  }}
                  name="video-outline"
                />
              </Ripple>
              <Ripple
                style={{ padding: 5, paddingLeft: 15 }}
                onPress={() => {
                  this.themeModal.current?.open();
                  this.setState({ themeLoad: true });
                  fetch(Constants.API_URL + "/messenger/theme/", {
                    method: "GET",
                    headers: {
                      Accept: "application/json",
                      Authorization: "Token " + this.props.auth.token,
                      "Content-Type": "application/json",
                    },
                  })
                    .then((response) => {
                      const statusCode = response.status;
                      const data = response.json();
                      return Promise.all([statusCode, data]);
                    })
                    .then(([statusCode, data]) => {
                      data.themes?.forEach((value, index) => {
                        if (value.id === ThemeMessenger.id) {
                          this.props.setChatTheme(
                            this.state.user?.username,
                            value
                          );
                        }
                      });
                      this.setState({ themes: data, themeLoad: false });
                    })
                    .catch((e) => {
                      console.log(e);
                    });
                }}>
                <Icon
                  style={{
                    ...ThemeMessenger.color,
                    width: 25,
                    height: 25,
                  }}
                  name="eye-outline"
                />
              </Ripple>
            </Layout>
          </Layout>
          <Animated.View style={{ flex: 1 }}>
            <ScrollView
              ref={(ref) => {
                this.mainScroll = ref;
                ref?.scrollToEnd();
              }}
              showsVerticalScrollIndicator={false}
              onScroll={(e) => {
                Animated.event(
                  [
                    {
                      nativeEvent: {
                        contentOffset: { y: this.state.scrollY },
                      },
                    },
                  ],
                  { useNativeDriver: false }
                )(e);
              }}
              onScrollEndDrag={(e) => {
                if (
                  e.nativeEvent.layoutMeasurement.height +
                    e.nativeEvent.contentOffset.y >=
                    e.nativeEvent.contentSize.height - 100 &&
                  !this.state.prevLoad &&
                  this.state.previous
                ) {
                  this.fetchHistory(true);
                  // this.scrollPos = e.nativeEvent.contentSize.height;
                }
              }}
              style={{
                marginTop: 50,
                backgroundColor: "transparent",
                flex: 1,
                flexGrow: 1,
                paddingBottom: 60,
                transform: [{ rotateZ: "180deg" }],
              }}>
              {this.state.reply && (
                <Layout
                  style={{ height: 80, backgroundColor: "transparent" }}
                />
              )}
              <Layout style={{ height: 10, backgroundColor: "transparent" }} />

              <InvertibleScrollView inverted>
                {this.state.loading ? (
                  <Layout
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      height: 100,
                      backgroundColor: "transparent",
                    }}>
                    <Spinner size="large" />
                  </Layout>
                ) : (
                  this.state.messages?.map((message, index) => {
                    if (message?.last) return null;
                    return (
                      <MessageItem
                        key={index}
                        item={message}
                        theme={ThemeMessenger}
                        // scrollY={this.state.scrollY}
                        new={
                          !message?.seen && this.state.messages[index - 1]?.seen
                        }
                        navigation={this.props.navigation}
                        token={this.props.auth.token}
                        selfUsername={this.props.auth?.user?.username}
                        isLast={index === this.state.messages.length - 1}
                        seen={
                          (this.state.seen ||
                            this.state.messages[this.state.messages.length - 1]
                              .seen) &&
                          this.state.messages[this.state.messages.length - 1].me
                        }
                        sent={
                          (this.state.sent ||
                            this.state.messages[this.state.messages.length - 1]
                              .sent) &&
                          this.state.messages[this.state.messages.length - 1].me
                        }
                        primg={this.state.user?.profile?.image}
                        date={
                          index === 0
                            ? new Date(message.datetime)
                            : new Date(
                                this.state.messages[index - 1].datetime
                              ).getDate() ===
                                new Date(message.datetime).getDate() &&
                              new Date(
                                this.state.messages[index - 1].datetime
                              ).getMonth() ===
                                new Date(message.datetime).getMonth() &&
                              new Date(
                                this.state.messages[index - 1].datetime
                              ).getFullYear() ===
                                new Date(message.datetime).getFullYear()
                            ? null
                            : new Date(message.datetime)
                        }
                        setReply={this.setReply.bind(this)}
                        numbers={this.state.mobileNumbers}
                      />
                    );
                  })
                )}
              </InvertibleScrollView>
              <Layout
                style={{
                  backgroundColor: "transparent",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                {this.state.prevLoad && <Spinner />}
              </Layout>
            </ScrollView>

            <Layout
              style={{
                padding: 5,
                elevation: 3,
                width: "100%",
                marginTop: this.state.reply ? -70 : 0,
                ...ThemeMessenger.bg,
              }}>
              {ThemeMessenger.footerImage !== null && (
                <Image
                  source={{ uri: ThemeMessenger.footerImage }}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    width: Dimensions.get("screen").width,
                    height: this.state.reply ? 70 + 70 : 70,
                  }}
                  resizeMode="cover"
                />
              )}
              {this.state.reply && (
                <Layout
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    width: Dimensions.get("screen").width,

                    zIndex: 1000,
                    height: 70,
                    backgroundColor: "transparent",
                  }}>
                  <Layout style={{ backgroundColor: "transparent" }}>
                    <Text style={{ fontSize: 12, fontWeight: "bold" }}>
                      {this.state.reply.me
                        ? "Replying to Yourself"
                        : "Replying to " + this.state.user?.username}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 14,
                        marginLeft: 5,
                        ...ThemeMessenger.hint,
                      }}
                      appearance="hint">
                      {this.state.reply.message
                        ? this.state.reply.message
                        : this.state.reply?.media?.mediaType?.includes("video")
                        ? "Video"
                        : this.state.reply?.media?.mediaType?.includes(
                            "image"
                          ) ||
                          this.state.reply?.media?.mediaType?.includes("photo")
                        ? "Photo"
                        : this.state.reply.sticker
                        ? "Sticker"
                        : this.state.reply.gif
                        ? "GIF"
                        : this.state.reply.mopic
                        ? "Mopic"
                        : "Attachment: " + this.state.reply?.media?.mediaType}
                    </Text>
                  </Layout>
                  <Layout
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-around",
                      alignItems: "center",
                      backgroundColor: "transparent",
                    }}>
                    {this.state.reply?.media?.mediaType?.includes("video") ? (
                      <Video
                        source={{ uri: this.state.reply?.media.uri }}
                        style={{ width: 40, height: 50 }}
                        resizeMode="cover"
                        shouldPlay
                        isMuted
                        isLooping
                      />
                    ) : this.state.reply?.media?.mediaType?.includes(
                        "image"
                      ) ? (
                      <Image
                        source={{ uri: this.state.reply?.media.uri }}
                        style={{ width: 40, height: 50 }}
                        resizeMode="cover"
                      />
                    ) : this.state.reply.sticker ? (
                      <Image
                        source={{ uri: this.state.reply?.sticker }}
                        style={{ width: 40, height: 50 }}
                        resizeMode="contain"
                      />
                    ) : this.state.reply.gif ? (
                      <Image
                        source={{ uri: this.state.reply?.gif }}
                        style={{ width: 40, height: 50 }}
                        resizeMode="contain"
                      />
                    ) : null}
                    <Ripple
                      onPress={() => {
                        this.setState({ reply: null });
                      }}>
                      <Icon
                        name="close-outline"
                        style={{ width: 35, height: 35 }}
                        fill="#000"
                      />
                    </Ripple>
                  </Layout>
                </Layout>
              )}
              <MessageInput
                theme={ThemeMessenger}
                ref={(ref) => (this.messageInput = ref)}
                onChangeText={(value) => {
                  if (value.trim()) {
                    Animated.spring(this.sendbtAnim, {
                      toValue: 1,
                      useNativeDriver: true,
                    }).start();
                    Animated.spring(this.inputbtAnim, {
                      toValue: 0,
                      useNativeDriver: true,
                    }).start();
                  } else {
                    Animated.spring(this.sendbtAnim, {
                      toValue: 0,
                      useNativeDriver: true,
                    }).start();
                    Animated.spring(this.inputbtAnim, {
                      toValue: 1,
                      useNativeDriver: true,
                    }).start();
                  }
                  clearTimeout(this.typingTimer);
                  this.props.route.params.socket.send(
                    JSON.stringify({
                      type: "typing",
                      value: true,
                      receiver: this.state.user?.username,
                    })
                  );
                  this.typingTimer = setTimeout(() => {
                    this.props.route.params.socket.send(
                      JSON.stringify({
                        type: "typing",
                        value: false,
                        receiver: this.state.user?.username,
                      })
                    );
                  }, 1000);
                }}
                onSubmitEditing={this.sendMessage}
              />
              <Animated.View
                style={{
                  opacity: this.inputbtAnim,

                  transform: [
                    {
                      translateX: this.inputbtAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-200, 5],
                      }),
                    },
                  ],
                  position: "absolute",
                  left: 10,
                  top: this.state.reply ? 80 : 10,
                }}>
                <Ripple
                  onPress={() => {
                    Keyboard.dismiss();
                    this.cameraModal.current.open();
                    setTimeout(() => {
                      Animated.spring(this.state.keyboardOffset, {
                        toValue: -100,
                        useNativeDriver: true,
                        bounciness: 0.5,
                      }).start();
                    }, 100);
                  }}>
                  <Icon
                    name="camera-outline"
                    style={{ width: 35, height: 35 }}
                    fill={ThemeMessenger.color.color}
                  />
                </Ripple>
              </Animated.View>
              <Layout
                style={{
                  position: "absolute",
                  backgroundColor: "transparent",
                  right: 10,
                  height: 45,
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "row",
                  top: 5,
                  overflow: "hidden",
                  marginTop: this.state.reply ? 70 : 0,
                }}>
                <Animated.View
                  style={{
                    opacity: this.inputbtAnim,
                    marginRight: 10,
                    transform: [
                      {
                        translateX: this.inputbtAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [200, 0],
                        }),
                      },
                    ],
                    flexDirection: "row",
                    alignItems: "center",
                  }}>
                  <Ripple
                    style={{ marginLeft: 5 }}
                    onPress={() => {
                      Keyboard.dismiss();
                      this.giphyModal.current.modal.current.open();
                      setTimeout(() => {
                        Animated.spring(this.state.keyboardOffset, {
                          toValue: -100,
                          useNativeDriver: true,
                          bounciness: 0.5,
                        }).start();
                      }, 100);
                    }}>
                    <Icon
                      name="image-outline"
                      style={{ width: 35, height: 35 }}
                      fill={ThemeMessenger.color.color}
                    />
                  </Ripple>
                </Animated.View>
                <Animated.View
                  style={{
                    opacity: this.sendbtAnim,
                    transform: [{ scale: this.sendbtAnim }],
                  }}>
                  <Ripple
                    onPress={() => {
                      // console.log(this.messageInput);
                      this.sendMessage(this.messageInput?.state?.value);
                    }}>
                    <Icon
                      name="paper-plane-outline"
                      style={{
                        width: 35,
                        height: 35,
                        transform: [{ rotate: "45deg" }],
                        marginHorizontal: 5,
                      }}
                      fill={ThemeMessenger.bgDark.backgroundColor}
                    />
                  </Ripple>
                </Animated.View>
              </Layout>
              <Animated.View
                style={{
                  opacity: this.inputbtAnim,
                  marginRight: 10,
                  transform: [
                    {
                      translateX: this.inputbtAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [200, 0],
                      }),
                    },
                  ],
                  position: "absolute",
                  top: this.state.reply ? 80 : 10,
                  right: 10,
                }}>
                <Mic send={this.sendMedia.bind(this)} theme={ThemeMessenger} />
              </Animated.View>
            </Layout>
          </Animated.View>
          <Giphy
            ref={this.giphyModal}
            uid={this.props.auth.user.profile?.giphy}
            theme={ThemeMessenger}
            send={(media) => {
              this.giphyModal.current?.modal.current?.close();
              if (media.type === "stickers") {
                this.sendMessage("", media.url);
              } else if (media.type === "gifs") {
                this.sendMessage("", "", media.url);
              } else if (media.type === "gallery") this.sendMedia(media.url);
            }}
          />
          <Modalize
            rootStyle={{ zIndex: 1000, elevation: 10, flex: 1 }}
            scrollViewProps={{ style: { flexGrow: 1, flex: 1 } }}
            ref={this.cameraModal}>
            <Camera style={{ flex: 1, aspectRatio: 9 / 16 }}></Camera>
          </Modalize>
          <Modalize
            HeaderComponent={
              <Layout
                style={{
                  ...ThemeMessenger.bgLight,
                }}>
                <Input
                  ref="themeSearch"
                  textStyle={{ ...ThemeMessenger.color }}
                  style={{
                    margin: 5,
                    borderRadius: 20,
                    marginTop: 10,
                    borderColor: ThemeMessenger.bgDark.backgroundColor,
                    ...ThemeMessenger.bgLight,
                    ...ThemeMessenger.color,
                  }}
                  placeholderTextColor={ThemeMessenger.bgDark.backgroundColor}
                  placeholder="Search Themes"
                  onChangeText={(value) => {
                    this.setState({ themeLoad: true });
                    fetch(Constants.API_URL + "/messenger/theme/?q=" + value, {
                      method: "GET",
                      headers: {
                        Accept: "application/json",
                        Authorization: "Token " + this.props.auth.token,
                        "Content-Type": "application/json",
                      },
                    })
                      .then((response) => {
                        const statusCode = response.status;
                        const data = response.json();
                        return Promise.all([statusCode, data]);
                      })
                      .then(([statusCode, data]) => {
                        this.setState({
                          themeSearch: data.themes,
                          themeLoad: false,
                        });
                      })
                      .catch((e) => {
                        // console.log(e);
                      });
                  }}
                />
                {this.state.themeLoad ? (
                  <View
                    style={{
                      position: "absolute",
                      right: 15,
                      top: 17,
                    }}>
                    <Spinner />
                  </View>
                ) : (
                  this.state.themeSearch.length > 0 && (
                    <Ripple
                      onPress={() => {
                        this.refs.themeSearch.clear();
                        this.setState({ themeSearch: [] });
                      }}
                      style={{
                        position: "absolute",
                        right: 15,
                        top: 17,
                      }}>
                      <Icon
                        name="close-outline"
                        style={{ width: 30, height: 30 }}
                        fill={ThemeMessenger.bgDark.backgroundColor}
                      />
                    </Ripple>
                  )
                )}
              </Layout>
            }
            snapPoint={Dimensions.get("screen").height / 2 + 50}
            modalStyle={{
              overflow: "hidden",
            }}
            closeSnapPointStraightEnabled={false}
            rootStyle={{ elevation: 5, zIndex: 100000, flex: 1 }}
            scrollViewProps={{
              style: { flexGrow: 1, flex: 1, ...ThemeMessenger.bgLight },
            }}
            ref={this.themeModal}>
            <View
              style={{
                padding: 20,
              }}>
              {Themes.map((theme, index) => {
                if (
                  (theme.id === "default" && index === 1) ||
                  !theme ||
                  !theme?.id ||
                  (index > 1 &&
                    (theme.id === ThemeMessenger.id || theme.id === "default"))
                ) {
                  return null;
                }
                return (
                  <Radio
                    style={{ marginBottom: 15 }}
                    onChange={() => {
                      this.props.setChatTheme(
                        this.state?.user?.username,
                        theme
                      );
                      fetch(Constants.API_URL + "/messenger/theme/", {
                        method: "POST",
                        headers: {
                          Accept: "application/json",
                          Authorization: "Token " + this.props.auth.token,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          user: this.state.user?.username,
                          id: theme.id,
                        }),
                      });
                    }}
                    checked={
                      this.props?.theme?.[this.state?.user?.username]?.id ===
                      theme?.id
                    }>
                    <ThemeLayout
                      trending={
                        this.state.themes.trends.length > 0 &&
                        theme.id === this.state.themes.trends[0][0]
                      }
                      views={theme?.views}
                      theme={ThemeMessenger}
                      name={theme.name}
                      uri={theme?.preview}
                    />
                  </Radio>
                );
              })}
              {this.state.themeLoad && (
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: 50,
                  }}>
                  <Spinner />
                </View>
              )}
            </View>
          </Modalize>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }
}
const ThemeLayout = (props) => {
  return (
    <Layout
      style={{
        borderRadius: 10,
        elevation: 3,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        ...props.theme.bg,
      }}>
      {props.uri ? (
        <Image
          source={{
            uri: props.uri,
          }}
          style={{
            height: 100,
            width: Dimensions.get("window").width - 100,
          }}
        />
      ) : (
        <View style={{ width: Dimensions.get("window").width - 100 }} />
      )}
      <Layout
        style={{
          backgroundColor: "transparent",
          flexDirection: "row",
          justifyContent: "space-between",
          width: Dimensions.get("window").width - 100,
          alignItems: "center",
          paddingHorizontal: 15,
        }}>
        {props.trending ? (
          <Icon
            name="star-outline"
            style={{ width: 20, height: 20 }}
            fill={props.theme.bgDark.backgroundColor}
          />
        ) : (
          <View />
        )}
        <Text style={{ padding: 5, ...props.theme.color }}>{props.name}</Text>
        {props.views > 0 ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Icon
              name="eye-outline"
              style={{ width: 20, height: 20 }}
              fill={props.theme.bgDark.backgroundColor}
            />
            <Text
              style={{
                padding: 5,
                paddingLeft: 2.5,
                paddingTop: 0,
                color: props.theme.bgDark.backgroundColor,
              }}>
              {props.views}
            </Text>
          </View>
        ) : (
          <View />
        )}
      </Layout>
    </Layout>
  );
};
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
  HomeBasic: state.main.HomeReducer,
  ShortModal: state.main.ShortModal,
  theme: state.main.ChatReducer.theme,
});

export default connect(mapStateToProps, {
  setShortModal,
  setShortModalProps,
  setActiveChat,
  setChatTheme,
})(MessageScreen);
class MessageInput extends Component {
  state = { value: "" };
  input = React.createRef();

  clear() {
    this?.input?.current?.clear();
    this.setState({ value: "" });
  }
  focus() {
    this?.input?.current?.focus();
  }
  blur() {
    this?.input?.current?.blur();
  }
  render() {
    return (
      <TextInput
        ref={this.input}
        multiline
        style={{
          height: 45,
          marginBottom: 5,
          borderWidth: 1,
          borderRadius: 50,
          paddingHorizontal: 10,
          paddingRight: 100,
          padding: 5,
          overflow: "hidden",
          paddingLeft: this.state.value ? 10 : 45,
          borderColor: this.props.theme.bgDark.backgroundColor,
          ...this.props.theme.bgLight,
          ...this.props.theme.color,
        }}
        placeholderTextColor={this.props.theme.bgDark.backgroundColor}
        value={this.state.value}
        blurOnSubmit={false}
        placeholder="Type a Message..."
        returnKeyType="send"
        onChangeText={(value) => {
          this.setState({ value: value.trim() });
          this.props?.onChangeText(value);
        }}
        onSubmitEditing={() => this.props.sendMessage(this.state.value)}
      />
    );
  }
}
class Mic extends PureComponent {
  state = { record: false, locked: false, discard: false, duration: "00:00" };
  pan = React.createRef();
  tap = React.createRef();
  swipeCancel = new Animated.Value(0);
  swipeLock = new Animated.Value(0);
  recorder = null;
  render() {
    return (
      <PanGestureHandler
        ref={this.pan}
        onGestureEvent={(e) => {
          if (e.nativeEvent.state === State.ACTIVE) {
            if (
              e.nativeEvent.translationY > -10 ||
              (e.nativeEvent.translationX < -10 &&
                e.nativeEvent.translationY > -10)
            ) {
              Animated.timing(this.swipeCancel, {
                toValue: e.nativeEvent.translationX * 0.4,
                duration: 0,
                useNativeDriver: true,
              }).start();
              Animated.timing(this.swipeLock, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }).start();
              if (e.nativeEvent.translationX * 0.4 < -50) {
                this.state.record && Vibration.vibrate(100);
                this.setState({ record: false, discard: true });
                Animated.timing(this.swipeCancel, {
                  toValue: 0,
                  duration: 0,
                  useNativeDriver: true,
                }).start();
              }
            } else {
              Animated.timing(this.swipeLock, {
                toValue: e.nativeEvent.translationY * 0.4,
                duration: 0,
                useNativeDriver: true,
              }).start();
              Animated.timing(this.swipeCancel, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }).start();
              if (e.nativeEvent.translationY * 0.4 < -70) {
                !this.state.locked && Vibration.vibrate(100);
                // this.setState({ locked: true });
                Animated.timing(this.swipeLock, {
                  toValue: 0,
                  duration: 0,
                  useNativeDriver: true,
                }).start();
              }
            }
          } else {
            Animated.spring(this.swipeCancel, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
            Animated.spring(this.swipeLock, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        }}
        simultaneousHandlers={this.tap}
        onHandlerStateChange={async (e) => {
          if (e.nativeEvent.state === State.BEGAN) {
            changeNavigationBarColor("#e9e9e9", true);
            this.setState({ record: true, discard: false });
            const granted = await Permissions.askAsync(
              Permissions.AUDIO_RECORDING
            );
            if (granted) {
              this.recorder = new Audio.Recording();
              try {
                await this.recorder.prepareToRecordAsync(
                  Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
                );
                await this.recorder.startAsync();
                // You are now recording!
                this.recorder.setOnRecordingStatusUpdate((e) => {
                  if (e?.isDoneRecording && !this.state.discard) {
                    if (e.durationMillis > 1000)
                      this.props?.send({
                        mediaType: "audio",
                        uri: this.recorder.getURI(),
                      });
                  } else {
                    var duration = new Date(e.durationMillis)
                      .toTimeString()
                      .split(" ")[0]
                      .split(":");
                    var min = parseInt(duration[1]) - 30;
                    var seconds = parseInt(duration[2]);
                    min = min < 10 ? "0" + min : min;
                    seconds = seconds < 10 ? "0" + seconds : seconds;
                    duration = min + ":" + seconds;
                    this.setState({
                      duration,
                    });
                  }
                });
              } catch (error) {
                // An error occurred!
              }
            } else {
              this.setState({ audio: false });
            }
          } else if (e.nativeEvent.state !== State.ACTIVE) {
            changeNavigationBarColor(this.props.theme.bg.backgroundColor, true);
            this.setState({ record: false });
            this.recorder.stopAndUnloadAsync();
          }
        }}>
        <Layout style={{ backgroundColor: "transparent" }}>
          {this.state.record && (
            <Animated.View
              style={{
                position: "absolute",
                width: Dimensions.get("screen").width,
                height: 70,
                backgroundColor: "#e9e9e9",
                left: -Dimensions.get("screen").width + 60,
                top: -10,
                elevation: 5,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingLeft: 20,
              }}>
              <Text category="h5">{this.state.duration}</Text>
              <Animated.View
                style={{
                  opacity: this.swipeCancel.interpolate({
                    inputRange: [-50, 0],
                    outputRange: [1, 0],
                  }),
                  marginLeft: 20,
                }}>
                <Icon
                  name="trash-2-outline"
                  style={{ width: 35, height: 35 }}
                  fill="red"
                />
              </Animated.View>
              <Animated.View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  transform: [{ translateX: this.swipeCancel }],
                }}>
                <TouchableWithoutFeedback
                  onPress={() => {}}
                  style={{
                    width: 80,
                    height: 80,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "blue",
                    borderRadius: 80,
                    margin: 10,
                    marginTop: -30,
                    elevation: 5,
                  }}>
                  <Icon
                    name={
                      this.state.locked ? "pause-circle-outline" : "mic-outline"
                    }
                    style={{ width: 35, height: 35 }}
                    fill="#fff"
                  />
                </TouchableWithoutFeedback>
              </Animated.View>
              {/* <Animated.View
                style={{
                  opacity: this.swipeLock.interpolate({
                    inputRange: [-50, 0],
                    outputRange: [1, 0],
                  }),
                  position: "absolute",
                  right: 30,
                  top: -150,
                  zIndex: -1,
                }}>
                <Icon
                  name="lock-outline"
                  style={{ width: 35, height: 35 }}
                  fill="#000"
                />
              </Animated.View> */}
            </Animated.View>
          )}
          <Ripple style={{ marginLeft: 5 }} onPress={() => {}}>
            <Icon
              name="mic-outline"
              style={{ width: 35, height: 35 }}
              fill={this.props.theme.color.color}
            />
          </Ripple>
        </Layout>
      </PanGestureHandler>
    );
  }
}

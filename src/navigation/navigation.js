import React from "react";
import { connect } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import HomeNavigator from "./HomeNavigation";
import LoginScreen from "../component/Login";
import SignupScreen from "../component/Signup/Signup";
import Signup2Screen from "../component/Signup/Signup2";
import Signup3Screen from "../component/Signup/Signup3";
import Signup4Screen from "../component/Signup/Signup4";
import { createStackNavigator } from "@react-navigation/stack";
import SplashScreen from "../component/Splash";
import PostScreen from "../component/PostScreen";
import MessageScreen from "../component/MessageScreen";
import {
  View,
  Easing,
  StatusBar,
  Linking,
  PushNotificationIOS,
  ToastAndroid,
  Alert,
} from "react-native";
import Animated from "react-native-reanimated";
import messaging from "@react-native-firebase/messaging";
import { BackHandler } from "react-native";
import { setShortModal } from "../actions/ShortModal";
import ShortModal from "../component/ShortModal";
import PostEditorScreen from "../component/PostEditorScreen";
import GalleryScreen from "../component/GalleryScreen";
import CameraGallery from "../component/CameraGallery";
import Captured from "../component/Captured";
import ProfileScreen from "../component/ProfileScreen";
import SearchScreen from "../component/SearchScreen";
import SettingsScreen from "../component/SettingsScreen";
import MopicScreen from "../component/MopicScreen";
import UserListScreen from "../component/UserListScreen";
import EditProfile from "../component/EditProfile";
import ProfileImageScreen from "../component/ProfileImageScreen";
import CommentScreen from "../component/home/CommentScreen";
import ReconnectingWebSocket from "reconnecting-websocket";
import * as Constants from "../component/Constants";
import ImageEditor from "../component/ImageEditor";
import RecommendedMopics from "../component/RecommendedMopics";
import MopicLiked from "../component/MopicLiked";
import SelfRatings from "../component/SelfRatings";
import notifee, {
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
  EventType,
} from "@notifee/react-native";
import changeNavigationBarColor from "react-native-navigation-bar-color";
import { v4 as uuidv4 } from "uuid";
import { setUploadMopic } from "../actions/UploadMopic";
import { addMopics, setMopics } from "../actions/HomeActions";
import VideoCall from "../component/VideoCall";
import { setCallStatus } from "../actions/CallActions";
import CallType from "../component/utils/CallType";
import Logout from "../component/Logout";
import OtpLogin from "../component/OtpLogin";
const StackNav = createStackNavigator();

const AppNavigatorMain = ({ socket, story, MopicPost, isLoggedIn }) => (
  <StackNav.Navigator headerMode="none">
    <StackNav.Screen component={SplashScreen} name="Splash" />
    <StackNav.Screen component={LoginScreen} name="Login" />
    <StackNav.Screen component={OtpLogin} name="OtpLogin" />
    <StackNav.Screen component={SignupScreen} name="Signup" />
    <StackNav.Screen component={Signup2Screen} name="Signup2" />
    <StackNav.Screen component={Signup3Screen} name="Signup3" />
    <StackNav.Screen component={Signup4Screen} name="Signup4" />
    {isLoggedIn && (
      <>
        <StackNav.Screen
          name="BaseApp"
          component={HomeNavigator}
          initialParams={{ socket, story }}
        />
        <StackNav.Screen
          name="MessageScreen"
          component={MessageScreen}
          initialParams={{ socket }}
        />
        <StackNav.Screen
          name="PostEditorScreen"
          initialParams={{ MopicPost }}
          component={PostEditorScreen}
        />
        <StackNav.Screen name="GalleryScreen" component={GalleryScreen} />
        <StackNav.Screen name="CameraGallery" component={CameraGallery} />
        <StackNav.Screen name="Captured" component={Captured} />
        <StackNav.Screen name="ProfileScreen" component={ProfileScreen} />
        <StackNav.Screen name="SearchScreen" component={SearchScreen} />
        <StackNav.Screen name="SettingsScreen" component={SettingsScreen} />
        <StackNav.Screen name="MopicScreen" component={MopicScreen} />
        <StackNav.Screen name="CommentsScreen" component={CommentScreen} />
        <StackNav.Screen name="UserListScreen" component={UserListScreen} />
        <StackNav.Screen component={Logout} name="Logout" />
        <StackNav.Screen name="ProfileEditScreen" component={EditProfile} />
        <StackNav.Screen
          name="ProfileImageScreen"
          component={ProfileImageScreen}
        />
        <StackNav.Screen name="ImageEditor" component={ImageEditor} />
        <StackNav.Screen
          name="RecommendedMopics"
          component={RecommendedMopics}
        />
        <StackNav.Screen name="MopicLiked" component={MopicLiked} />
        <StackNav.Screen name="SelfRatings" component={SelfRatings} />
        <StackNav.Screen
          name="VideoCall"
          initialParams={{ socket }}
          component={VideoCall}
        />
      </>
    )}
  </StackNav.Navigator>
);
class AppNavigatorScreen extends React.Component {
  state = {
    position: new Animated.Value(0),
    scale: new Animated.Value(1),
    borderRadius: new Animated.Value(0),
    ws: null,
  };
  constructor(props) {
    super(props);
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }

  UNSAFE_componentWillUnmount() {
    BackHandler.removeEventListener(
      "hardwareBackPress",
      this.handleBackButtonClick
    );
    this?.ws?.close();
  }

  handleBackButtonClick() {
    // this.props.navigation.goBack(null);
    // return true;
    if (this.props.ShortModal.action) {
      this.props.setShortModal(false, "Loading");
      return true;
    }
  }
  postStory(images) {
    let formData = new FormData();
    // console.log(images.length);
    images.map((image, index) => {
      let uriParts = image.uri.split(".");
      let fileType = uriParts[uriParts.length - 1];
      formData.append("media" + index, {
        uri: image.uri,
        name: `photo.${fileType}`,
        type: `${image.mediaType}/${fileType}`,
      });
      if (image.thumbnail)
        formData.append("thumbnail" + index, {
          uri: image.thumbnail,
          name: `thumbnail.jpg`,
          type: `image/jpg`,
        });
    });
    formData.append("media", images.length);
    var xhr = new XMLHttpRequest();
    const self = this;
    xhr.onerror = () => {
      self.props.route.params?.story?.xhr.abort();
      ToastAndroid.show(
        self.state.status ? "Failed To Post Story" : "Media Size too big",
        ToastAndroid.LONG
      );
    };

    xhr.open("PUT", Constants.API_URL + "/story/create/");

    xhr.setRequestHeader("Authorization", "Token " + this.props.auth.token);
    xhr.send(formData);
  }
  connectSocket() {
    const ws = new ReconnectingWebSocket(
      Constants.WS_URL + this.props.auth?.user?.profile?.server_token
    );
    this.setState({
      ws,
    });
    ws.onopen = () => {
      // console.log("Start Connection");
    };
    ws.onmessage = (e) => {
      console.log(e.data);
      const data = JSON.parse(e.data);
      if (data.type === "receive_call" || data.type === "cancel_call") {
        this.handleIncomingCall(data);
      } else if (data.type === "new_message") {
        fetch(Constants.API_URL + "/messenger/receive/", {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: "Token " + this.props.auth.token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sender: detail.notification.id }),
        });
      }
    };
    ws.onerror = (e) => {
      // console.log("onerror", e.message);
    };
    ws.onclose = (e) => {
      // console.log("onclose", e.code, e.reason);
    };
  }
  async configureNotifications() {
    await messaging().registerDeviceForRemoteMessages();

    const token = await messaging().getToken();
    fetch(Constants.API_URL + "/accounts/fcm/", {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.auth.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
      }),
    });
    await notifee.createChannelGroup({
      id: "messenger",
      name: "Messenger",
    });
    await notifee.createChannelGroup({
      id: "mopic",
      name: "Mopic",
    });
    await notifee.createChannel({
      id: "personal_message",
      name: "Personal Messages",
      groupId: "messenger",
      badge: true,
      vibration: true,
      lights: true,
      lightColor: "blue",
      importance: AndroidImportance.HIGH,
      bypassDnd: true,
      description: "Messages sent to you by users",
      sound: "default",
      visibility: AndroidVisibility.PRIVATE,
    });
    await notifee.createChannel({
      id: "call",
      name: "Calls",
      groupId: "messenger",
      badge: true,
      vibration: true,
      lights: true,
      lightColor: "blue",
      importance: AndroidImportance.HIGH,
      bypassDnd: true,
      description: "Incoming & Outgoing Calls",
      sound: "default",
      visibility: AndroidVisibility.PRIVATE,
    });
    await notifee.createChannel({
      id: "mopic_upload",
      name: "Upload Mopic",
      groupId: "mopic",
      vibration: true,
      lights: true,
      lightColor: "blue",
      importance: AndroidImportance.DEFAULT,
      sound: "default",
      visibility: AndroidVisibility.PUBLIC,
      description: "Mopic Updates",
    });

    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification) {
      if (
        initialNotification.notification.android.pressAction.id ===
        "open_messages"
      )
        Linking.openURL(
          "morvii://MessageScreen/" + initialNotification.notification.id
        );
    }
    this.messaging = messaging().onMessage(async (remoteMessage) => {
      if (
        remoteMessage.data.type === "receive_call" ||
        remoteMessage.data.type === "cancel_call"
      ) {
        this.handleIncomingCall(remoteMessage.data);
      } else if (
        remoteMessage.data.type === "message" &&
        this.props.activeChat !== remoteMessage.data.user
      ) {
        var messages = [];
        var messages_ = JSON.parse(remoteMessage.data.message);
        messages_?.forEach((value, index) => {
          messages.push({
            text: value[1],
            timestamp: parseInt(value[0]),
            person: {
              name: remoteMessage.data.user,
              icon: remoteMessage.data.icon,
            },
          });
        });
        fetch(Constants.API_URL + "/messenger/receive/", {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: "Token " + this.props.auth.token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sender: remoteMessage.data.user }),
        });
        notifee.displayNotification({
          id: remoteMessage.data.user,
          android: {
            channelId: "personal_message",
            smallIcon: "ic_stat_name",
            color: "blue",
            sound: "default",
            timestamp: Date.now(),
            showTimestamp: true,
            pressAction: { id: "open_messages", launchActivity: "default" },
            actions: [
              {
                title: "Reply",
                pressAction: {
                  id: "reply",
                },
                input: {
                  allowFreeFormInput: true,
                  placeholder: "Reply to " + remoteMessage.data.user + "...",
                },
              },
              {
                title: "Mark as Read",
                pressAction: {
                  id: "mark_as_read",
                },
              },
            ],
            style: {
              type: AndroidStyle.MESSAGING,
              group: true,
              title: remoteMessage.data.user,
              person: {
                icon: this.props.auth.user?.profile?.image,
                name: this.props.auth.user.username,
              },
              messages,
            },
          },
        });
      }
    });

    await notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          // console.log("User dismissed notification", detail.notification);
          break;
        case EventType.PRESS:
          if (
            detail.notification?.android?.pressAction?.id === "open_messages"
          ) {
            Linking.openURL("morvii://MessageScreen/" + detail.notification.id);
          } else {
            // alert(detail.notification.id);
          }
          break;
        case EventType.ACTION_PRESS:
          if (detail.pressAction.id === "mark_as_read") {
            fetch(Constants.API_URL + "/messenger/send/", {
              method: "POST",
              headers: {
                Accept: "application/json",
                Authorization: "Token " + this.props.auth.token,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ sender: detail.notification.id }),
            }).then(async (response) => {
              await notifee.cancelNotification(detail.notification.id);
            });
          } else if (detail.pressAction.id === "reply") {
            // await updateChat(detail.notification.data.chatId, detail.action.input);
            fetch(Constants.API_URL + "/messenger/send/", {
              method: "PUT",
              headers: {
                Accept: "application/json",
                Authorization: "Token " + this.props.auth.token,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                receiver: detail.notification.id,
                message: detail.input,
              }),
            })
              .then((response) => {
                const statusCode = response.status;
                const data = response.json();
                return Promise.all([statusCode, data]);
              })
              .then(async ([statusCode, data]) => {
                notifee.displayNotification({
                  id: detail.notification.id,
                  android: {
                    ...detail.notification.android,
                    timestamp: Date.now(),
                    style: {
                      ...detail.notification.android.style,
                      messages: [
                        ...detail.notification.android.style.messages,
                        {
                          text: detail.input,
                          timestamp: Date.now(),
                        },
                      ],
                    },
                  },
                });
                // await notifee.cancelNotification(detail.notification.id);
              })
              .catch(async () => {
                notifee.displayNotification({
                  id: detail.notification.id,
                  android: {
                    ...detail.notification.android,
                    timestamp: Date.now(),
                    style: {
                      ...detail.notification.android.style,
                      messages: [
                        ...detail.notification.android.style.messages,
                        {
                          text:
                            detail.input +
                            "<small style='color:#444444;'> Failed!</small>",
                          timestamp: Date.now(),
                        },
                      ],
                    },
                  },
                });
              });
          } else if (detail.pressAction.id === "cancel_mopic_upload") {
            this.props.uploadMopic.mopics?.[detail.notification.id].abort();
          } else if (detail.pressAction.id === "answer_call") {
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
              ).catch(() => {
                this.props.setCallStatus({
                  status: CallType.IDLE,
                  user: null,
                });
                notifee.cancelNotification(
                  this.props.callStatus.user?.username + "_call"
                );
              });
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
              Linking.openURL(
                "morvii://VideoCall/" +
                  this.props.callStatus.user?.username +
                  "/RECEIVECALL"
              );
            }
          } else if (
            detail.pressAction.id === "reject_call" ||
            detail.pressAction.id === "hang_call"
          ) {
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
                    detail.pressAction.id === "reject_call"
                      ? "REJECT_CALL"
                      : "HANG_UP",
                }),
              }
            );
            notifee.cancelNotification(
              this.props.callStatus.user?.username + "_call"
            );
            this.props.setCallStatus({
              status: CallType.IDLE,
              user: undefined,
            });
          }
          break;
      }
    });
  }
  handleIncomingCall(data) {
    if (this.props.callStatus.user) {
      this.props.setCallStatus({
        status: CallType.IDLE,
        user: null,
      });
    }
    if (data.type === "receive_call") {
      if (this.props.callStatus.status !== CallType.IDLE) {
        fetch(Constants.API_URL + "/messenger/call/" + data.user + "/", {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: "Token " + this.props.auth.token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ response: "BUSY" }),
        });
      } else {
        this.props.setCallStatus({
          status: CallType.INCOMING,
          user: {
            username: data.user,
            name: data.name,
            image: data.image,
          },
        });
        notifee.displayNotification({
          id: data.user + "_call",
          title: "Incoming Call",
          body: data.user,
          android: {
            channelId: "call",
            smallIcon: "ic_stat_name",
            color: "blue",
            sound: "default",
            onlyAlertOnce: true,
            colorized: true,
            pressAction: { id: "open_caller" },
            ongoing: true,
            largeIcon: data.image,
            actions: [
              {
                title: "Answer",
                pressAction: {
                  id: "answer_call",
                },
              },
              {
                title: "Reject",
                pressAction: {
                  id: "reject_call",
                },
              },
            ],
          },
        });
        Linking.openURL("morvii://VideoCall/" + data.user + "/RECEIVECALL");
      }
    }
  }
  componentDidMount() {
    changeNavigationBarColor("#ffffff", true);
    if (this.props.auth?.user?.profile?.server_token) {
      this.configureNotifications();
      this.connectSocket();
    }
    StatusBar.setBackgroundColor("transparent", true);

    BackHandler.addEventListener(
      "hardwareBackPress",
      this.handleBackButtonClick
    );
    this.toggleModal();
  }

  formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };
  postMopic(images, caption, location) {
    const notificationID = uuidv4();
    const timestamp = Date.now();
    notifee.displayNotification({
      id: notificationID,
      title: "Processing Images...",
      android: {
        smallIcon: "ic_stat_name",
        color: "blue",
        colorized: true,
        timestamp,
        showTimestamp: true,
        channelId: "mopic_upload",
        onlyAlertOnce: true,
        ongoing: true,
        progress: {
          indeterminate: true,
        },
      },
    });
    let formData = new FormData();
    images.map((image, index) => {
      let uriParts = image.uri.split(".");
      let fileType = uriParts[uriParts.length - 1];
      formData.append("media" + index, {
        uri: image.uri,
        name: `photo.${fileType}`,
        type: `${image.mediaType}/${fileType}`,
      });
      if (image.thumbnail)
        formData.append("thumbnail" + index, {
          uri: image.thumbnail,
          name: `thumbnail.jpg`,
          type: `image/jpg`,
        });
    });
    formData.append("media", images.length ? images.length : 0);
    formData.append("caption", caption);
    formData.append("location", location);

    var xhr = new XMLHttpRequest();
    this.props.setUploadMopic(notificationID, xhr);

    const self = this;
    xhr.open("POST", Constants.API_URL + "/mopic/create/");

    xhr.upload.onprogress = function ({ total, loaded }) {
      const total_ = self.formatBytes(total);
      const loaded_ = self.formatBytes(loaded);
      notifee.displayNotification({
        id: notificationID,
        title: total - 1 <= loaded ? "Saving..." : "Posting New Mopic...",
        body: loaded_ + " / " + total_,
        android: {
          channelId: "mopic_upload",
          smallIcon: "ic_stat_name",
          color: "blue",
          colorized: true,
          timestamp,
          showTimestamp: true,
          onlyAlertOnce: true,
          ongoing: true,
          progress:
            total - 1 <= loaded
              ? { indeterminate: true }
              : {
                  max: total,
                  current: loaded,
                },
          actions: [
            { title: "Cancel", pressAction: { id: "cancel_mopic_upload" } },
          ],
        },
      });
      // self.setState({ status: { loaded, total, error: false } });
    };
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        var resp = JSON.parse(this.responseText);
        // console.log(resp);
        self.props.addMopics([resp]);
      }
    };
    xhr.onload = function () {
      // self.props.navigation.replace("BaseApp", { mopic: true });
      self.props.setUploadMopic(notificationID, null);

      notifee.displayNotification({
        id: notificationID,
        title: "New Mopic Posted",
        android: {
          channelId: "mopic_upload",
          smallIcon: "ic_stat_name",
          color: "green",
          colorized: true,
          timestamp: Date.now(),
          showTimestamp: true,
          ongoing: false,
        },
      });
    };
    xhr.onerror = function () {
      // self.setState({ upload: false });
      xhr.abort();
      notifee.displayNotification({
        id: notificationID,
        title: "Uploading Failed",
        android: {
          channelId: "mopic_upload",
          smallIcon: "ic_stat_name",
          color: "red",
          colorized: true,
          timestamp: Date.now(),
          showTimestamp: true,
          // onlyAlertOnce: true,
          ongoing: false,
        },
      });
      self.props.setUploadMopic(notificationID, null);

      ToastAndroid.show(
        self.state.status ? "Failed To Upload" : "Media Size too big",
        ToastAndroid.LONG
      );
    };
    xhr.onabort = function () {
      self.props.setUploadMopic(notificationID, null);
      notifee.displayNotification({
        id: notificationID,
        title: "Uploading Cancelled",
        android: {
          channelId: "mopic_upload",
          smallIcon: "ic_stat_name",
          color: "red",
          colorized: true,
          timestamp: Date.now(),
          showTimestamp: true,
          // onlyAlertOnce: true,
          ongoing: false,
        },
      });
    };
    xhr.setRequestHeader("Authorization", "Token " + this.props.auth.token);
    xhr.send(formData);
  }
  componentDidUpdate() {
    // StatusBar.setBackgroundColor("transparent", true);
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor("transparent");
    if (!this.props.auth?.user?.profile?.server_token) {
      this?.ws?.close();
      if (this.state.ws) this.setState({ ws: null });
    } else if (
      this.state.ws == null &&
      this.props.auth?.user?.profile?.server_token
    ) {
      this.configureNotifications();
      this.connectSocket();
    }
    this.toggleModal();
  }

  toggleModal = () => {
    if (this.props.ShortModal.action) {
      Animated.timing(this.state.scale, {
        toValue: 0.9,
        duration: 300,
        easing: Easing.in(),
        useNativeDriver: true,
      }).start();
      StatusBar.setBarStyle("light-content", true);
    } else {
      Animated.timing(this.state.scale, {
        toValue: 1,
        useNativeDriver: true,
        duration: 300,
        easing: Easing.in(),
      }).start();
      StatusBar.setBarStyle("dark-content", true);
    }
  };
  render() {
    this.state.position.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.5, 0],
    });
    return (
      <>
        <ShortModal navigation={this.props.navigation} />
        <AppNavigatorMain
          isLoggedIn={this.props.auth.isLoggedIn}
          socket={this.state.ws}
          MopicPost={this.postMopic.bind(this)}
          story={{ post: this.postStory.bind(this) }}
        />
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  auth: state.secure.auth,
  activeChat: state.main.ChatReducer.active,
  ShortModal: state.main.ShortModal,
  uploadMopic: state.main.UploadMopic,
  callStatus: state.main.CallReducer,
});
const linking = {
  prefixes: ["https://morvii.com", "morvii://"],
  config: {
    screens: {
      MessageScreen: { path: "MessageScreen/:user" },
      VideoCall: { path: "VideoCall/:user/:type" },
    },
  },
};
export default AppNavigator = () => (
  <NavigationContainer linking={linking}>
    <StackNav.Navigator headerMode="none">
      <StackNav.Screen
        component={connect(mapStateToProps, {
          setShortModal,
          setUploadMopic,
          addMopics,
          setCallStatus,
        })(AppNavigatorScreen)}
        name="App"
      />
    </StackNav.Navigator>
  </NavigationContainer>
);

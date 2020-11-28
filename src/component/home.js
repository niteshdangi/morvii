import React, { PureComponent } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { setLoggedIn } from "../actions/loginAction";
import StoryView from "./home/stories";
import {
  Layout,
  TopNavigation,
  TopNavigationAction,
  Text,
  Spinner,
  Button,
} from "@ui-kitten/components";
import { connect } from "react-redux";
import { setMopics, setRollTimestamp } from "../actions/HomeActions";
import { Icon } from "@ui-kitten/components";
import {
  FlatList,
  View,
  Image,
  Dimensions,
  Alert,
  RefreshControl,
  LogBox,
  NavigatorIOS,
} from "react-native";
// import PullToRefresh from "react-native-pull-to-refresh-custom";
// import loadHeader from "./loadHeader";
import Mopic from "./home/mopic";
import ShortModal from "./ShortModal";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { setShortModal, setShortModalProps } from "../actions/ShortModal";
import {
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Platform,
} from "react-native";
import styled from "styled-components";
import { TouchableRipple } from "react-native-paper";
import {
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  PanGestureHandler,
} from "react-native-gesture-handler";
import CameraRollHome from "./home/CameraRollHome";
import ScrollRefreshView from "./utils/ScrollRefreshView";
import * as Constants from "./Constants";
import { Modalize } from "react-native-modalize";
import ChatList from "./home/chatList";
import ChatIcon from "./home/ChatIcon";
import { setUploadMopic } from "../actions/UploadMopic";
import Ripple from "react-native-material-ripple";
const CreateMopic = (props) => (
  <Animated.View
    style={{
      padding: 10,
      margin: 10,
      justifyContent: "center",
      borderRadius: 10,
      elevation: 1,
      position: "absolute",
      backgroundColor: "white",
      zIndex: 999991,
      // marginTop: -10,
      // paddingTop: 0,
      ...props.animatedStyle,
    }}>
    <Layout>
      <TouchableRipple
        onPress={() =>
          props.navigation.navigate("GalleryScreen", {
            type: "NEW_MOPIC",
          })
        }
        onLongPress={() =>
          props.navigation.navigate("CameraGallery", {
            type: "NEW_MOPIC",
          })
        }>
        <Layout
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 5,
            justifyContent: "space-between",
          }}>
          <Animated.View
            style={{
              opacity: props.animatedStyle.textOpacity,
            }}>
            <Text numberOfLines={1} category="h6">
              Create New Mopic
            </Text>
          </Animated.View>
          <Layout style={{ position: "absolute", top: 3, right: 0 }}>
            <Icon
              style={{
                width: 30,
                height: 30,
                tintColor: "black",
              }}
              name="plus"
            />
          </Layout>
        </Layout>
      </TouchableRipple>
    </Layout>
  </Animated.View>
);
const NewMopic = (props) =>
  props.route.params ? (
    props.route.params.MopicNew ? (
      <Layout
        style={{
          padding: 10,
          margin: 10,
          justifyContent: "center",
          borderRadius: 10,
          elevation: 3,
        }}
        level="2">
        <TouchableRipple
          onPress={() =>
            this.props.navigation.navigate("GalleryScreen", {
              type: "NEW_MOPIC",
            })
          }
          onLongPress={() =>
            props.navigation.navigate("CameraGallery", {
              type: "NEW_MOPIC",
            })
          }>
          <Layout
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 5,
              justifyContent: "space-between",
            }}
            level="2">
            <Text category="h6">Create New Mopic</Text>
            <Icon
              style={{
                width: 30,
                height: 30,
                tintColor: "black",
              }}
              name="plus"
            />
          </Layout>
        </TouchableRipple>
      </Layout>
    ) : (
      <CreateMopic {...props} lstamp />
    )
  ) : (
    <CreateMopic {...props} lstamp />
  );
export class MessageShareItem extends React.Component {
  state = { send: false };
  shouldComponentUpdate(p, s) {
    if (p.post !== this.props.post || s != this.state) return true;
    return false;
  }
  render() {
    const { item } = this.props;
    return (
      <Layout
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          padding: 5,
          margin: 5,
          alignItems: "center",
        }}>
        <Layout style={{ flexDirection: "row", alignItems: "center" }}>
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
            <Text numberOfLines={1} style={{ marginLeft: 10, width: "60%" }}>
              {item.user.username}
            </Text>
          )}
        </Layout>
        <Button
          size="small"
          style={{ height: 20 }}
          appearance={!this.state.send ? "filled" : "outline"}
          disabled={this.state.send}
          onPress={() => {
            const message = this.props.message?.current.state.value.trim();
            if (!this.state.send) {
              this.setState({ send: true });
              if (this.props.post) console.log(this.props.post.id);
              fetch(Constants.API_URL + "/messenger/send/", {
                method: "PUT",
                headers: {
                  Accept: "application/json",
                  Authorization: "Token " + this.props.token,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  receiver: item.user.username,
                  post: this.props.post.id,
                  message,
                }),
              });
            }
          }}>
          {this.state.send ? "Sent" : "Send"}
        </Button>
      </Layout>
    );
  }
}
export class TextInputShare extends React.Component {
  state = { value: "" };
  render() {
    return (
      <TextInput
        ref={this.messageShareInput}
        onChangeText={(value) => this.setState({ value })}
        style={{
          width: "80%",
          marginHorizontal: 10,
          height: 50,
          borderBottomWidth: 1,
          padding: 5,
        }}
        multiline
        placeholder="Enter a message..."
      />
    );
  }
}
class HomeScreen extends React.Component {
  state = {
    scale: new Animated.Value(1),
    borderRadius: new Animated.Value(0),
    lstamproll: this.props.HomeBasic.rollLatestTimestamp,
    scrollY: new Animated.Value(0),
    loading: true,
    bottomLoader: false,
    moreBottom: true,
    chatBubble: 0,
  };
  chatBubbleScale = new Animated.Value(0);
  chatIcon = new Animated.Value(1);
  notifOpacity = new Animated.Value(0);
  messageShare = React.createRef();
  RefreshControl = React.createRef();
  setRefreshing = (refreshing) => {
    this.setState({ ...this.state, refreshing });
  };
  onRefresh(fresh = false) {
    fetch(Constants.API_URL + "/mopic/home/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.auth.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        this.props.HomeBasic.mopics?.length > 0 && !fresh
          ? {
              beforedatetime: this.props.HomeBasic?.mopics[1]?.date,
            }
          : {}
      ),
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        if (statusCode === 200) {
          fresh
            ? this.props.setMopics([{ id: 0 }, ...data.mopics])
            : this.props.setMopics(
                [
                  { id: 0 },
                  ...data.mopics,
                  ...this.props.HomeBasic.mopics
                    ?.slice(1, this.props.HomeBasic.mopics?.length)
                    .map((item, index) => ({ ...item, refresh: true })),
                ].slice(0, 10)
              );
          this.setState({
            loading: false,
          });
          this.RefreshControl.current?.stop();
        } else {
          this.RefreshControl.current?.stop();
          this.setState({ loading: false });
        }
      })
      .catch(() => {
        this.RefreshControl.current?.stop();
        this.setState({ loading: false });
      });
  }
  loadOld() {
    fetch(Constants.API_URL + "/mopic/home/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.auth.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        afterdatetime: this.props.HomeBasic.mopics[
          this.props.HomeBasic.mopics?.length - 1
        ]?.date,
      }),
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        if (statusCode === 200) {
          this.setState({
            postsData: [...this.props.HomeBasic.mopics, ...data.mopics],
            bottomLoader: false,
            moreBottom: data.mopics.length > 0,
          });
        } else {
          this.setState({ bottomLoader: false });
        }
      })
      .catch(() => {
        this.setState({ bottomLoader: false });
      });
  }
  componentDidMount() {
    LogBox.ignoreAllLogs();
    StatusBar.setBarStyle("dark-content", true);
    StatusBar.setBackgroundColor("transparent");

    setTimeout(() => {
      this.onRefresh(true);
      fetch(Constants.API_URL + "/accounts/login/verify/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: "Token " + this.props.auth.token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: this.props?.auth?.user?.username }),
      })
        .then((response) => {
          const statusCode = response.status;
          const data = response.json();
          return Promise.all([statusCode, data]);
        })
        .then(([statusCode, data]) => {
          if (statusCode === 200) {
            this.props.setLoggedIn({
              state: true,
              token: this.props.auth.token,
              user: data.user,
            });
          } else {
            this.props.setLoggedIn({ state: false, token: null, user: null });
            this.props.navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          }
        })
        .catch(() => {});
    }, 500);
  }

  // shouldComponentUpdate(p, s) {
  //   if (
  //     this.props.HomeBasic.mopics != s.postsData ||
  //     this.state.loading != s.loading ||
  //     this.state.bottomLoader != s.bottomLoader
  //   )
  //     return true;
  //   return false;
  // }
  _getCameraRollStyle = () => {
    const { scrollY } = this.state;
    return {
      opacity: scrollY.interpolate({
        inputRange: [20, 40, 70],
        outputRange: [1, 0.8, 0],
        extrapolate: "clamp",
        useNativeDriver: true,
      }),
      marginTop: scrollY.interpolate({
        inputRange: [50, 150],
        outputRange: [0, -150],
        extrapolate: "clamp",
        useNativeDriver: true,
      }),
    };
  };
  _getNewMopicStyle = () => {
    const { scrollY } = this.state;

    return {
      width: scrollY.interpolate({
        inputRange: [0, 40, 70],
        outputRange: [Dimensions.get("screen").width - 20, 50, 50],
        extrapolate: "clamp",
        useNativeDriver: true,
      }),
      right: scrollY.interpolate({
        inputRange: [0, 30, 70],
        outputRange: [0, 25, 40],
        extrapolate: "clamp",
        useNativeDriver: true,
      }),
      top: scrollY.interpolate({
        inputRange: [0, 70],
        outputRange: [90, 20],
        extrapolate: "clamp",
        useNativeDriver: true,
      }),
      textOpacity: scrollY.interpolate({
        inputRange: [0, 30],
        outputRange: [1, 0],
        extrapolate: "clamp",
        useNativeDriver: true,
      }),
    };
  };

  messageShareInput = React.createRef();
  render() {
    // this.props.HomeBasic.mopics.forEach((value, index) => {
    //   console.log(value.date);
    // });
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor("transparent");
    const isCloseToBottom = ({
      layoutMeasurement,
      contentOffset,
      contentSize,
    }) => {
      const paddingToBottom = 20;
      return (
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom
      );
    };
    const UploadingMopics = [];
    for (var key of Object.keys(this.props.uploadMopic.mopics)) {
      UploadingMopics.push({
        id: key,
        xhr: this.props.uploadMopic.mopics[key],
      });
    }
    return (
      <Layout style={{ backgroundColor: "white", flex: 1 }}>
        <Modalize
          snapPoint={500}
          // adjustToContentHeight={true}
          rootStyle={{ elevation: 10 }}
          modalStyle={{ paddingHorizontal: 10 }}
          closeSnapPointStraightEnabled={false}
          HeaderComponent={
            <Layout
              style={{
                margin: 5,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 10,
              }}>
              <Image
                source={{ uri: this.state.postSelected?.media[0]?.uri }}
                style={{ width: 50, height: 50 }}
              />
              <TextInputShare
                ref={this.messageShareInput}
                style={{
                  width: "80%",
                  marginHorizontal: 10,
                  height: 50,
                  borderBottomWidth: 1,
                  padding: 5,
                }}
                multiline
                placeholder="Enter a message..."
              />
            </Layout>
          }
          ref={this.messageShare}>
          {this.props.chatList?.map((item, index) => {
            return (
              <MessageShareItem
                message={this.messageShareInput}
                item={item}
                token={this.props.auth.token}
                post={this.state.postSelected}
              />
            );
          })}
        </Modalize>
        <Layout
          style={{
            flexWrap: "wrap",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 10,
            elevation: 1,
            zIndex: 99999,
            paddingTop: 10 + StatusBar.currentHeight,
          }}>
          <TouchableWithoutFeedback
            onPress={() => {
              this.props.navigation.navigate("BaseApp", {
                screen: "Message",
              });
            }}>
            <ChatIcon
              navigation={this.props.navigation}
              socket={this.props.route.params.socket}
              user={this.props.auth.user.username}
            />
          </TouchableWithoutFeedback>
          <Layout
            style={{
              position: "absolute",
              left: 0,
              width: Dimensions.get("screen").width,
              justifyContent: "center",
              alignItems: "center",
              zIndex: -1,
              paddingTop: StatusBar.currentHeight,
            }}>
            <Image
              source={require("../../assets/brandName.png")}
              resizeMode="cover"
              style={{ width: 100, height: 20 }}
            />
          </Layout>
          <Layout style={{ flexDirection: "row" }}>
            <TouchableRipple
              onPress={() => {
                this.props.navigation.navigate("BaseApp", {
                  screen: "Explore",
                });
              }}
              onLongPress={() => {
                this.props.navigation.navigate("SearchScreen");
              }}
              style={{ padding: 5 }}>
              <Icon
                style={{ tintColor: "black", width: 30, height: 30 }}
                name="search-outline"
              />
            </TouchableRipple>
          </Layout>
        </Layout>
        <NewMopic
          {...this.props}
          animatedStyle={{ ...this._getNewMopicStyle() }}
        />

        <ScrollRefreshView
          ref={this.RefreshControl}
          style={{ flex: 1, flexGrow: 1 }}
          onRefresh={() => {
            this.onRefresh();
          }}
          onRelease={() => {
            Animated.spring(this.state.scrollY, {
              toValue: 0,
              useNativeDriver: false,
            }).start();
          }}
          onRefreshScroll={(dy) => {
            Animated.event([this.state.scrollY], { useNativeDriver: false })(
              dy
            );
          }}
          onScroll={(e) => {
            Animated.event(
              [
                {
                  nativeEvent: { contentOffset: { y: this.state.scrollY } },
                },
              ],
              { useNativeDriver: false }
            )(e);
            if (isCloseToBottom(e.nativeEvent)) {
              if (!this.state.bottomLoader && this.state.moreBottom) {
                this.setState({ bottomLoader: true });
                this.loadOld();
              }
            }
          }}>
          {this.props.HomeBasic.mopics?.map((item, index) =>
            index === 0 ? (
              <View key={index}>
                <TouchableWithoutFeedback
                  key={index + "-1"}
                  onPress={() =>
                    this.props.navigation.navigate("GalleryScreen", {
                      type: "NEW_MOPIC",
                    })
                  }
                  onLongPress={() =>
                    this.props.navigation.navigate("CameraGallery", {
                      type: "NEW_MOPIC",
                    })
                  }
                  style={{ height: 70 }}
                />
                <CameraRollHome
                  key={index + "-2"}
                  lstamp={this.state.lstamproll}
                  navigation={this.props.navigation}
                  setRollTimestamp={this.props.setRollTimestamp}
                  animatedStyle={this._getCameraRollStyle()}
                />

                {UploadingMopics.map((value, index) => {
                  return <MopicUploadProgress xhr={value.xhr} key={index} />;
                })}
              </View>
            ) : (
              <View key={index}>
                <Mopic
                  data={item}
                  navigation={this.props.navigation}
                  messageShare={() => {
                    this.setState({ postSelected: item });
                    this.messageShare.current?.open();
                  }}
                  onOptionPress={(type, props = null) => {
                    this.props.setShortModal(true, type, props);
                    props == null &&
                      this.props.setShortModalProps({
                        component: "postOptions",
                      });
                  }}
                />
                {item.index === this.props.HomeBasic.mopics?.length - 1 ? (
                  <Layout
                    style={{
                      height: 100,
                      backgroundColor: "transparent",
                    }}
                  />
                ) : null}
              </View>
            )
          )}
          {this.state.bottomLoader && (
            <Layout
              style={{
                justifyContent: "center",
                alignItems: "center",
                height: 50,
                width: Dimensions.get("screen").width,
                backgroundColor: "transparent",
              }}>
              <Spinner />
            </Layout>
          )}
          {!this.state.moreBottom && (
            <Layout
              style={{
                justifyContent: "center",
                alignItems: "center",
                height: 50,
                width: Dimensions.get("screen").width,
                backgroundColor: "transparent",
              }}>
              <Text>You have seen all older Mopics</Text>
            </Layout>
          )}
          {this.state.loading ? (
            <Layout
              style={{
                justifyContent: "center",
                alignItems: "center",
                height: Dimensions.get("screen").width,
                width: Dimensions.get("screen").width,
                backgroundColor: "transparent",
              }}>
              <Spinner />
            </Layout>
          ) : (
            this.props.HomeBasic.mopics?.length < 2 && (
              <Layout
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  height: Dimensions.get("screen").width,
                  width: Dimensions.get("screen").width,
                  backgroundColor: "transparent",
                }}>
                <Text>Create a new Mopic</Text>
              </Layout>
            )
          )}
          <Layout style={{ backgroundColor: "transparent", height: 70 }} />
        </ScrollRefreshView>
      </Layout>
    );
  }
}
class MopicUploadProgress extends PureComponent {
  state = { total: 0, progress: 0 };
  animation = new Animated.Value(0);
  componentDidMount() {
    Animated.timing(this.animation, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
    const self = this;
    if (this.props.xhr)
      this.props.xhr.upload.addEventListener("progress", function ({
        total,
        loaded,
      }) {
        if (self.state.progress !== loaded.toFixed(0))
          self.setState({ total, progress: loaded.toFixed(0) });
      });
  }
  componentWillUnmount() {
    Animated.timing(this.animation, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
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
    return (
      <Animated.View
        style={{
          transform: [
            {
              translateX: this.animation.interpolate({
                inputRange: [0, 1],
                outputRange: [Dimensions.get("screen").width * 2, 0],
              }),
            },
          ],
          backgroundColor: "#fff",
        }}>
        <Layout
          style={{
            elevation: 2,
            padding: 10,
            justifyContent: "space-between",
            alignItems: "center",
            margin: 10,
            borderRadius: 10,
            flexDirection: "row",
          }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}>
            {this.state.progress === this.state.total ? (
              <Spinner />
            ) : (
              <AnimatedCircularProgress
                size={24}
                width={3}
                fill={(this.state.progress / this.state.total) * 100}
                tintColor="blue"
                backgroundColor="#e9e9e9">
                {(fill) => (
                  <Text style={{ fontSize: 10 }}>{fill.toFixed(0)}</Text>
                )}
              </AnimatedCircularProgress>
            )}

            <Text style={{ paddingLeft: 10 }}>Uploading...</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Text>
              {this.formatBytes(this.state.progress)} /{" "}
              {this.formatBytes(this.state.total)}
            </Text>
            <Ripple
              style={{ padding: 5 }}
              onPress={() => {
                Animated.spring(this.animation, {
                  toValue: 0,
                  useNativeDriver: true,
                }).start(() => {
                  this.props.xhr.abort();
                });
              }}>
              <Icon
                name="close-outline"
                style={{
                  width: 25,
                  height: 25,
                  tintColor: "#000",
                  paddingLeft: 15,
                }}
              />
            </Ripple>
          </View>
        </Layout>
      </Animated.View>
    );
  }
}
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
  HomeBasic: state.main.HomeReducer,
  ShortModal: state.main.ShortModal,
  chatList: state.main.ChatReducer.list,
  uploadMopic: state.main.UploadMopic,
});
export default connect(mapStateToProps, {
  setLoggedIn,
  setRollTimestamp,
  setShortModal,
  setShortModalProps,
  setMopics,
  setUploadMopic,
})(HomeScreen);

import React, { Component } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Divider,
  Icon,
  Layout,
  Spinner,
  Text,
  Toggle,
} from "@ui-kitten/components";
import { TouchableRipple } from "react-native-paper";
import StoryView from "./home/stories";
import * as Constants from "./Constants";
import { connect } from "react-redux";
import ChatList from "./home/chatList";
import {
  FlatList,
  Dimensions,
  StyleSheet,
  Animated,
  View,
  PanResponder,
  RefreshControl,
  Image,
  StatusBar,
} from "react-native";
import ReconnectingWebSocket from "reconnecting-websocket";
import { TextInput, ScrollView } from "react-native-gesture-handler";
import Ripple from "react-native-material-ripple";
import { setChatList } from "../actions/ChatActions";
import { setShortModal } from "../actions/ShortModal";
import ScrollRefreshView from "./utils/ScrollRefreshView";
import { LinearGradient } from "expo-linear-gradient";
import changeNavigationBarColor from "react-native-navigation-bar-color";
import { Modalize } from "react-native-modalize";
import OptionBt from "./utils/OptionBt";
import { setDarkTheme } from "../actions/HomeActions";
import { setLoggedIn } from "../actions/loginAction";
function wait(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}
const EmptyChat = (props) => {
  return (
    <Layout
      style={{
        justifyContent: "center",
        alignItems: "center",
        height: Dimensions.get("screen").width,
        backgroundColor: "transparent",
      }}>
      <Icon
        name="alert-triangle-outline"
        style={{ width: 60, height: 60, tintColor: "blue" }}
      />
      <Text style={{ textAlign: "center", ...props.theme.color }}>
        Chat Empty!{"\n"}Search Someone to Chat!
      </Text>
    </Layout>
  );
};
const SearchComponent = (props) => {
  const [searched, setSearched] = React.useState(false);
  const bar = React.useRef();
  const { clampedScroll } = props;
  const searchBarTranslate = clampedScroll.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -180],
    extrapolate: "clamp",
  });
  const searchBarOpacity = clampedScroll.interpolate({
    inputRange: [0, 10],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const inboxTranslate = clampedScroll.interpolate({
    inputRange: [10, 100],
    outputRange: [0, -180],
    extrapolate: "clamp",
  });
  const inboxOpacity = clampedScroll.interpolate({
    inputRange: [10, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  return (
    <View>
      <Animated.View
        style={[
          {
            transform: [
              {
                translateY: inboxTranslate,
              },
            ],
            opacity: inboxOpacity,
            position: "absolute",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            zIndex: 9999,
          },
        ]}>
        <Layout
          style={{
            padding: 10,
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 0,
            backgroundColor: props.theme.gradient[0],
          }}>
          <Layout
            style={{
              flexDirection: "row",
              width: Dimensions.get("window").width - 50,
              backgroundColor: props.theme.bg.backgroundColor,
              borderRadius: 10,
              margin: 5,
            }}>
            <Ripple
              onPress={() => props.setInbox(true)}
              style={{
                margin: 5,
                backgroundColor:
                  !props.searchMode && props.inboxType
                    ? "rgba(0,0,255,0.7)"
                    : props.theme.hint.color,
                padding: 5,
                borderRadius: 10,
                width: (Dimensions.get("window").width - 70) / 2,
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Text
                style={{
                  color: !props.searchMode && props.inboxType ? "#fff" : "#000",
                }}>
                Primary
              </Text>
              <Animated.View
                style={{
                  backgroundColor: "red",
                  height: 20,
                  width: 20,
                  borderRadius: 15,
                  elevation: 5,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingBottom: 2.5,
                  position: "absolute",
                  right: -5,
                  top: -5,
                  transform: [{ scale: props.bubbles[0] > 0 ? 1 : 0 }],
                }}>
                <Text style={{ color: "#fff" }}>{props.bubbles[0]}</Text>
              </Animated.View>
            </Ripple>
            <Ripple
              onPress={() => props.setInbox(false)}
              style={{
                margin: 5,
                backgroundColor:
                  !props.searchMode && !props.inboxType
                    ? "rgba(255,0,0,0.7)"
                    : props.theme.hint.color,
                padding: 5,
                borderRadius: 10,
                width: (Dimensions.get("window").width - 70) / 2,
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Text
                style={{
                  color:
                    !props.searchMode && !props.inboxType ? "#fff" : "#000",
                }}>
                General
              </Text>
              <Animated.View
                style={{
                  backgroundColor: "red",
                  height: 20,
                  width: 20,
                  borderRadius: 15,
                  elevation: 5,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingBottom: 2.5,
                  position: "absolute",
                  right: -5,
                  top: -5,
                  transform: [{ scale: props.bubbles[1] > 0 ? 1 : 0 }],
                }}>
                <Text style={{ color: "#fff" }}>{props.bubbles[0]}</Text>
              </Animated.View>
            </Ripple>
          </Layout>
        </Layout>
      </Animated.View>
      <Animated.View
        style={[
          styles.container,
          {
            marginTop: 20,
            transform: [
              {
                translateY: searchBarTranslate,
              },
            ],
            opacity: searchBarOpacity,
          },
        ]}>
        <TextInput
          ref={bar}
          placeholder="Search..."
          style={[
            styles.formField,
            { ...props.theme.bg, ...props.theme.color },
          ]}
          placeholderTextColor={props.theme.hint.color}
          onChangeText={(value) => {
            if (searched && !value) {
              setSearched(false);
            } else if (!searched && value) {
              setSearched(true);
            }
            props.onChangeText(value);
          }}
        />
        {props.loading ? (
          <Layout
            style={{
              position: "absolute",
              right: 15,
              top: 15,
              backgroundColor: "transparent",
            }}>
            <Spinner />
          </Layout>
        ) : searched ? (
          <Ripple
            style={{ position: "absolute", right: 10, top: 5, padding: 5 }}
            onPress={() => {
              setSearched(false);
              props.onChangeText("");
              bar.current.clear();
              bar.current.blur();
            }}>
            <Icon
              name="close-outline"
              style={{
                width: 30,
                height: 30,
                tintColor: props.theme.hint.color,
              }}
            />
          </Ripple>
        ) : (
          <Layout
            style={{
              position: "absolute",
              right: 15,
              top: 10,
              backgroundColor: "transparent",
            }}>
            <Icon
              name="search-outline"
              style={{
                width: 30,
                height: 30,
                tintColor: props.theme.hint.color,
              }}
            />
          </Layout>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    width: Dimensions.get("window").width - 40,
    left: 20,
    zIndex: 1,
    backgroundColor: "white",
    marginTop: -30,
    borderRadius: 20,
    elevation: 2,
  },
  formField: {
    borderWidth: 1,
    padding: 12,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 20,
    borderColor: "#888888",
    fontSize: 18,
    height: 50,
  },
});
const Theme = {
  dark: {
    bg: { backgroundColor: "#333333" },
    color: { color: "#e9e9e9", tintColor: "#e9e9e9" },
    gradient: ["#000", "#111111"],
    hint: { color: "rgba(255,255,255,0.5)" },
  },
  light: {
    bg: { backgroundColor: "#ffffff" },
    color: { color: "#000", tintColor: "#000" },
    hint: { color: "#8f9bb3" },
    gradient: ["#e9e9e9", "#ffffff"],
  },
};
class ChatScreen extends Component {
  componentDidMount() {
    this.props.navigation.addListener("blur", () => {
      changeNavigationBarColor(
        this.props.darkTheme ? "#000000" : "#ffffff",
        true
      );
    });
    this.props.navigation.addListener("focus", () => {
      this.onRefresh();
      if (this.props.route.params.socket) {
        this.props.route.params.socket.onmessage = (e) => {
          const data = JSON.parse(e.data);
          if (data.type === "typing") {
            this.props.chatData.forEach((user) => {
              if (user.user.username === data.user) {
                this.setState({
                  typingUsers: {
                    ...this.state.typingUsers,
                    [data.user]: data.value,
                  },
                });
              }
            });
          } else if (data.type === "seen_message") {
            var newChatData = [];
            this.props.chatData.map((item, index) => {
              if (item.user.username !== data.message.receiver) {
                newChatData.push({
                  user: item.user,
                  message: { ...item.message, seen: true, sent: true },
                });
              } else {
                newChatData.push(item);
              }
            });
            this.props.setChatList(newChatData);
          } else if (data.type === "sent_message") {
            var newChatData = [];
            this.props.chatData.map((item, index) => {
              if (item.user.username !== data.message.receiver) {
                newChatData.push({
                  user: item.user,
                  message: { ...item.message, sent: true },
                });
              } else {
                newChatData.push(item);
              }
            });
            this.props.setChatList(newChatData);
          } else if (data.type === "status") {
            var newChatData = [];
            this.props.chatData.map((item, index) => {
              if (item.user.username === data.user) {
                newChatData.push({
                  user: {
                    ...item.user,
                    profile: {
                      ...item.user.profile,
                      activity_status: data.value,
                      last_active: new Date(),
                      viewer: false,
                    },
                  },
                  message: item.message,
                });
              } else {
                newChatData.push(item);
              }
            });
            this.props.setChatList(newChatData);
          } else if (data.type === "viewer") {
            var newChatData = [];
            this.props.chatData.map((item, index) => {
              if (item.user.username === data.user) {
                newChatData.push({
                  user: {
                    ...item.user,
                    profile: {
                      ...item.user.profile,
                      activity_status: true,
                      last_active: new Date(),
                      viewer: data.value,
                    },
                  },
                  message: item.message,
                });
              } else {
                newChatData.push(item);
              }
            });
            this.props.setChatList(newChatData);
          } else if (data.type === "new_message") {
            var newChatData = [];
            this.props.chatData.map((item, index) => {
              if (item.user.username !== data.sender.username) {
                newChatData.push(item);
              }
            });
            this.props.setChatList([
              { user: data.sender, message: data.message },
              ...newChatData,
            ]);
          }
        };
      }
    });
    // this.onRefresh();
  }
  search(searchText) {
    if (searchText.length > 3) {
      this.setState({ loadingSearch: true });
      fetch(
        Constants.API_URL + "/messenger/search/" + searchText.toLowerCase(),
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
          if (data?.users) {
            this.setState({
              searchData: data.users,
              loadingSearch: false,
            });
          } else {
            this.setState({ loadingSearch: false });
          }
        })
        .catch(() => {
          this.setState({ loadingSearch: false });
        });
    } else this.setState({ searchData: [] });
  }
  state = {
    searchData: [],
    scrollYValue: new Animated.Value(0),
    typingUsers: {},
    inboxType: true,
  };
  RefreshControl = React.createRef();
  onRefresh = () => {
    this.setState({ loading: true });
    fetch(Constants.API_URL + "/messenger/home/", {
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
        if (data?.users) {
          this.setState({
            loading: false,
          });
          this.props.setChatList(data.users);
        } else {
          this.setState({ loading: false });
        }
        this.RefreshControl.current?.stop();
      })
      .catch(() => {
        this.RefreshControl.current?.stop();
        this.setState({ loading: false });
      });
  };

  scrollY = () => {
    const { scrollYValue } = this.state;

    return scrollYValue.interpolate({
      inputRange: [0, 0.1, 100],
      outputRange: [0, 1, 1],
      useNativeDriver: true,
    });
  };
  sort(list) {
    return list.sort((a, b) =>
      new Date(a.message.datetime) < new Date(b.message.datetime)
        ? 1
        : new Date(b.message.datetime) < new Date(a.message.datetime)
        ? -1
        : 0
    );
  }
  inboxScroll = React.createRef();
  settingsModal = React.createRef();
  render() {
    const ChatTheme = this.props.darkTheme ? Theme.dark : Theme.light;
    changeNavigationBarColor(ChatTheme.gradient[1], true);
    const clampedScroll = Animated.diffClamp(
      Animated.add(
        this.state.scrollYValue.interpolate({
          inputRange: [0, 2],
          outputRange: [0, 1],
          extrapolateLeft: "clamp",
        }),
        new Animated.Value(0)
      ),
      0,
      70
    );
    return (
      <Layout style={{ flex: 1 }}>
        <Modalize
          modalStyle={{
            overflow: "hidden",
          }}
          adjustToContentHeight={true}
          rootStyle={{ elevation: 5, zIndex: 100000 }}
          ref={this.settingsModal}>
          <Layout
            style={{
              backgroundColor: "transparent",
              paddingTop: 10,
              // height: 200,
            }}>
            <Layout
              style={{
                width: "100%",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                paddingLeft: 20,
                paddingBottom: 10,
              }}>
              <Toggle
                checked={this.props.darkTheme}
                onChange={() => {
                  this.props.setDarkTheme(!this.props.darkTheme);
                }}>
                <Text category="h6">Dark Mode</Text>
              </Toggle>
            </Layout>
            <Divider />
            <OptionBt
              icon="edit-outline"
              text="Edit Profile"
              onPress={() => {
                this.settingsModal.current.close();
                this.props.navigation.navigate("ProfileEditScreen");
              }}
            />
            <OptionBt
              image={{ uri: this.props.auth.user.profile.image }}
              text="Change Picture"
              onPress={() => {
                this.settingsModal.current.close();
                this.props.navigation.navigate("ProfileImageScreen", {
                  type: "primary",
                });
              }}
            />
            <OptionBt
              icon="settings-outline"
              text="Settings"
              onPress={() => {
                this.settingsModal.current.close();
                this.props.navigation.navigate("SettingsScreen", {
                  type: "main",
                });
              }}
            />
            <OptionBt
              icon="log-out-outline"
              text="Logout"
              onPress={() => {
                this.props.navigation.navigate("Logout");
              }}
            />
            {/* <Footer /> */}
          </Layout>
        </Modalize>

        <LinearGradient
          colors={ChatTheme.gradient}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: Dimensions.get("screen").height,
          }}
        />
        <Layout
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 10,
            elevation: 0.1,
            zIndex: 1000,
            paddingTop: StatusBar.currentHeight,
            backgroundColor: ChatTheme.gradient[0],
          }}>
          <Layout
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "transparent",
            }}>
            <Text
              style={{ padding: 10, paddingBottom: 0, ...ChatTheme.color }}
              category="h4">
              Messages
            </Text>
          </Layout>
          <Ripple
            onPress={() => {
              this.props.navigation.navigate("ProfileScreen", {
                username: this.props.auth.user.username,
              });
            }}
            onLongPress={() => {
              this.settingsModal.current.open();
            }}
            style={{
              borderWidth: 1,
              borderRadius: 15,
              borderColor: ChatTheme.hint.color,
            }}>
            <Image
              source={{ uri: this.props.auth?.user?.profile?.image }}
              style={{ width: 40, height: 40, borderRadius: 15 }}
            />
          </Ripple>
        </Layout>
        <View style={{ flex: 1 }}>
          <SearchComponent
            theme={ChatTheme}
            loading={this.state.loadingSearch}
            onChangeText={(value) => {
              this.search(value);
            }}
            clampedScroll={clampedScroll}
            inboxType={this.state.inboxType}
            searchMode={this.state.searchData.length > 0}
            setInbox={(type) => {
              this.setState({ inboxType: type });
              this.inboxScroll.current.scrollTo({
                x: type ? 0 : Dimensions.get("screen").width,
                animated: true,
              });
            }}
            bubbles={[
              this.props.chatData.filter(
                (value, index) =>
                  value.inboxType &&
                  !value.message.seen &&
                  value.message.sender !== this.props.auth.user.username
              ).length,
              this.props.chatData.filter(
                (value, index) =>
                  !value.inboxType &&
                  !value.message.seen &&
                  value.message.sender !== this.props.auth.user.username
              ).length,
            ]}
          />

          <ScrollRefreshView
            ref={this.RefreshControl}
            style={{ flex: 1, flexGrow: 1 }}
            onRefresh={() => {
              this.onRefresh();
            }}
            onRelease={() => {
              Animated.spring(this.state.scrollYValue, {
                toValue: 0,
                useNativeDriver: false,
              }).start();
            }}
            onRefreshScroll={(dy) => {
              Animated.timing(this.state.scrollYValue, {
                toValue: dy,
                duration: 0,
                useNativeDriver: false,
              }).start();
            }}
            onScroll={(event) => {
              Animated.event(
                [
                  {
                    nativeEvent: {
                      contentOffset: { y: this.state.scrollYValue },
                    },
                  },
                ],
                { useNativeDriver: false },
                () => {}
              )(event);
            }}>
            <ScrollView
              ref={this.inboxScroll}
              horizontal
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              style={{
                minHeight: Dimensions.get("window").height - 90,
              }}
              snapToInterval={Dimensions.get("screen").width}>
              <View style={{ width: Dimensions.get("screen").width }}>
                <FlatList
                  overScrollMode="always"
                  data={
                    this.state.searchData.length > 0
                      ? this.state.searchData
                      : this.sort(
                          this.props.chatData.filter(
                            (value, index) => value.inboxType
                          )
                        )
                  }
                  extraData={[
                    ...this.state.searchData,
                    ...this.props.chatData.filter(
                      (value, index) => value.inboxType
                    ),
                  ]}
                  renderItem={({ item }) => (
                    <ChatList
                      theme={ChatTheme}
                      item={item}
                      typing={this.state?.typingUsers[item.user.username]}
                      username={this.props.auth?.user?.username}
                      navigation={this.props.navigation}
                    />
                  )}
                  keyExtractor={(item, index) => index}
                  style={{
                    minHeight: Dimensions.get("window").height - 90,
                    paddingTop: 120,
                  }}
                  ListEmptyComponent={<EmptyChat theme={ChatTheme} />}
                />
              </View>
              <View style={{ width: Dimensions.get("screen").width }}>
                <FlatList
                  overScrollMode="always"
                  data={
                    this.state.searchData.length > 0
                      ? this.state.searchData
                      : this.sort(
                          this.props.chatData.filter(
                            (value, index) => !value.inboxType
                          )
                        )
                  }
                  extraData={[
                    ...this.state.searchData,
                    ...this.props.chatData.filter(
                      (value, index) => !value.inboxType
                    ),
                  ]}
                  renderItem={({ item }) => (
                    <ChatList
                      theme={ChatTheme}
                      item={item}
                      typing={this.state?.typingUsers[item.user.username]}
                      username={this.props.auth?.user?.username}
                      navigation={this.props.navigation}
                    />
                  )}
                  keyExtractor={(item, index) => index}
                  style={{
                    minHeight: Dimensions.get("window").height - 90,
                    paddingTop: 120,
                  }}
                  ListEmptyComponent={<EmptyChat theme={ChatTheme} />}
                />
              </View>
            </ScrollView>
          </ScrollRefreshView>
        </View>
      </Layout>
    );
  }
}
const mapStateToProps = (state) => ({
  auth: state.secure.auth,
  chatData: state.main.ChatReducer.list,
  darkTheme: state.main.HomeReducer.darkTheme,
});
export default connect(mapStateToProps, {
  setChatList,
  setShortModal,
  setDarkTheme,
  setLoggedIn,
})(ChatScreen);

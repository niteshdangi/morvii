import React, { Component } from "react";
import styled from "styled-components";
import {
  Animated,
  TouchableOpacity,
  Dimensions,
  Image,
  PanResponder,
  StatusBar,
  Platform,
  StyleSheet,
  FlatList,
  View,
  RefreshControl,
} from "react-native";
import * as Icons from "@expo/vector-icons";
import { setShortModal, setShortModalProps } from "../actions/ShortModal";
import { connect } from "react-redux";
import StoryView from "./home/stories";
import * as Constants from "./Constants";
import {
  Layout,
  Text,
  Divider,
  Spinner,
  Icon,
  TabBar,
  Tab,
  TabView,
  Button,
} from "@ui-kitten/components";
import Ripple from "react-native-material-ripple";
import {
  LongPressGestureHandler,
  TouchableWithoutFeedback,
  State,
  ScrollView,
} from "react-native-gesture-handler";
import { Easing } from "react-native-reanimated";
import MopicsObj from "./profile/MopicObj";
import UserObj from "./profile/UserObj";
import { TouchableRipple } from "react-native-paper";
import { RecommendationObj } from "./home/recommendations";
import { Video } from "expo-av";
import ScrollRefreshView from "./utils/ScrollRefreshView";

const screenHeight = Dimensions.get("window").height * 1.2;
class Trophy extends Component {
  render() {
    return (
      <Layout
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 5,
        }}>
        <Image
          style={{ width: 30, height: 30 }}
          resizeMode="contain"
          source={{ uri: this.props.item.image }}
        />
        <Text appearance="hint">{this.props.item.name}</Text>
      </Layout>
    );
  }
}
class ProfileScreen extends React.Component {
  state = {
    scrollY: new Animated.Value(0),
    user: null,
    loading: true,
    self: false,
  };
  RefreshControl = React.createRef();
  _getHeaderBackgroundColor = () => {
    const { scrollY } = this.state;

    return scrollY.interpolate({
      inputRange: [100, 300],
      outputRange: ["rgba(255,255,255,0.0)", "rgba(255,255,255,1)"],
      extrapolate: "clamp",
      useNativeDriver: true,
    });
  };
  _getHeaderElevation = () => {
    const { scrollY } = this.state;

    return scrollY.interpolate({
      inputRange: [100, 300],
      outputRange: [0, 5],
      extrapolate: "clamp",
      useNativeDriver: true,
    });
  };
  _getHeaderImageOpacity = () => {
    const { scrollY } = this.state;

    return scrollY.interpolate({
      inputRange: [0, 140],
      outputRange: [1, 0],
      extrapolate: "clamp",
      useNativeDriver: true,
    });
  };

  //artist profile image height
  _getImageHeight = () => {
    const { scrollY } = this.state;

    return scrollY.interpolate({
      inputRange: [0, Dimensions.get("screen").height / 2],
      outputRange: [Dimensions.get("screen").height / 2, 20],
      extrapolate: "clamp",
      useNativeDriver: true,
    });
  };

  //header title opacity
  _getHeaderTitleOpacity = () => {
    const { scrollY } = this.state;

    return scrollY.interpolate({
      inputRange: [0, 300, 350],
      outputRange: [0, 0, 1],
      extrapolate: "clamp",
      useNativeDriver: true,
    });
  };

  width = Dimensions.get("window").width;
  getProfile() {
    var user = this.props?.route?.params?.username
      ? this.props?.route?.params?.username
      : this.props?.profile?.username;
    fetch(Constants.API_URL + "/accounts/profile/" + user + "/", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.user.token,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        if (statusCode === 200)
          this.setState({
            user: data,
            loading: false,
            self: data.username === this.props.user.user.username,
          });
        this.RefreshControl.current?.stop();
      })
      .catch(() => {
        this.RefreshControl.current?.stop();
      });
  }
  componentDidMount() {
    this.getProfile();
    this.nav = this.props.navigation.addListener(
      "focus",
      this.getProfile.bind(this)
    );
  }
  follow(accept = false) {
    const url = accept
      ? "/accounts/follow/accept/"
      : "/accounts/follow/request/";
    fetch(Constants.API_URL + url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.user.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user: this.state.user.username }),
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        this.setState({ user: { ...this.state.user, ...data } });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }
  componentDidUpdate() {}
  followers(self, type) {
    self.setState({ auth: this.props.user });
    fetch(
      Constants.API_URL +
        "/accounts/" +
        this.state.user.username +
        "/follow/" +
        type +
        "/",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Token " + this.props.user.token,
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
        self.setState({ loading: false, data: data.data });
      })
      .catch(() => {
        self.setState({ loading: false });
        console.log("error");
      });
  }

  unfollow() {
    fetch(Constants.API_URL + "/accounts/unfollow/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Token " + this.props.user.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user: this.state.user.username }),
    })
      .then((response) => {
        const statusCode = response.status;
        const data = response.json();
        return Promise.all([statusCode, data]);
      })
      .then(([statusCode, data]) => {
        this.setState({ user: { ...this.state.user, ...data } });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }
  render() {
    const headerBackgroundColor = this._getHeaderBackgroundColor();
    const headerElevation = this._getHeaderElevation();
    let scaleValue = new Animated.Value(0);
    const cardScale = scaleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.98, 0.95],
    });
    let transformStyle = {
      transform: [{ scale: cardScale }],
    };
    if (this.state.loading) {
      return (
        <Layout style={{ justifyContent: "center", alignItems: "center" }}>
          <Spinner size="large" />
        </Layout>
      );
    }
    if (this.state.user === null) {
      return (
        <Layout style={{ justifyContent: "center", alignItems: "center" }}>
          <Text>User Not Found</Text>
        </Layout>
      );
    }
    const smaller = Math.random() > 0.5;

    const data = this.state.user?.profile?.mopics;
    const data1 = data.slice(2, (data.length + 2) / 2);
    const data2 = data.slice(
      (data.length + 2) / 2,
      data.length % 2 === 0 ? data.length : data.length - 1
    );
    return (
      <Layout
        style={{
          height: Dimensions.get("screen").height,
        }}>
        <ProfileImage>
          <Animated.View
            style={{
              transform: [
                {
                  translateY: this.state.scrollY.interpolate({
                    inputRange: [0, Dimensions.get("screen").height],
                    outputRange: [0, 0],
                  }),
                },
              ],
              height: this.state.scrollY.interpolate({
                inputRange: [
                  0,
                  Dimensions.get("screen").height / 2,
                  Dimensions.get("screen").height,
                ],
                outputRange: [Dimensions.get("screen").height / 2 + 20, 0, 0],
              }),
            }}>
            {this.state.user.profile?.story ? (
              this.state.user.profile?.story.mediaType?.includes("video") ? (
                <Video
                  source={{
                    uri: this.state.user.profile?.story.uri,
                  }}
                  shouldPlay
                  isMuted
                  // isLooping
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  usePoster
                  posterSource={{
                    uri: this.state.user?.profile?.image,
                  }}
                  posterStyle={{
                    width: "100%",
                    height: "100%",
                    resizeMode: "cover",
                  }}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={{
                    uri: this.state.user.profile?.story.uri,
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  resizeMode="cover"
                />
              )
            ) : (
              <Image
                source={{
                  uri: this.state.user?.profile?.image,
                }}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                resizeMode="cover"
              />
            )}
          </Animated.View>
        </ProfileImage>
        <View
          style={{
            height: 70,
            elevation: 5,
            backgroundColor: "transparent",
            zIndex: 1000,
          }}>
          <Animated.View
            style={{
              backgroundColor: headerBackgroundColor,
              elevation: headerElevation,
              height: 70 + StatusBar.currentHeight,
            }}>
            <>
              <Layout
                style={{
                  backgroundColor: "transparent",
                  marginTop: StatusBar.currentHeight,
                  padding: 5,
                  paddingBottom: 10,
                  elevation: 1,
                  flexDirection: "row",
                  zIndex: 500,
                  justifyContent: "space-between",
                }}>
                <Animated.View
                  style={{
                    opacity: this.state.scrollY.interpolate({
                      inputRange: [
                        0,
                        Dimensions.get("screen").height / 2,
                        Dimensions.get("screen").height,
                      ],
                      outputRange: [1, 0, 0],
                    }),
                  }}>
                  <TouchableOpacity
                    style={{
                      padding: 10,
                      width: 50,
                      marginTop: 5,
                      backgroundColor: "rgba(0,0,0,0.1)",
                      borderRadius: 50,
                      height: 50,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onPress={() => this.props.navigation.goBack()}>
                    <Icon
                      name="arrow-back-outline"
                      style={{
                        width: 27,
                        height: 27,
                        tintColor: "white",
                      }}
                    />
                  </TouchableOpacity>
                </Animated.View>
                <Animated.View
                  style={{
                    position: "absolute",
                    top: 5,
                    left: 5,
                    opacity: this.state.scrollY.interpolate({
                      inputRange: [
                        0,
                        Dimensions.get("screen").height / 2,
                        Dimensions.get("screen").height,
                      ],
                      outputRange: [0, 1, 1],
                    }),
                  }}>
                  <TouchableOpacity
                    style={{
                      padding: 10,
                      width: 50,
                      marginTop: 5,
                      borderRadius: 50,
                      height: 50,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onPress={() => this.props.navigation.goBack()}>
                    <Icon
                      name="arrow-back-outline"
                      style={{
                        width: 27,
                        height: 27,
                        tintColor: "#000",
                      }}
                    />
                  </TouchableOpacity>
                </Animated.View>

                {this.state.self && (
                  <>
                    <Animated.View
                      style={{
                        opacity: this.state.scrollY.interpolate({
                          inputRange: [
                            0,
                            Dimensions.get("screen").height / 2,
                            Dimensions.get("screen").height,
                          ],
                          outputRange: [1, 0, 0],
                        }),
                      }}>
                      <Ripple
                        style={{
                          padding: 10,
                          width: 50,
                          marginTop: 5,
                          backgroundColor: "rgba(0,0,0,0.1)",
                          borderRadius: 50,
                          height: 50,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        onPress={() => {
                          this.props.setShortModal(true, "Options", {
                            component: "settings",
                          });
                        }}>
                        <Icon
                          name="settings-outline"
                          style={{
                            width: 27,
                            height: 27,
                            tintColor: "white",
                          }}
                        />
                      </Ripple>
                    </Animated.View>
                    <Animated.View
                      style={{
                        position: "absolute",
                        top: 5,
                        right: 5,
                        opacity: this.state.scrollY.interpolate({
                          inputRange: [
                            0,
                            Dimensions.get("screen").height / 2,
                            Dimensions.get("screen").height,
                          ],
                          outputRange: [0, 1, 1],
                        }),
                      }}>
                      <Ripple
                        style={{
                          padding: 10,
                          width: 50,
                          marginTop: 5,
                          borderRadius: 50,
                          height: 50,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        onPress={() => {
                          this.props.setShortModal(true, "Options", {
                            component: "settings",
                          });
                        }}>
                        <Icon
                          name="settings-outline"
                          style={{
                            width: 27,
                            height: 27,
                            tintColor: "#333",
                          }}
                        />
                      </Ripple>
                    </Animated.View>
                  </>
                )}
              </Layout>
              <Animated.View
                style={{
                  transform: [
                    {
                      translateX: this.state.scrollY.interpolate({
                        inputRange: [
                          0,
                          Dimensions.get("screen").height / 2 - 250,
                          Dimensions.get("screen").height / 2 - 150,
                          Dimensions.get("screen").height,
                        ],
                        outputRange: [20, 20, 70, 70],
                      }),
                    },
                    {
                      translateY: this.state.scrollY.interpolate({
                        inputRange: [
                          0,

                          Dimensions.get("screen").height / 2 - 160,
                          Dimensions.get("screen").height / 2 - 150,
                          Dimensions.get("screen").height,
                        ],
                        outputRange: [
                          Dimensions.get("screen").height / 2 - 160,
                          -Dimensions.get("screen").height / 2 + 415,
                          -60,
                          -60,
                        ],
                      }),
                    },
                  ],
                }}>
                <Layout
                  style={{
                    flexDirection: "row",
                    backgroundColor: "transparent",
                  }}>
                  <Animated.View
                    style={{
                      marginTop: this.state.scrollY.interpolate({
                        inputRange: [
                          0,
                          Dimensions.get("screen").height / 2 - 250,
                          Dimensions.get("screen").height / 2 - 150,
                          Dimensions.get("screen").height,
                        ],
                        outputRange: [-20, -20, 0, 0],
                      }),
                      elevation: 5,
                      margin: 3,
                      marginRight: 10,
                      borderRadius: this.state.scrollY.interpolate({
                        inputRange: [
                          0,
                          Dimensions.get("screen").height / 2 - 250,
                          Dimensions.get("screen").height / 2 - 150,
                          Dimensions.get("screen").height,
                        ],
                        outputRange: [5, 5, 50, 50],
                      }),
                    }}>
                    <TouchableWithoutFeedback
                      onPress={() => {
                        this.props.setShortModal(true, "StoryView", {
                          story: [{ user: this.state.user }],
                          index: 0,
                        });
                      }}
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
                      }}>
                      <Animated.View style={transformStyle}>
                        <Layout
                          style={{
                            borderRadius: 5,
                            backgroundColor: "transparent",
                          }}>
                          <Animated.Image
                            source={{
                              uri: this.state.user?.profile?.image,
                            }}
                            style={{
                              width: 50,
                              height: this.state.scrollY.interpolate({
                                inputRange: [
                                  0,
                                  Dimensions.get("screen").height / 2 - 250,
                                  Dimensions.get("screen").height / 2 - 150,
                                  Dimensions.get("screen").height,
                                ],
                                outputRange: [70, 70, 50, 50],
                              }),
                              borderRadius: this.state.scrollY.interpolate({
                                inputRange: [
                                  0,
                                  Dimensions.get("screen").height / 2 - 250,
                                  Dimensions.get("screen").height / 2 - 150,
                                  Dimensions.get("screen").height,
                                ],
                                outputRange: [5, 5, 50, 50],
                              }),
                            }}
                          />
                        </Layout>
                      </Animated.View>
                    </TouchableWithoutFeedback>
                  </Animated.View>
                  <Layout
                    style={{
                      justifyContent: "space-evenly",
                      backgroundColor: "transparent",
                    }}>
                    {(
                      this.state.user?.first_name + this.state.user?.last_name
                    ).trim() !== "" && (
                      <Text category="h5">
                        {this.state.user?.first_name +
                          " " +
                          this.state.user?.last_name}
                      </Text>
                    )}
                    <Text
                      appearance={
                        (
                          this.state.user?.first_name +
                          this.state.user?.last_name
                        ).trim() !== ""
                          ? "hint"
                          : "default"
                      }
                      style={{ marginTop: -5 }}>
                      @{this.state.user?.username}
                    </Text>
                  </Layout>
                </Layout>
              </Animated.View>
            </>
          </Animated.View>
        </View>
        <ScrollRefreshView
          ref={this.RefreshControl}
          style={{ flex: 1 }}
          onRefresh={() => {
            this.getProfile();
          }}
          releaseDelay={1}
          onRelease={() => {
            Animated.spring(this.state.scrollY, {
              toValue: 0,
              useNativeDriver: false,
            }).start();
          }}
          onRefreshScroll={(e) => {
            Animated.timing(this.state.scrollY, {
              toValue: -e * 0.4,
              duration: 0,
              useNativeDriver: false,
            }).start();
          }}
          onScroll={(event) => {
            Animated.event(
              [
                {
                  nativeEvent: { contentOffset: { y: this.state.scrollY } },
                },
              ],
              { useNativeDriver: false }
            )(event);
          }}>
          <Animated.ScrollView
            nestedScrollEnabled={true}
            overScrollMode={"never"}
            ref={(myScroll) => (this._myScroll = myScroll)}
            style={{
              elevation: 0,
            }}
            scrollEventThrottle={16}>
            <Layout
              style={{
                height: Dimensions.get("window").height / 2 + 50,
                backgroundColor: "transparent",
                marginBottom: -76,
              }}
            />
            <Body>
              <Layout
                style={{
                  elevation: 5,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  borderRadius: 15,
                  margin: 15,
                  marginTop: -76,
                  padding: 10,
                  paddingHorizontal: 15,
                }}>
                <Layout
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}>
                  <Layout style={{ height: 70 }}></Layout>
                  <Layout style={{ flexDirection: "row" }}>
                    <Icons.FontAwesome name="star-o" size={24} color="black" />
                    <Text style={{ marginLeft: 5 }}>
                      {this.state.user?.profile?.rating}
                    </Text>
                  </Layout>
                </Layout>
                <Text
                  appearance="hint"
                  style={{ marginTop: -25, paddingBottom: 3 }}>
                  Influencer
                </Text>
                <Divider />
                <Layout
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-around",
                    alignItems: "center",
                    paddingTop: 10,
                    paddingBottom: 10,
                  }}>
                  <Ripple
                    onPress={() => {
                      this.props.navigation.navigate("MopicScreen");
                    }}
                    style={{
                      alignItems: "center",
                      padding: 10,
                    }}>
                    <Text appearance="hint">Mopics</Text>
                    <Text category="h6">
                      {this.state.user?.profile?.mopics?.length}
                    </Text>
                  </Ripple>
                  <Ripple
                    onPress={() => {
                      this.props.navigation.navigate("UserListScreen", {
                        header: this.state.self
                          ? "Friends"
                          : this.state.user.username + "'s Friends",
                        data: (self) => {
                          this.followers(self, "friends");
                        },
                      });
                    }}
                    style={{
                      alignItems: "center",
                      padding: 10,
                    }}>
                    <Text appearance="hint">Friends</Text>
                    <Text category="h6">
                      {this.state.user?.profile?.friends}
                    </Text>
                  </Ripple>
                  <Ripple
                    onPress={() => {
                      this.props.navigation.navigate("UserListScreen", {
                        header: this.state.self
                          ? "Fans"
                          : this.state.user.username + "'s Friends",
                        data: (self) => {
                          this.followers(self, "fans");
                        },
                      });
                    }}
                    style={{
                      alignItems: "center",
                      padding: 10,
                    }}>
                    <Text appearance="hint">Fans</Text>
                    <Text category="h6">{this.state.user?.profile?.fans}</Text>
                  </Ripple>
                  <Ripple
                    onPress={() => {
                      this.props.navigation.navigate("UserListScreen", {
                        header: this.state.self
                          ? "Following"
                          : this.state.user.username + "'s Friends",
                        data: (self) => {
                          this.followers(self, "following");
                        },
                      });
                    }}
                    style={{
                      alignItems: "center",
                      padding: 10,
                    }}>
                    <Text appearance="hint">Following</Text>
                    <Text category="h6">
                      {this.state.user?.profile?.following}
                    </Text>
                  </Ripple>
                </Layout>
              </Layout>
              <Layout
                style={{
                  elevation: 5,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  borderRadius: 15,
                  margin: 15,
                  marginTop: -5,
                  padding: 10,
                  paddingHorizontal: 15,
                }}>
                {this.state?.user?.trophy?.length > 0 && (
                  <>
                    <ScrollView
                      horizontal={true}
                      showsHorizontalScrollIndicator={false}
                      showsVerticalScrollIndicator={false}
                      style={{ marginBottom: 10 }}>
                      {this.state?.user?.trophy?.map((item) => (
                        <Trophy item={item} />
                      ))}
                    </ScrollView>
                    <Divider />
                  </>
                )}
                {/* <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                style={{ marginVertical: 10 }}>
                
              </ScrollView> */}
                {this.state.user?.profile?.bio ? (
                  <Text style={{ padding: 5 }}>
                    {this.state.user?.profile?.bio}
                  </Text>
                ) : null}
                {this.state.user?.profile?.bio ? <Divider /> : null}
                {!this.state.self && (
                  <Layout
                    style={{
                      justifyContent: "space-around",
                      alignItems: "center",
                      flexDirection: "row",
                    }}>
                    <Layout
                      style={{
                        margin: 5,
                        elevation: 1,
                        borderRadius: 10,
                        overflow: "hidden",
                      }}>
                      {this.state.user.accept ? (
                        <Ripple
                          onPress={() => this.follow(true)}
                          style={{
                            padding: 5,
                            paddingHorizontal: 10,
                            minWidth: Dimensions.get("window").width / 2.5,
                            justifyContent: "center",
                            alignItems: "center",
                          }}>
                          <Text>Accept</Text>
                        </Ripple>
                      ) : this.state.user.requested ? (
                        <Ripple
                          style={{
                            padding: 5,
                            paddingHorizontal: 10,
                            minWidth: Dimensions.get("window").width / 2.5,
                            justifyContent: "center",
                            alignItems: "center",
                          }}>
                          <Text>Requested</Text>
                        </Ripple>
                      ) : this.state.user.following !== null ? (
                        !this.state.user.following ? (
                          this.state.user.followback ? (
                            <Ripple
                              onPress={() => this.follow()}
                              style={{
                                padding: 5,
                                paddingHorizontal: 10,
                                minWidth: Dimensions.get("window").width / 2.5,
                                justifyContent: "center",
                                alignItems: "center",
                              }}>
                              <Text>Follow Back</Text>
                            </Ripple>
                          ) : (
                            <Ripple
                              onPress={() => this.follow()}
                              style={{
                                padding: 5,
                                paddingHorizontal: 10,
                                minWidth: Dimensions.get("window").width / 2.5,
                                justifyContent: "center",
                                alignItems: "center",
                              }}>
                              <Text>Follow</Text>
                            </Ripple>
                          )
                        ) : (
                          <Ripple
                            onPress={() => this.unfollow()}
                            style={{
                              padding: 5,
                              paddingHorizontal: 10,
                              minWidth: Dimensions.get("window").width / 2.5,
                              justifyContent: "center",
                              alignItems: "center",
                            }}>
                            <Text>Following</Text>
                          </Ripple>
                        )
                      ) : null}
                    </Layout>
                    <Layout
                      style={{
                        margin: 5,
                        elevation: 1,
                        borderRadius: 10,
                        overflow: "hidden",
                      }}>
                      <Ripple
                        onPress={() =>
                          this.props.navigation.navigate("MessageScreen", {
                            user: this.state.user,
                          })
                        }
                        style={{
                          padding: 5,
                          paddingHorizontal: 10,
                          minWidth: Dimensions.get("window").width / 2.5,
                          justifyContent: "center",
                          alignItems: "center",
                        }}>
                        <Text>Message</Text>
                      </Ripple>
                    </Layout>
                  </Layout>
                )}
              </Layout>
              <Divider />

              <Layout
                style={{
                  marginBottom: 120,
                  minHeight: Dimensions.get("screen").height - 310,
                }}>
                {!this.state.user?.isVisible && (
                  <Text category="h5" style={{ margin: 20 }}>
                    Private Account
                  </Text>
                )}
                {data.length > 0 && (
                  <Text category="h5" style={{ margin: 20 }}>
                    Mopics
                  </Text>
                )}
                {data.length > 1 ? (
                  <Layout
                    style={{
                      flexDirection: "row",
                      backgroundColor: "transparent",
                    }}>
                    <RecommendationObj
                      item={{ ...data[0], user: this.state.user }}
                      navigation={this.props.navigation}
                      smaller={smaller}
                      token={this.props.token}
                    />
                    <RecommendationObj
                      item={{ ...data[1], user: this.state.user }}
                      navigation={this.props.navigation}
                      smaller={!smaller}
                      token={this.props.token}
                    />
                  </Layout>
                ) : data.length == 1 ? (
                  <Layout
                    style={{ justifyContent: "center", alignItems: "center" }}>
                    <RecommendationObj
                      item={{ ...data[0], user: this.state.user }}
                      navigation={this.props.navigation}
                      token={this.props.token}
                      width={Dimensions.get("screen").width - 50}
                    />
                  </Layout>
                ) : null}
                <Layout
                  style={{
                    flexDirection: "row",
                    backgroundColor: "transparent",
                  }}>
                  <Layout style={smaller ? { marginTop: -50 } : {}}>
                    {data1.map((item, index) => {
                      return (
                        <RecommendationObj
                          item={{ ...item, user: this.state.user }}
                          key={index}
                          navigation={this.props.navigation}
                          smallerShift={
                            smaller ? index % 2 === 0 : index % 2 !== 0
                          }
                          smaller={!smaller && index === data2.length - 1}
                          token={this.props.token}
                        />
                      );
                    })}
                  </Layout>
                  <Layout style={!smaller ? { marginTop: -50 } : {}}>
                    {data2.map((item, index) => {
                      return (
                        <RecommendationObj
                          item={{ ...item, user: this.state.user }}
                          key={index}
                          navigation={this.props.navigation}
                          smallerShift={
                            smaller ? index % 2 === 0 : index % 2 !== 0
                          }
                          smaller={smaller && index === data2.length - 1}
                          token={this.props.token}
                        />
                      );
                    })}
                  </Layout>
                </Layout>
                {data.length % 2 !== 0 && data.length > 1 && (
                  <Layout
                    style={{ justifyContent: "center", alignItems: "center" }}>
                    <RecommendationObj
                      item={{ ...data[data.length - 1], user: this.state.user }}
                      navigation={this.props.navigation}
                      token={this.props.token}
                      width={Dimensions.get("screen").width - 50}
                    />
                  </Layout>
                )}
              </Layout>
            </Body>
          </Animated.ScrollView>
        </ScrollRefreshView>
      </Layout>
    );
  }
}

const ProfileImage = styled.View`
  position: absolute;
  height: ${Dimensions.get("window").height / 2 + 50}px;
  width: 100%;
  z-index: -1;
`;
const Body = styled.View`
  padding-bottom: 100px;
  z-index: 0;
`;

const mapStateToProps = (state) => ({
  ShortModal: state.main.ShortModal,
  user: state.secure.auth,
});

export default connect(mapStateToProps, { setShortModal, setShortModalProps })(
  ProfileScreen
);
